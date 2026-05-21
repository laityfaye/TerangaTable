import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const TENANT_SLUG_TTL = 300;  // 5 minutes
const TENANT_ID_TTL = 3600;   // 1 heure

export interface CachedTenantContext {
  id: string;
  slug: string;
  regionId: string;
  currency: string;
  timezone: string;
  status: string;
  trialEndsAt: string | null;
}

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  async onModuleInit() {
    await this.client.connect().catch((err) => {
      this.logger.warn(`Redis connection failed (non-fatal): ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => null);
  }

  // ── Helpers slug → tenantId ──────────────────────────────────────────────

  async setTenantSlug(slug: string, tenantId: string, ttl = TENANT_SLUG_TTL): Promise<void> {
    await this.client.set(`tenant:slug:${slug}`, tenantId, 'EX', ttl).catch(() => null);
  }

  async getTenantSlug(slug: string): Promise<string | null> {
    return this.client.get(`tenant:slug:${slug}`).catch(() => null);
  }

  async invalidateTenantSlug(slug: string): Promise<void> {
    await this.client.del(`tenant:slug:${slug}`).catch(() => null);
  }

  // ── Helpers tenantId → contexte complet ─────────────────────────────────

  async setTenantContext(context: CachedTenantContext, ttl = TENANT_ID_TTL): Promise<void> {
    await this.client
      .set(`tenant:id:${context.id}`, JSON.stringify(context), 'EX', ttl)
      .catch(() => null);
  }

  async getTenantContext(tenantId: string): Promise<CachedTenantContext | null> {
    const raw = await this.client.get(`tenant:id:${tenantId}`).catch(() => null);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CachedTenantContext;
    } catch {
      return null;
    }
  }

  async invalidateTenantContext(tenantId: string): Promise<void> {
    await this.client.del(`tenant:id:${tenantId}`).catch(() => null);
  }

  async invalidateAll(tenantId: string, slug: string, customDomain?: string): Promise<void> {
    const keys = [`tenant:id:${tenantId}`, `tenant:slug:${slug}`];
    if (customDomain) keys.push(`domain:${customDomain}`);
    await this.client.del(...keys).catch(() => null);
  }

  // ── Helpers domaine personnalisé ─────────────────────────────────────────

  async setDomainSlug(domain: string, slug: string): Promise<void> {
    await this.client.set(`domain:${domain}`, slug, 'EX', 86400).catch(() => null);
  }

  async getDomainSlug(domain: string): Promise<string | null> {
    return this.client.get(`domain:${domain}`).catch(() => null);
  }
}
