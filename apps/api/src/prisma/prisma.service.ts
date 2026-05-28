import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient } from '@terangatable/database';

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Per-request tenant storage — populated by TenantContextInterceptor / middleware.
// All Prisma operations that call setTenantContext or runWithTenant respect this.
const tenantStorage = new AsyncLocalStorage<string | null>();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  static readonly tenantStorage = tenantStorage;

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Run fn() with every query scoped to tenantId.
   * Uses PostgreSQL set_config so RLS policies keyed on app.current_tenant apply.
   * The set_config call is LOCAL (third arg = true), so it is safe inside a transaction.
   */
  async runWithTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    return tenantStorage.run(tenantId, async () => {
      await this.setTenantContext(tenantId);
      return fn();
    });
  }

  /** Push the tenant into the current PostgreSQL session / transaction. */
  async setTenantContext(tenantId: string): Promise<void> {
    await this.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
  }

  /** Switch Prisma to super-admin mode (bypasses tenant RLS). */
  async setSuperAdminContext(): Promise<void> {
    await this.$executeRaw`SELECT set_config('app.role', 'super_admin', false)`;
  }

  /**
   * Run fn() inside a transaction with super-admin RLS context.
   * Use this for auth operations that must bypass tenant isolation.
   */
  async runAsSuperAdmin<T>(fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.role', 'super_admin', true)`;
      return fn(tx);
    });
  }

  /** Return the tenantId stored in the current async context (if any). */
  getCurrentTenantId(): string | null | undefined {
    return tenantStorage.getStore();
  }
}
