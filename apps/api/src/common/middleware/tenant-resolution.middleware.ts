import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisCacheService, CachedTenantContext } from '../services/redis-cache.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(
    private readonly redis: RedisCacheService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const host = (req.headers['host'] as string) ?? '';
    const platformDomain = process.env['PLATFORM_DOMAIN'] ?? 'terangatable.com';

    const subdomain = this.extractSubdomain(host, platformDomain);
    let tenantId: string | null = null;

    // 1. Résolution par sous-domaine
    if (subdomain && subdomain !== 'app' && subdomain !== 'super-admin') {
      tenantId = await this.resolveSlug(subdomain);
      if (tenantId) {
        req.headers['x-tenant-id'] = tenantId;
      }
    }

    // 2. Résolution par domaine personnalisé
    if (!tenantId) {
      const cleanHost = host.split(':')[0] ?? '';
      const domainSlug = await this.redis.getDomainSlug(cleanHost);
      if (domainSlug) {
        tenantId = await this.resolveSlug(domainSlug);
        if (tenantId) {
          req.headers['x-tenant-id'] = tenantId;
        }
      }
    }

    // 3. Fallback : X-Tenant-ID déjà présent dans la requête (envoyé par le client en dev)
    if (!tenantId) {
      const headerValue = req.headers['x-tenant-id'];
      tenantId = typeof headerValue === 'string' ? headerValue : null;
    }

    // 4. Charger le contexte tenant et l'attacher à la requête
    //    Ceci doit se faire ici (middleware) et non dans l'interceptor car les guards
    //    s'exécutent AVANT les interceptors dans NestJS.
    if (tenantId) {
      const tenantCtx = await this.loadTenantContext(tenantId);
      if (tenantCtx) {
        (req as Request & { tenant: CachedTenantContext }).tenant = tenantCtx;
      }
    }

    next();
  }

  private async resolveSlug(slug: string): Promise<string | null> {
    const cached = await this.redis.getTenantSlug(slug);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) return null;

    await this.redis.setTenantSlug(slug, tenant.id);
    return tenant.id;
  }

  private async loadTenantContext(tenantId: string): Promise<CachedTenantContext | null> {
    const cached = await this.redis.getTenantContext(tenantId);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { region: true },
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
    };

    await this.redis.setTenantContext(ctx, 300);
    return ctx;
  }

  private extractSubdomain(host: string, platformDomain: string): string | null {
    const withoutPort = host.split(':')[0] ?? '';
    if (withoutPort.endsWith(`.${platformDomain}`)) {
      return withoutPort.slice(0, -(platformDomain.length + 1));
    }
    return null;
  }
}
