import { Injectable } from '@nestjs/common';
import { Prisma } from '@terangatable/database';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Extension de PrismaService qui injecte automatiquement le contexte tenant
 * avant chaque query via une transaction PostgreSQL.
 */
@Injectable()
export class PrismaTenantService extends PrismaService {
  /**
   * Retourne un proxy sur PrismaService qui, pour chaque opération sur un modèle,
   * ouvre une transaction ITX, injecte app.current_tenant, puis exécute la query.
   */
  forTenant(tenantId: string): this {
    const self = this;

    return new Proxy(this, {
      get(target, prop: string | symbol): unknown {
        // Garder les méthodes $-préfixées et les primitives telles quelles
        if (
          typeof prop === 'symbol' ||
          String(prop).startsWith('$') ||
          String(prop) === 'constructor' ||
          String(prop) === 'then'
        ) {
          return Reflect.get(target, prop);
        }

        const value = Reflect.get(target, prop);

        // Proxyer les délégués de modèles Prisma (user, tenant, product, …)
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return new Proxy(value as object, {
            get(model, operation: string | symbol): unknown {
              const method = Reflect.get(model, operation);
              if (typeof method === 'function') {
                return (...args: unknown[]): Promise<unknown> =>
                  self.$withTenant(tenantId, (tx) =>
                    (tx as Record<string, Record<string, (...a: unknown[]) => Promise<unknown>>>)
                      [String(prop)]
                      [String(operation)](...args),
                  );
              }
              return method;
            },
          });
        }

        return value;
      },
    }) as this;
  }

  /**
   * Exécute fn() dans une transaction PostgreSQL après avoir injecté
   * app.current_tenant. C'est la seule façon garantie d'isolation RLS
   * avec Prisma sur un pool de connexions.
   */
  async $withTenant<T>(
    tenantId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
      return fn(tx);
    });
  }
}
