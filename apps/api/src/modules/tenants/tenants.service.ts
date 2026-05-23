import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { MailService } from '../../common/mail/mail.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateTenantRequestDto } from './dto/create-tenant-request.dto';
import { ReviewTenantRequestDto, ReviewDecision } from './dto/review-tenant-request.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { InviteAdminDto, AdminRole } from './dto/invite-admin.dto';
import { ToggleAdminDto } from './dto/toggle-admin.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisCacheService,
    private readonly mail: MailService,
  ) {}

  // ── Tenants ───────────────────────────────────────────────────────────────

  async findAll(dto: ListTenantsDto) {
    const { page = 1, limit = 20, regionId, status } = dto;
    const skip = (page - 1) * limit;

    const where = {
      ...(regionId && { regionId }),
      ...(status && { status: status as never }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          region: { select: { name: true, slug: true } },
          plan: { select: { name: true } },
          _count: { select: { users: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const data = rows.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      region_id: t.regionId,
      region_name: t.region.name,
      plan: (t.plan?.name?.toLowerCase() ?? 'starter') as
        | 'starter'
        | 'growth'
        | 'enterprise',
      status: t.status as 'active' | 'trial' | 'suspended' | 'deleted',
      created_at: t.createdAt.toISOString(),
      users_count: t._count.users,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Le slug "${dto.slug}" est déjà utilisé`);

    const tenant = await this.prisma.tenant.create({
      data: {
        regionId: dto.regionId,
        slug: dto.slug,
        name: dto.name,
        planId: dto.planId,
        status: 'active',
      },
    });

    return tenant;
  }

  async updateStatus(id: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant introuvable');

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: dto.status as never },
    });

    await this.redis.invalidateAll(tenant.id, tenant.slug);

    return updated;
  }

  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant introuvable');
    if (tenant.status === 'deleted') throw new BadRequestException('Ce tenant est déjà supprimé');

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'deleted' as never },
    });

    await this.redis.invalidateAll(tenant.id, tenant.slug);

    // Révoquer la demande d'inscription approuvée liée à ce tenant
    await (this.prisma.tenantRequest as any).updateMany({
      where: { tenantId: id, status: 'approved' as never },
      data: { status: 'revoked' as never },
    });

    return { data: { id: updated.id, status: 'deleted' } };
  }

  async deleteRequest(id: string) {
    const request = await this.prisma.tenantRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande introuvable');
    if ((request.status as string) === 'pending') {
      throw new BadRequestException('Une demande en attente ne peut pas être supprimée');
    }

    await this.prisma.tenantRequest.delete({ where: { id } });

    return { data: { id } };
  }

  async purgeTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant introuvable');
    if (tenant.status !== 'deleted') {
      throw new BadRequestException('Le tenant doit être supprimé (soft-delete) avant la purge');
    }

    await this.redis.invalidateAll(tenant.id, tenant.slug);
    await this.prisma.tenant.delete({ where: { id } });

    return { data: { id } };
  }

  // ── Dashboard Stats ───────────────────────────────────────────────────────

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeTenants, pendingRequests, newThisMonth] = await Promise.all([
      this.prisma.tenant.count({ where: { status: 'active' } }),
      this.prisma.tenantRequest.count({ where: { status: 'pending' } }),
      this.prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    return {
      active_tenants: activeTenants,
      pending_requests: pendingRequests,
      new_this_month: newThisMonth,
    };
  }

  // ── Tenant Requests ───────────────────────────────────────────────────────

  async findAllRequests(regionId?: string) {
    const rows = await this.prisma.tenantRequest.findMany({
      where: { ...(regionId && { regionId }) },
      orderBy: { createdAt: 'desc' },
      include: {
        region: { select: { name: true, slug: true } },
        reviewer: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const data = rows.map((r, i) => ({
      id: r.id,
      req_number: `REQ-${r.createdAt.getFullYear()}-${String(rows.length - i).padStart(4, '0')}`,
      restaurant_name: r.restaurantName,
      owner_name: r.ownerName,
      email: r.ownerEmail,
      phone: r.phone ?? undefined,
      region_id: r.regionId,
      region_name: r.region.name,
      city: r.city ?? undefined,
      message: r.message ?? undefined,
      desired_modules: [] as string[],
      status: r.status as 'pending' | 'approved' | 'rejected',
      rejection_reason: undefined as string | undefined,
      created_at: r.createdAt.toISOString(),
      reviewed_at: r.reviewedAt?.toISOString() ?? undefined,
    }));

    return { data };
  }

  async createRequest(dto: CreateTenantRequestDto) {
    // Vérifier que la région existe et est active
    const region = await this.prisma.region.findUnique({
      where: { id: dto.regionId, isActive: true },
    });
    if (!region) throw new NotFoundException('Région introuvable ou inactive');

    const request = await this.prisma.tenantRequest.create({
      data: {
        regionId: dto.regionId,
        ownerName: dto.ownerName,
        ownerEmail: dto.ownerEmail,
        restaurantName: dto.restaurantName,
        phone: dto.phone,
        city: dto.city,
        message: dto.message,
        status: 'pending',
      },
    });

    await this.mail.sendRequestConfirmation(dto.ownerEmail, dto.ownerName, dto.restaurantName);

    return request;
  }

  async reviewRequest(id: string, reviewerId: string, dto: ReviewTenantRequestDto) {
    const request = await this.prisma.tenantRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const newStatus = dto.decision === ReviewDecision.APPROVE ? 'approved' : 'rejected';

    const updated = await this.prisma.tenantRequest.update({
      where: { id },
      data: {
        status: newStatus as never,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    if (dto.decision === ReviewDecision.APPROVE) {
      try {
        await this.onboardTenant(request, dto.planId);
      } catch (err) {
        // Rollback : remettre la demande en pending si l'onboarding échoue
        await this.prisma.tenantRequest.update({
          where: { id },
          data: { status: 'pending' as never, reviewedBy: null, reviewedAt: null },
        });
        throw err;
      }
    }

    return updated;
  }

  // ── Onboarding automatique ────────────────────────────────────────────────

  private async onboardTenant(
    request: {
      id: string;
      restaurantName: string;
      ownerEmail: string;
      ownerName: string;
      regionId: string;
    },
    planId?: string,
  ) {
    // Résoudre le plan (défaut : Starter)
    const plan = planId
      ? await this.prisma.plan.findUnique({ where: { id: planId } })
      : await this.prisma.plan.findFirst({ where: { name: 'Starter', isActive: true } });

    if (!plan) throw new BadRequestException('Plan introuvable');

    // Vérifier l'email avant toute création en base
    const existingUser = await this.prisma.user.findUnique({ where: { email: request.ownerEmail } });
    if (existingUser) {
      throw new ConflictException(
        `Un compte existe déjà avec l'email ${request.ownerEmail}. Modifiez l'email de la demande avant d'approuver.`,
      );
    }

    // 1. Générer un slug unique depuis le nom du restaurant
    const slug = await this.generateUniqueSlug(request.restaurantName);

    // 2. Créer le tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        regionId: request.regionId,
        slug,
        name: request.restaurantName,
        planId: plan.id,
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
    });

    // 3. Créer le user owner avec mot de passe temporaire
    const [firstName, ...lastParts] = request.ownerName.split(' ');
    const lastName = lastParts.join(' ') || 'Owner';
    const tempPassword = randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const owner = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: request.ownerEmail,
        passwordHash,
        firstName: firstName ?? 'Owner',
        lastName,
        isActive: true,
      },
    });

    // 4. Créer les rôles par défaut
    const defaultRoles = [
      { name: 'Propriétaire', slug: 'restaurant_owner', description: 'Accès complet au restaurant' },
      { name: 'Manager', slug: 'manager', description: 'Gestion opérationnelle' },
      { name: 'Serveur', slug: 'serveur', description: 'Prise de commandes' },
      { name: 'Caissier', slug: 'caissier', description: 'Encaissements' },
      { name: 'Cuisinier', slug: 'cuisinier', description: 'Préparation des plats' },
      { name: 'Livreur', slug: 'livreur', description: 'Livraisons' },
    ];

    const createdRoles: Record<string, string> = {};
    for (const roleData of defaultRoles) {
      const role = await this.prisma.role.create({
        data: { tenantId: tenant.id, ...roleData, isSystem: true },
      });
      createdRoles[roleData.slug] = role.id;
    }

    // 5. Assigner le rôle owner au user créé
    if (createdRoles['restaurant_owner']) {
      await this.prisma.$executeRaw`
        INSERT INTO user_roles (user_id, role_id, tenant_id)
        VALUES (${owner.id}::uuid, ${createdRoles['restaurant_owner']}::uuid, ${tenant.id}::uuid)
        ON CONFLICT DO NOTHING
      `;
    }

    // 6. Activer les modules du plan
    const planFeatures = plan.features as Record<string, boolean>;
    const moduleSlugs = Object.entries(planFeatures)
      .filter(([, enabled]) => enabled)
      .map(([slug]) => slug);

    if (moduleSlugs.length > 0) {
      const modules = await this.prisma.module.findMany({
        where: { slug: { in: moduleSlugs }, isActive: true },
      });

      await this.prisma.tenantModule.createMany({
        data: modules.map((m) => ({ tenantId: tenant.id, moduleId: m.id })),
        skipDuplicates: true,
      });
    }

    // 7. Créer les website_settings par défaut
    await this.prisma.websiteSettings.create({
      data: { tenantId: tenant.id },
    });

    // 8. Créer 2 workflow_definitions par défaut (commandes + réservations)
    await this.createDefaultWorkflows(tenant.id);

    this.logger.log(
      `[ONBOARDING] Tenant créé : ${tenant.slug} | Owner : ${owner.email} | Mot de passe temporaire : ${tempPassword}`,
    );

    await this.mail.sendOnboardingCredentials(
      owner.email,
      firstName ?? 'Owner',
      request.restaurantName,
      tenant.slug,
      tempPassword,
    );

    // Lier la demande au tenant (best-effort : nécessite la migration 004)
    try {
      await (this.prisma.tenantRequest as any).update({
        where: { id: request.id },
        data: { tenantId: tenant.id },
      });
    } catch {
      this.logger.warn(`[ONBOARDING] tenant_id non lié à la demande ${request.id} — migration 004 non appliquée`);
    }

    return { tenant, owner, tempPassword };
  }

  private async createDefaultWorkflows(tenantId: string) {
    // Workflow commandes
    const orderWorkflow = await this.prisma.workflowDefinition.create({
      data: { tenantId, entityType: 'order', name: 'Cycle de vie commande', isDefault: true },
    });

    const orderStates = [
      { name: 'En attente', slug: 'pending', color: '#F59E0B', isInitial: true, sortOrder: 0 },
      { name: 'En préparation', slug: 'preparing', color: '#3B82F6', sortOrder: 1 },
      { name: 'Prêt', slug: 'ready', color: '#10B981', triggersAlert: true, sortOrder: 2 },
      { name: 'Livré', slug: 'delivered', color: '#6B7280', isTerminal: true, sortOrder: 3 },
      { name: 'Annulé', slug: 'cancelled', color: '#EF4444', isTerminal: true, sortOrder: 4 },
    ];

    const createdOrderStates: Record<string, string> = {};
    for (const s of orderStates) {
      const state = await this.prisma.workflowState.create({
        data: { tenantId, workflowId: orderWorkflow.id, ...s },
      });
      createdOrderStates[s.slug] = state.id;
    }

    // Transitions commandes
    const orderTransitions = [
      { from: 'pending', to: 'preparing', name: 'Démarrer préparation' },
      { from: 'preparing', to: 'ready', name: 'Marquer prêt' },
      { from: 'ready', to: 'delivered', name: 'Livrer' },
      { from: null, to: 'cancelled', name: 'Annuler' },
    ];

    for (const t of orderTransitions) {
      await this.prisma.workflowTransition.create({
        data: {
          workflowId: orderWorkflow.id,
          fromStateId: t.from ? (createdOrderStates[t.from] ?? null) : null,
          toStateId: createdOrderStates[t.to] ?? '',
          name: t.name,
        },
      });
    }

    // Workflow réservations
    const resaWorkflow = await this.prisma.workflowDefinition.create({
      data: { tenantId, entityType: 'reservation', name: 'Cycle de vie réservation', isDefault: true },
    });

    const resaStates = [
      { name: 'En attente', slug: 'pending', color: '#F59E0B', isInitial: true, sortOrder: 0 },
      { name: 'Confirmée', slug: 'confirmed', color: '#3B82F6', sortOrder: 1 },
      { name: 'Installée', slug: 'seated', color: '#10B981', sortOrder: 2 },
      { name: 'Terminée', slug: 'completed', color: '#6B7280', isTerminal: true, sortOrder: 3 },
      { name: 'Annulée', slug: 'cancelled', color: '#EF4444', isTerminal: true, sortOrder: 4 },
    ];

    const createdResaStates: Record<string, string> = {};
    for (const s of resaStates) {
      const state = await this.prisma.workflowState.create({
        data: { tenantId, workflowId: resaWorkflow.id, ...s },
      });
      createdResaStates[s.slug] = state.id;
    }

    const resaTransitions = [
      { from: 'pending', to: 'confirmed', name: 'Confirmer' },
      { from: 'confirmed', to: 'seated', name: 'Installer le client' },
      { from: 'seated', to: 'completed', name: 'Terminer' },
      { from: null, to: 'cancelled', name: 'Annuler' },
    ];

    for (const t of resaTransitions) {
      await this.prisma.workflowTransition.create({
        data: {
          workflowId: resaWorkflow.id,
          fromStateId: t.from ? (createdResaStates[t.from] ?? null) : null,
          toStateId: createdResaStates[t.to] ?? '',
          name: t.name,
        },
      });
    }
  }

  // ── Modules plateforme ───────────────────────────────────────────────────

  async findAllModules() {
    const modules = await this.prisma.module.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { tenantModules: true } },
      },
    });

    return {
      data: modules.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        description: m.description ?? undefined,
        required_plan: m.requiredPlan,
        is_active: m.isActive,
        active_tenants_count: m._count.tenantModules,
      })),
    };
  }

  async toggleModule(id: string, is_active: boolean) {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) throw new NotFoundException('Module introuvable');

    const updated = await this.prisma.module.update({
      where: { id },
      data: { isActive: is_active },
    });

    return { data: { id: updated.id, is_active: updated.isActive } };
  }

  // ── Admins plateforme ─────────────────────────────────────────────────────

  async findAllAdmins(filters: { role?: string; region?: string; search?: string } = {}) {
    const users = await this.prisma.user.findMany({
      where: { tenantId: null },
      include: { adminOfRegion: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    let result = users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      role: u.adminOfRegion.length > 0 ? ('regional_admin' as const) : ('super_admin' as const),
      region_id: u.adminOfRegion[0]?.id ?? undefined,
      region_name: u.adminOfRegion[0]?.name ?? undefined,
      is_active: u.isActive,
      created_at: u.createdAt.toISOString(),
      last_login_at: u.lastLoginAt?.toISOString() ?? undefined,
    }));

    if (filters.role && filters.role !== 'Tous') {
      result = result.filter((a) => a.role === filters.role);
    }
    if (filters.region) {
      result = result.filter(
        (a) => a.region_name?.toLowerCase() === filters.region?.toLowerCase(),
      );
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.email.toLowerCase().includes(q) ||
          a.first_name.toLowerCase().includes(q) ||
          a.last_name.toLowerCase().includes(q),
      );
    }

    return { data: result };
  }

  async inviteAdmin(dto: InviteAdminDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Un compte existe déjà avec cet email');

    let region: { id: string; name: string } | null = null;
    if (dto.role === AdminRole.REGIONAL_ADMIN) {
      if (!dto.region_id) throw new BadRequestException('region_id requis pour un admin régional');
      region = await this.prisma.region.findUnique({
        where: { slug: dto.region_id },
        select: { id: true, name: true },
      });
      if (!region) throw new NotFoundException(`Région introuvable : ${dto.region_id}`);
    }

    const tempPassword = randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId: null,
        email: dto.email,
        firstName: dto.first_name,
        lastName: dto.last_name,
        passwordHash,
        isActive: true,
      },
    });

    if (region) {
      await this.prisma.region.update({
        where: { id: region.id },
        data: { adminId: user.id },
      });
    }

    this.logger.log(
      `[ADMIN INVITE] ${dto.email} (${dto.role}) | Mot de passe temporaire : ${tempPassword}`,
    );

    await this.mail.sendAdminInvitation(dto.email, dto.first_name, dto.role, tempPassword);

    return {
      data: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: dto.role,
        region_id: region?.id,
        region_name: region?.name,
        is_active: true,
        created_at: user.createdAt.toISOString(),
      },
    };
  }

  async toggleAdmin(id: string, dto: ToggleAdminDto) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId: null } });
    if (!user) throw new NotFoundException('Admin introuvable');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.is_active },
    });

    return { data: { id: updated.id, is_active: updated.isActive } };
  }

  async deleteAdmin(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId: null } });
    if (!user) throw new NotFoundException('Admin introuvable');

    // Retirer adminId sur les régions gérées par cet admin
    await this.prisma.region.updateMany({
      where: { adminId: id },
      data: { adminId: null },
    });

    await this.prisma.user.delete({ where: { id } });

    return { data: { id } };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);

    let slug = base;
    let suffix = 0;

    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      suffix++;
      slug = `${base}-${suffix}`;
    }

    return slug;
  }
}
