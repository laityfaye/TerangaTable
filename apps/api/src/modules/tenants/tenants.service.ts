import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { SettingType } from '@terangatable/database';
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

  async findAllByRegionSlug(regionSlug: string | undefined, dto: ListTenantsDto) {
    const empty = { data: [], meta: { total: 0, page: dto.page ?? 1, limit: dto.limit ?? 20, totalPages: 0 } };
    if (!regionSlug) return empty;
    const region = await this.prisma.region.findUnique({ where: { slug: regionSlug }, select: { id: true } });
    if (!region) return empty;
    return this.findAll({ ...dto, regionId: region.id });
  }

  async findAll(dto: ListTenantsDto) {
    const { page = 1, limit = 20, regionId, status, search } = dto;
    const skip = (page - 1) * limit;

    const where = {
      ...(regionId && { regionId }),
      ...(status && { status: status as never }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
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
      plan_id: t.planId,
      plan: t.plan?.name?.toLowerCase() ?? 'starter',
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

    await this.prisma.setting.create({
      data: {
        tenantId: tenant.id,
        key: 'restaurant_name',
        value: tenant.name,
        type: SettingType.string,
        category: 'general',
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

  async updatePlan(id: string, planId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant introuvable');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan introuvable');
    if (!plan.isActive) throw new BadRequestException('Ce plan n\'est plus disponible à la souscription');

    if (tenant.planId === planId) {
      return { data: { id: tenant.id, plan_id: planId } };
    }

    // Modules inclus dans le nouveau plan (upgrade : ajoute l'accès, downgrade : le retire)
    const planFeatures = plan.features as Record<string, boolean>;
    const includedSlugs = Object.entries(planFeatures)
      .filter(([, enabled]) => enabled)
      .map(([slug]) => slug);

    const includedModules = includedSlugs.length
      ? await this.prisma.module.findMany({ where: { slug: { in: includedSlugs }, isActive: true } })
      : [];

    await this.prisma.$transaction(async (tx) => {
      await tx.tenant.update({ where: { id }, data: { planId } });

      await tx.tenantModule.deleteMany({
        where: {
          tenantId: id,
          ...(includedModules.length > 0
            ? { moduleId: { notIn: includedModules.map((m) => m.id) } }
            : {}),
        },
      });

      if (includedModules.length > 0) {
        await tx.tenantModule.createMany({
          data: includedModules.map((m) => ({ tenantId: id, moduleId: m.id })),
          skipDuplicates: true,
        });
      }
    });

    await this.redis.invalidateAll(tenant.id, tenant.slug);

    return { data: { id: tenant.id, plan_id: planId } };
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

  async findAllRequestsByRegionSlug(regionSlug?: string) {
    if (!regionSlug) return { data: [] };
    const region = await this.prisma.region.findUnique({ where: { slug: regionSlug }, select: { id: true } });
    if (!region) return { data: [] };
    return this.findAllRequests(region.id);
  }

  async findAllRequests(regionId?: string) {
    const rows = await this.prisma.tenantRequest.findMany({
      where: { ...(regionId && { regionId }) },
      orderBy: { createdAt: 'desc' },
      include: {
        region: { select: { name: true, slug: true } },
        reviewer: { select: { firstName: true, lastName: true, email: true } },
        desiredPlan: { select: { id: true, name: true } },
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
      desired_plan_id: r.desiredPlan?.id ?? undefined,
      desired_plan_name: r.desiredPlan?.name ?? undefined,
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
      include: { admin: { select: { email: true, firstName: true } } },
    });
    if (!region) throw new NotFoundException('Région introuvable ou inactive');

    // Le plan désiré est calculé côté formulaire à partir de la taille déclarée
    // (indicatif seulement) — on ignore silencieusement une valeur invalide plutôt
    // que de bloquer l'inscription pour un champ non déterminant.
    let desiredPlanId: string | undefined;
    if (dto.desiredPlanId) {
      const desiredPlan = await this.prisma.plan.findUnique({
        where: { id: dto.desiredPlanId },
        select: { id: true, isActive: true },
      });
      if (desiredPlan?.isActive) desiredPlanId = desiredPlan.id;
    }

    const request = await this.prisma.tenantRequest.create({
      data: {
        regionId: dto.regionId,
        ownerName: dto.ownerName,
        ownerEmail: dto.ownerEmail,
        restaurantName: dto.restaurantName,
        phone: dto.phone,
        city: dto.city,
        message: dto.message,
        desiredPlanId,
        status: 'pending',
      },
    });

    await this.mail.sendRequestConfirmation(dto.ownerEmail, dto.ownerName, dto.restaurantName);

    if (region.admin) {
      await this.mail.sendNewRequestNotification(
        region.admin.email,
        region.admin.firstName,
        dto.restaurantName,
        dto.ownerName,
        region.name,
        region.slug,
      );
    }

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
        await this.onboardTenant(request, dto.planId ?? request.desiredPlanId ?? undefined);
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
      phone?: string | null;
      city?: string | null;
    },
    planId?: string,
  ) {
    // Résoudre le plan (défaut : Starter)
    const plan = planId
      ? await this.prisma.plan.findUnique({ where: { id: planId } })
      : await this.prisma.plan.findFirst({ where: { name: 'Starter', isActive: true } });

    if (!plan) throw new BadRequestException('Plan introuvable');

    const region = await this.prisma.region.findUnique({
      where: { id: request.regionId },
      select: { countryName: true },
    });

    // Vérifier l'email avant toute création en base
    const existingUser = await this.prisma.user.findUnique({ where: { email: request.ownerEmail } });
    if (existingUser) {
      throw new ConflictException(
        `Un compte existe déjà avec l'email ${request.ownerEmail}. Modifiez l'email de la demande avant d'approuver.`,
      );
    }

    // Préparer les valeurs hors transaction (opérations async non-DB)
    const slug = await this.generateUniqueSlug(request.restaurantName);
    const [firstName, ...lastParts] = request.ownerName.split(' ');
    const lastName = lastParts.join(' ') || 'Owner';
    const tempPassword = randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Toutes les créations DB dans une transaction atomique
    const { tenant, owner } = await this.prisma.$transaction(async (tx) => {
      // 1. Créer le tenant
      const tenant = await tx.tenant.create({
        data: {
          regionId: request.regionId,
          slug,
          name: request.restaurantName,
          planId: plan.id,
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // 2. Créer le user owner
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: request.ownerEmail,
          passwordHash,
          firstName: firstName ?? 'Owner',
          lastName,
          isActive: true,
        },
      });

      // 3. Créer les rôles par défaut
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
        const role = await tx.role.create({
          data: { tenantId: tenant.id, ...roleData, isSystem: true },
        });
        createdRoles[roleData.slug] = role.id;
      }

      // 4. Assigner le rôle owner
      if (createdRoles['restaurant_owner']) {
        await tx.$executeRaw`
          INSERT INTO user_roles (user_id, role_id, tenant_id)
          VALUES (${owner.id}::uuid, ${createdRoles['restaurant_owner']}::uuid, ${tenant.id}::uuid)
          ON CONFLICT DO NOTHING
        `;
      }

      // 5. Activer les modules du plan
      const planFeatures = plan.features as Record<string, boolean>;
      const moduleSlugs = Object.entries(planFeatures)
        .filter(([, enabled]) => enabled)
        .map(([slug]) => slug);

      if (moduleSlugs.length > 0) {
        const modules = await tx.module.findMany({
          where: { slug: { in: moduleSlugs }, isActive: true },
        });

        await tx.tenantModule.createMany({
          data: modules.map((m) => ({ tenantId: tenant.id, moduleId: m.id })),
          skipDuplicates: true,
        });
      }

      // 6. Créer les website_settings par défaut
      await tx.websiteSettings.create({
        data: { tenantId: tenant.id },
      });

      // 6bis. Seed les infos du restaurant dans les settings (lues par le dashboard),
      // à partir des données déjà renseignées lors de la demande d'ouverture.
      const generalSeeds: Record<string, string | null | undefined> = {
        restaurant_name: tenant.name,
        restaurant_phone: request.phone,
        restaurant_city: request.city,
        restaurant_country: region?.countryName,
      };

      await tx.setting.createMany({
        data: Object.entries(generalSeeds)
          .filter(([, value]) => !!value)
          .map(([key, value]) => ({
            tenantId: tenant.id,
            key,
            value: value as string,
            type: SettingType.string,
            category: 'general',
          })),
      });

      // 7. Créer les workflows par défaut
      await this.createDefaultWorkflows(tenant.id, tx);

      // 8. Lier la demande au tenant (best-effort)
      try {
        await (tx.tenantRequest as any).update({
          where: { id: request.id },
          data: { tenantId: tenant.id },
        });
      } catch {
        this.logger.warn(`[ONBOARDING] tenant_id non lié à la demande ${request.id} — migration 004 non appliquée`);
      }

      return { tenant, owner };
    });

    this.logger.log(
      `[ONBOARDING] Tenant créé : ${tenant.slug} | Owner : ${owner.email} | Mot de passe temporaire : ${tempPassword}`,
    );

    await this.mail.sendOnboardingCredentials(
      owner.email,
      firstName ?? 'Owner',
      request.restaurantName,
      tempPassword,
    );

    return { tenant, owner, tempPassword };
  }

  private async createDefaultWorkflows(tenantId: string, tx: Prisma.TransactionClient) {
    // Workflow commandes — couvre à la fois le cycle "sur place" et "livraison"
    // (cf. docs/MODULES.md), dans un seul workflow pour ne pas avoir à distinguer
    // dynamiquement le workflow d'une commande selon son type à la création.
    const orderWorkflow = await tx.workflowDefinition.create({
      data: { tenantId, entityType: 'order', name: 'Cycle de vie commande', isDefault: true },
    });

    const orderStates = [
      { name: 'Nouvelle', slug: 'new', color: '#F59E0B', isInitial: true, sortOrder: 0 },
      { name: 'Confirmée', slug: 'confirmed', color: '#8B5CF6', sortOrder: 1 },
      { name: 'En cuisine', slug: 'in_kitchen', color: '#3B82F6', sortOrder: 2 },
      { name: 'En préparation', slug: 'in_preparation', color: '#3B82F6', sortOrder: 3 },
      { name: 'Prête', slug: 'ready', color: '#10B981', triggersAlert: true, sortOrder: 4 },
      { name: 'En livraison', slug: 'in_delivery', color: '#F97316', triggersAlert: true, sortOrder: 5 },
      { name: 'Servie', slug: 'served', color: '#6B7280', isTerminal: true, sortOrder: 6 },
      { name: 'Livrée', slug: 'delivered', color: '#10B981', isTerminal: true, sortOrder: 7 },
      { name: 'Annulée', slug: 'cancelled', color: '#EF4444', isTerminal: true, sortOrder: 8 },
    ];

    const createdOrderStates: Record<string, string> = {};
    for (const s of orderStates) {
      const state = await tx.workflowState.create({
        data: { tenantId, workflowId: orderWorkflow.id, ...s },
      });
      createdOrderStates[s.slug] = state.id;
    }

    const orderTransitions = [
      // Sur place
      { from: 'new', to: 'in_kitchen', name: 'Envoyer en cuisine', roles: ['serveur', 'caissier'] },
      { from: 'in_kitchen', to: 'ready', name: 'Marquer prête', roles: ['cuisinier'] },
      { from: 'ready', to: 'served', name: 'Marquer servie', roles: ['serveur'] },
      // Livraison
      { from: 'new', to: 'confirmed', name: 'Confirmer', roles: ['caissier', 'manager'] },
      { from: 'confirmed', to: 'in_preparation', name: 'Préparer', roles: ['cuisinier'] },
      { from: 'in_preparation', to: 'in_delivery', name: 'Partir en livraison', roles: ['livreur'] },
      { from: 'in_delivery', to: 'delivered', name: 'Marquer livrée', roles: ['livreur'] },
      // Commun
      { from: null, to: 'cancelled', name: 'Annuler', roles: ['manager', 'restaurant_owner'] },
    ];

    for (const t of orderTransitions) {
      await tx.workflowTransition.create({
        data: {
          workflowId: orderWorkflow.id,
          fromStateId: t.from ? (createdOrderStates[t.from] ?? null) : null,
          toStateId: createdOrderStates[t.to] ?? '',
          name: t.name,
          allowedRoles: t.roles,
        },
      });
    }

    // Workflow réservations
    const resaWorkflow = await tx.workflowDefinition.create({
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
      const state = await tx.workflowState.create({
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
      await tx.workflowTransition.create({
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
      include: {
        adminOfRegion: { select: { id: true, name: true } },
        userRoles: { select: { role: { select: { slug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let result = users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      role: (u.userRoles.find((ur) => ur.role.slug === 'super_admin')
        ? 'super_admin'
        : u.userRoles.find((ur) => ur.role.slug === 'regional_admin')
          ? 'regional_admin'
          : undefined) as 'super_admin' | 'regional_admin' | undefined,
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

    const platformRole = await this.prisma.role.findFirst({
      where: { tenantId: null, slug: dto.role },
      select: { id: true },
    });
    if (!platformRole) throw new NotFoundException(`Rôle plateforme introuvable : ${dto.role}`);

    const platformTenant = await this.prisma.tenant.findUnique({
      where: { slug: '__platform__' },
      select: { id: true },
    });
    if (!platformTenant) throw new NotFoundException('Tenant plateforme introuvable (seed manquant)');

    const tempPassword = randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: null,
          email: dto.email,
          firstName: dto.first_name,
          lastName: dto.last_name,
          passwordHash,
          isActive: true,
        },
      });

      await tx.$executeRaw`
        INSERT INTO user_roles (user_id, role_id, tenant_id)
        VALUES (${user.id}::uuid, ${platformRole.id}::uuid, ${platformTenant.id}::uuid)
        ON CONFLICT DO NOTHING
      `;

      if (region) {
        await tx.region.update({
          where: { id: region.id },
          data: { adminId: user.id },
        });
      }

      return user;
    });

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
