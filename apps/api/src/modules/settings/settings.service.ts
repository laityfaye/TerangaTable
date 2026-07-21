import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { Prisma, SettingType } from '@terangatable/database';

export interface UpdateSettingItem {
  key: string;
  value: unknown;
  category?: string | null;
}

function inferType(value: unknown): SettingType {
  if (typeof value === 'boolean') return SettingType.boolean;
  if (typeof value === 'number') return SettingType.number;
  if (typeof value === 'string') return SettingType.string;
  if (Array.isArray(value)) return SettingType.array;
  return SettingType.json;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisCacheService,
  ) {}

  async findAll(tenantId: string) {
    const settings = await this.prisma.setting.findMany({
      where: { tenantId },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const grouped: Record<string, Record<string, unknown>> = {};
    for (const s of settings) {
      const cat = s.category ?? 'general';
      if (!grouped[cat]) grouped[cat] = {};
      grouped[cat][s.key] = s.value;
    }

    // Auto-réparation pour les tenants onboardés avant l'ajout du seed
    // automatique (voir TenantsService.onboardTenant/create) : `restaurant_name`,
    // `restaurant_phone`, `restaurant_city` et `restaurant_country` n'existent pas
    // encore en base alors que ces infos ont déjà été renseignées lors de la
    // demande d'ouverture (TenantRequest) et via la région du tenant.
    const missingKeys = (['restaurant_name', 'restaurant_phone', 'restaurant_city', 'restaurant_country'] as const)
      .filter((key) => !grouped.general?.[key]);

    if (missingKeys.length > 0) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          region: { select: { countryName: true } },
          tenantRequests: {
            where: { status: 'approved' },
            orderBy: { reviewedAt: 'desc' },
            select: { phone: true, city: true },
            take: 1,
          },
        },
      });
      if (tenant) {
        const request = tenant.tenantRequests[0];
        const values: Record<string, string | undefined> = {
          restaurant_name: tenant.name,
          restaurant_phone: request?.phone ?? undefined,
          restaurant_city: request?.city ?? undefined,
          restaurant_country: tenant.region?.countryName,
        };

        for (const key of missingKeys) {
          const value = values[key];
          if (!value) continue;
          const seeded = await this.prisma.setting.upsert({
            where: { tenantId_key: { tenantId, key } },
            create: { tenantId, key, value, type: SettingType.string, category: 'general' },
            update: {},
          });
          settings.push(seeded);
          grouped.general = { ...grouped.general, [key]: seeded.value };
        }
      }
    }

    return { data: settings, grouped };
  }

  async upsertMany(tenantId: string, items: UpdateSettingItem[]) {
    const ops = items.map((item) =>
      this.prisma.setting.upsert({
        where: { tenantId_key: { tenantId, key: item.key } },
        create: {
          tenantId,
          key: item.key,
          value: item.value as never,
          type: inferType(item.value),
          category: item.category ?? null,
        },
        update: {
          value: item.value as never,
          type: inferType(item.value),
        },
      }),
    );

    await Promise.all(ops);

    // Synchroniser certaines clés dans tenant.settings JSONB (lu par le marketplace)
    const JSONB_KEY_MAP: Record<string, string> = {
      restaurant_phone: 'phone',
      restaurant_address: 'address',
      restaurant_lat: 'lat',
      restaurant_lng: 'lng',
      opening_hours: 'opening_hours',
    };

    const jsonbPatch: Record<string, unknown> = {};
    for (const item of items) {
      const jsonbKey = JSONB_KEY_MAP[item.key];
      if (!jsonbKey) continue;
      if (item.key === 'restaurant_lat' || item.key === 'restaurant_lng') {
        const n = Number(item.value);
        if (!isNaN(n)) jsonbPatch[jsonbKey] = n;
      } else {
        jsonbPatch[jsonbKey] = item.value;
      }
    }

    if (Object.keys(jsonbPatch).length > 0) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
      const current = (tenant?.settings ?? {}) as Record<string, unknown>;
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { settings: { ...current, ...jsonbPatch } as Prisma.InputJsonValue },
      });
      await this.redis.invalidateTenantContext(tenantId);
    }

    return { success: true };
  }

  // ── Modules ────────────────────────────────────────────────────────────────

  async getModules(tenantId: string) {
    const [tenant, allModules, tenantModules, plans] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: { select: { features: true } } },
      }),
      this.prisma.module.findMany({ where: { isActive: true } }),
      this.prisma.tenantModule.findMany({
        where: { tenantId },
        include: { module: true },
      }),
      this.prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: 'asc' },
        select: { name: true, features: true },
      }),
    ]);

    const planFeatures = (tenant?.plan.features ?? {}) as Record<string, boolean>;
    const activatedIds = new Set(tenantModules.map((tm) => tm.moduleId));

    return {
      data: allModules.map((mod) => {
        const includedInPlan = Boolean(planFeatures[mod.slug]);
        // Pour l'incitation à l'upgrade : le moins cher des plans actifs qui inclut ce module.
        const minPlanName = includedInPlan
          ? null
          : (plans.find((p) => (p.features as Record<string, boolean>)[mod.slug])?.name ?? null);

        return {
          id: mod.id,
          slug: mod.slug,
          name: mod.name,
          description: mod.description,
          icon: mod.icon,
          included_in_plan: includedInPlan,
          min_plan_name: minPlanName,
          is_active: activatedIds.has(mod.id),
        };
      }),
    };
  }

  async activateModule(tenantId: string, moduleId: string) {
    const [tenant, mod] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: { select: { features: true, name: true } } },
      }),
      this.prisma.module.findUnique({ where: { id: moduleId } }),
    ]);
    if (!mod) throw new NotFoundException('Module introuvable');

    const planFeatures = (tenant?.plan.features ?? {}) as Record<string, boolean>;
    if (!planFeatures[mod.slug]) {
      throw new ForbiddenException(
        `Ce module n'est pas inclus dans votre plan actuel (${tenant?.plan.name ?? 'inconnu'})`,
      );
    }

    await this.prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId, moduleId } },
      create: { tenantId, moduleId, isActive: true },
      update: { isActive: true },
    });
    await this.redis.invalidateTenantContext(tenantId);
    return { success: true };
  }

  async deactivateModule(tenantId: string, moduleId: string) {
    await this.prisma.tenantModule.updateMany({
      where: { tenantId, moduleId },
      data: { isActive: false },
    });
    await this.redis.invalidateTenantContext(tenantId);
    return { success: true };
  }
}
