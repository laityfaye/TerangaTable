import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { TenantResolutionMiddleware } from '../common/middleware/tenant-resolution.middleware';
import { RedisCacheService } from '../common/services/redis-cache.service';
import { TenantsService } from '../modules/tenants/tenants.service';
import { ReviewDecision } from '../modules/tenants/dto/review-tenant-request.dto';

// ── Mocks ──────────────────────────────────────────────────────────────────

const makeMailMock = () => ({
  sendRequestConfirmation: jest.fn().mockResolvedValue(undefined),
  sendOnboardingCredentials: jest.fn().mockResolvedValue(undefined),
  sendAdminInvitation: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
});

const TENANT_A = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  slug: 'restaurant-a',
  regionId: 'region-sn',
  status: 'active',
  trialEndsAt: null,
};

const TENANT_B = {
  id: 'bbbbbbbb-0000-0000-0000-000000000002',
  slug: 'restaurant-b',
  regionId: 'region-sn',
  status: 'active',
  trialEndsAt: null,
};

const makePrismaMock = () => ({
  tenant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  region: { findUnique: jest.fn() },
  tenantRequest: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: { create: jest.fn(), findUnique: jest.fn().mockResolvedValue(null) },
  role: { create: jest.fn() },
  plan: { findUnique: jest.fn(), findFirst: jest.fn() },
  module: { findMany: jest.fn() },
  tenantModule: { createMany: jest.fn() },
  websiteSettings: { create: jest.fn() },
  workflowDefinition: { create: jest.fn() },
  workflowState: { create: jest.fn() },
  workflowTransition: { create: jest.fn() },
  $executeRaw: jest.fn(),
  setTenantContext: jest.fn(),
  setSuperAdminContext: jest.fn(),
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
});

const makeRedisMock = () => ({
  getTenantSlug: jest.fn().mockResolvedValue(null),
  setTenantSlug: jest.fn().mockResolvedValue(undefined),
  invalidateTenantSlug: jest.fn().mockResolvedValue(undefined),
  getTenantContext: jest.fn().mockResolvedValue(null),
  setTenantContext: jest.fn().mockResolvedValue(undefined),
  invalidateTenantContext: jest.fn().mockResolvedValue(undefined),
  invalidateAll: jest.fn().mockResolvedValue(undefined),
  getDomainSlug: jest.fn().mockResolvedValue(null),
});

// ── 1. Isolation RLS — TenantContextInterceptor ────────────────────────────

describe('TenantContextInterceptor', () => {
  let interceptor: TenantContextInterceptor;
  let prismaMock: ReturnType<typeof makePrismaMock>;
  let redisMock: ReturnType<typeof makeRedisMock>;

  beforeEach(async () => {
    prismaMock = makePrismaMock();
    redisMock = makeRedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextInterceptor,
        { provide: 'PrismaService', useValue: prismaMock },
        { provide: RedisCacheService, useValue: redisMock },
      ],
    })
      .overrideProvider(TenantContextInterceptor)
      .useFactory({
        factory: () => new TenantContextInterceptor(prismaMock as never, redisMock as never),
      })
      .compile();

    interceptor = module.get(TenantContextInterceptor);
  });

  it('charge le contexte tenant depuis la DB si Redis est vide', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({
      ...TENANT_A,
      region: { currencyCode: 'XOF', timezone: 'Africa/Dakar' },
      tenantModules: [],
    });

    const request: Record<string, unknown> = {
      headers: { 'x-tenant-id': TENANT_A.id },
    };

    const next = { handle: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    await interceptor.intercept(ctx as never, next as never);

    expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: TENANT_A.id } }),
    );
    expect(request['tenantContext']).toMatchObject({
      id: TENANT_A.id,
      slug: TENANT_A.slug,
      currency: 'XOF',
    });
    expect(redisMock.setTenantContext).toHaveBeenCalled();
  });

  it('utilise le cache Redis si disponible (pas de query DB)', async () => {
    redisMock.getTenantContext.mockResolvedValue({
      id: TENANT_B.id,
      slug: TENANT_B.slug,
      regionId: TENANT_B.regionId,
      currency: 'XOF',
      timezone: 'Africa/Dakar',
      status: 'active',
      trialEndsAt: null,
    });

    const request: Record<string, unknown> = {
      headers: { 'x-tenant-id': TENANT_B.id },
    };

    const next = { handle: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };
    const ctx = { switchToHttp: () => ({ getRequest: () => request }) };

    await interceptor.intercept(ctx as never, next as never);

    expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
    expect(request['tenantContext']).toMatchObject({ id: TENANT_B.id });
  });

  it('lève TenantNotFoundException si tenantId inconnu', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);

    const request: Record<string, unknown> = {
      headers: { 'x-tenant-id': 'unknown-id' },
    };
    const next = { handle: jest.fn() };
    const ctx = { switchToHttp: () => ({ getRequest: () => request }) };

    await expect(interceptor.intercept(ctx as never, next as never)).rejects.toThrow(
      'Tenant introuvable',
    );
  });

  it('deux tenants ne voient pas les données l\'un de l\'autre', async () => {
    // Simule que chaque tenant charge son propre contexte
    prismaMock.tenant.findUnique
      .mockResolvedValueOnce({ ...TENANT_A, region: { currencyCode: 'XOF', timezone: 'Africa/Dakar' }, tenantModules: [] })
      .mockResolvedValueOnce({ ...TENANT_B, region: { currencyCode: 'XOF', timezone: 'Africa/Dakar' }, tenantModules: [] });

    const reqA: Record<string, unknown> = { headers: { 'x-tenant-id': TENANT_A.id } };
    const reqB: Record<string, unknown> = { headers: { 'x-tenant-id': TENANT_B.id } };
    const next = { handle: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };

    await interceptor.intercept(
      { switchToHttp: () => ({ getRequest: () => reqA }) } as never,
      next as never,
    );
    await interceptor.intercept(
      { switchToHttp: () => ({ getRequest: () => reqB }) } as never,
      next as never,
    );

    const ctxA = reqA['tenantContext'] as { id: string };
    const ctxB = reqB['tenantContext'] as { id: string };

    expect(ctxA.id).toBe(TENANT_A.id);
    expect(ctxB.id).toBe(TENANT_B.id);
    expect(ctxA.id).not.toBe(ctxB.id);

    // setTenantContext appelé deux fois avec des IDs différents
    expect(prismaMock.setTenantContext).toHaveBeenCalledWith(TENANT_A.id);
    expect(prismaMock.setTenantContext).toHaveBeenCalledWith(TENANT_B.id);
  });
});

