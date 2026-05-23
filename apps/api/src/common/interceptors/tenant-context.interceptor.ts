import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService, CachedTenantContext } from '../services/redis-cache.service';
import { TenantNotFoundException } from '../exceptions/tenant-not-found.exception';

export interface TenantContext {
  id: string;
  slug: string;
  regionId: string;
  currency: string;
  timezone: string;
  status: string;
  trialEndsAt: string | null;
  activeModules: string[];
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisCacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      tenant?: TenantContext;
      tenantContext?: TenantContext;
      user?: { roles?: string[] };
    }>();

    // Super admin : pas de contexte tenant requis
    if (request.user?.roles?.includes('super_admin')) {
      await this.prisma.setSuperAdminContext();
      return next.handle();
    }

    // request.tenant est déjà chargé par TenantResolutionMiddleware (qui s'exécute
    // avant les guards et les interceptors). On réutilise ce contexte sans refaire
    // le lookup Redis/DB.
    let tenantCtx = request.tenant;

    if (!tenantCtx) {
      // Fallback : le middleware n'a pas pu résoudre le tenant (edge case),
      // on tente une résolution via le header.
      const tenantId = request.headers['x-tenant-id'] as string | undefined;
      if (tenantId) {
        const loaded = await this.loadTenantContext(tenantId);
        if (!loaded) throw new TenantNotFoundException(tenantId);
        tenantCtx = loaded;
        request.tenant = tenantCtx;
      }
    }

    if (tenantCtx) {
      // Synchroniser le contexte tenant dans l'alias legacy
      request.tenantContext = tenantCtx;
      // Injecter le tenant dans la session PostgreSQL pour le RLS
      await this.prisma.setTenantContext(tenantCtx.id);
    }

    return next.handle();
  }

  private async loadTenantContext(tenantId: string): Promise<TenantContext | null> {
    const cached = await this.redis.getTenantContext(tenantId);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        region: true,
        tenantModules: {
          where: { isActive: true },
          include: { module: { select: { slug: true } } },
        },
      },
    });
    if (!tenant) return null;

    const ctx: CachedTenantContext = {
      id: tenant.id,
      slug: tenant.slug,
      regionId: tenant.regionId,
      currency: tenant.region.currencyCode,
      timezone: tenant.region.timezone,
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      activeModules: tenant.tenantModules.map((tm) => tm.module.slug),
    };

    await this.redis.setTenantContext(ctx, 300);
    return ctx;
  }
}