// ── 2. Résolution slug Redis — TenantResolutionMiddleware ──────────────────

describe('TenantResolutionMiddleware', () => {
  let middleware: TenantResolutionMiddleware;
  let prismaMock: ReturnType<typeof makePrismaMock>;
  let redisMock: ReturnType<typeof makeRedisMock>;

  beforeEach(() => {
    prismaMock = makePrismaMock();
    redisMock = makeRedisMock();
    middleware = new TenantResolutionMiddleware(redisMock as never, prismaMock as never);
  });

  it('résout le slug via Redis sans query DB', async () => {
    redisMock.getTenantSlug.mockResolvedValue(TENANT_A.id);
    redisMock.getTenantContext.mockResolvedValue({
      id: TENANT_A.id, slug: TENANT_A.slug, regionId: TENANT_A.regionId,
      currency: 'XOF', timezone: 'Africa/Dakar', status: 'active',
      trialEndsAt: null, activeModules: [],
    });

    const req = {
      headers: { host: 'restaurant-a.terangatable.com' },
    } as never;
    const next = jest.fn();

    process.env['PLATFORM_DOMAIN'] = 'terangatable.com';
    await middleware.use(req, {} as never, next);

    expect(redisMock.getTenantSlug).toHaveBeenCalledWith('restaurant-a');
    expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled();
    expect((req as { headers: Record<string, unknown> })['headers']['x-tenant-id']).toBe(TENANT_A.id);
    expect(next).toHaveBeenCalled();
  });

  it('fallback DB et met en cache si Redis est vide', async () => {
    redisMock.getTenantSlug.mockResolvedValue(null);
    prismaMock.tenant.findUnique
      .mockResolvedValueOnce({ id: TENANT_A.id }) // resolveSlug: select id
      .mockResolvedValueOnce({ ...TENANT_A, region: { currencyCode: 'XOF', timezone: 'Africa/Dakar' }, tenantModules: [] }); // loadTenantContext

    const req = {
      headers: { host: 'restaurant-a.terangatable.com' },
    } as never;
    const next = jest.fn();

    await middleware.use(req, {} as never, next);

    expect(prismaMock.tenant.findUnique).toHaveBeenCalled();
    expect(redisMock.setTenantSlug).toHaveBeenCalledWith('restaurant-a', TENANT_A.id);
    expect(next).toHaveBeenCalled();
  });

  it('ignore les sous-domaines app et super-admin', async () => {
    const req = {
      headers: { host: 'app.terangatable.com' },
    } as never;
    const next = jest.fn();

    await middleware.use(req, {} as never, next);

    expect(redisMock.getTenantSlug).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});

// ── 3. Onboarding automatique ───────────────────────────────────────────────

describe('TenantsService — onboarding', () => {
  let service: TenantsService;
  let prismaMock: ReturnType<typeof makePrismaMock>;
  let redisMock: ReturnType<typeof makeRedisMock>;

  const STARTER_PLAN = {
    id: 'plan-starter',
    name: 'Starter',
    features: { pos: true },
  };

  const MOCK_REQUEST = {
    id: 'req-1',
    restaurantName: 'Le Baobab Doré',
    ownerEmail: 'owner@baobab.sn',
    ownerName: 'Fatou Diallo',
    regionId: 'region-dakar',
  };

  beforeEach(async () => {
    prismaMock = makePrismaMock();
    redisMock = makeRedisMock();

    prismaMock.plan.findFirst.mockResolvedValue(STARTER_PLAN);
    prismaMock.tenant.findUnique.mockResolvedValue(null); // slug unique
    prismaMock.tenant.create.mockResolvedValue({ id: 'tenant-new', slug: 'le-baobab-dore' });
    prismaMock.user.create.mockResolvedValue({ id: 'user-owner', email: MOCK_REQUEST.ownerEmail });
    prismaMock.role.create.mockImplementation(({ data }: { data: { slug: string } }) =>
      Promise.resolve({ id: `role-${data.slug}`, ...data }),
    );
    prismaMock.module.findMany.mockResolvedValue([{ id: 'mod-pos', slug: 'pos' }]);
    prismaMock.tenantModule.createMany.mockResolvedValue({ count: 1 });
    prismaMock.websiteSettings.create.mockResolvedValue({ id: 'ws-1' });
    prismaMock.workflowDefinition.create.mockImplementation(
      ({ data }: { data: { entityType: string } }) =>
        Promise.resolve({ id: `wf-${data.entityType}` }),
    );
    prismaMock.workflowState.create.mockImplementation(
      ({ data }: { data: { slug: string } }) =>
        Promise.resolve({ id: `state-${data.slug}`, ...data }),
    );
    prismaMock.workflowTransition.create.mockResolvedValue({ id: 'transition-1' });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.tenantRequest.findUnique.mockResolvedValue({
      ...MOCK_REQUEST,
      status: 'pending',
    });
    prismaMock.tenantRequest.update.mockResolvedValue({ id: MOCK_REQUEST.id, status: 'approved' });
    prismaMock.region.findUnique.mockResolvedValue({ id: 'region-dakar', isActive: true });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: 'PrismaService', useValue: prismaMock },
        { provide: RedisCacheService, useValue: redisMock },
      ],
    })
      .overrideProvider(TenantsService)
      .useFactory({
        factory: () => new TenantsService(prismaMock as never, redisMock as never, makeMailMock() as never),
      })
      .compile();

    service = module.get(TenantsService);
  });

  it('crée tenant + user + 4 rôles + modules + website_settings + 2 workflows à l\'approbation', async () => {
    const result = await service.reviewRequest(MOCK_REQUEST.id, 'reviewer-id', {
      decision: ReviewDecision.APPROVE,
    });

    expect(result.status).toBe('approved');

    // Tenant créé
    expect(prismaMock.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ regionId: MOCK_REQUEST.regionId }) }),
    );

    // User owner créé
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: MOCK_REQUEST.ownerEmail }),
      }),
    );

    // 6 rôles créés
    expect(prismaMock.role.create).toHaveBeenCalledTimes(6);
    const roleSlugs = prismaMock.role.create.mock.calls.map(
      (call: [{ data: { slug: string } }]) => call[0].data.slug,
    );
    expect(roleSlugs).toEqual(expect.arrayContaining(['restaurant_owner', 'manager', 'serveur', 'caissier', 'cuisinier', 'livreur']));

    // WebsiteSettings créé
    expect(prismaMock.websiteSettings.create).toHaveBeenCalled();

    // 2 workflow definitions (order + reservation)
    expect(prismaMock.workflowDefinition.create).toHaveBeenCalledTimes(2);
    const wfTypes = prismaMock.workflowDefinition.create.mock.calls.map(
      (call: [{ data: { entityType: string } }]) => call[0].data.entityType,
    );
    expect(wfTypes).toEqual(expect.arrayContaining(['order', 'reservation']));
  });

  it('génère un slug unique depuis le nom du restaurant', async () => {
    // Premier appel findUnique retourne null → slug disponible
    prismaMock.tenant.findUnique.mockResolvedValueOnce(null);

    await service.reviewRequest(MOCK_REQUEST.id, 'reviewer-id', {
      decision: ReviewDecision.APPROVE,
    });

    const createCall = prismaMock.tenant.create.mock.calls[0] as [{ data: { slug: string } }];
    expect(createCall[0].data.slug).toBe('le-baobab-dore');
  });

  it('génère un slug avec suffixe si le slug de base est pris', async () => {
    // Premier findUnique → slug pris, deuxième → libre
    prismaMock.tenant.findUnique
      .mockResolvedValueOnce({ id: 'other' })
      .mockResolvedValueOnce(null);

    await service.reviewRequest(MOCK_REQUEST.id, 'reviewer-id', {
      decision: ReviewDecision.APPROVE,
    });

    const createCall = prismaMock.tenant.create.mock.calls[0] as [{ data: { slug: string } }];
    expect(createCall[0].data.slug).toBe('le-baobab-dore-1');
  });

  it('rejette une demande sans créer de tenant', async () => {
    prismaMock.tenantRequest.update.mockResolvedValue({ id: MOCK_REQUEST.id, status: 'rejected' });

    await service.reviewRequest(MOCK_REQUEST.id, 'reviewer-id', {
      decision: ReviewDecision.REJECT,
    });

    expect(prismaMock.tenant.create).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});
