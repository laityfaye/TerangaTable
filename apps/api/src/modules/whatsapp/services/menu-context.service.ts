import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisCacheService } from '../../../common/services/redis-cache.service';
import { WebsiteService } from '../../website/website.service';

const MENU_BLOCK_TTL = 300; // 5 min — le menu ne change pas assez vite pour justifier plus court

interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  currencySymbol: string;
}

@Injectable()
export class MenuContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisCacheService,
    private readonly websiteService: WebsiteService,
  ) {}

  async getTenantInfo(tenantId: string): Promise<TenantInfo | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, name: true, region: { select: { currencySymbol: true } } },
    });
    if (!tenant) return null;
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      currencySymbol: tenant.region.currencySymbol,
    };
  }

  /**
   * Rendu texte du menu (catégories → produits → options), avec les ids réels
   * pour que Claude puisse les référencer directement dans add_to_cart. Mis en
   * cache par tenant — réutilisé par TOUTES les conversations de ce restaurant,
   * pas juste une seule (voir la structure de cache de prompt dans whatsapp.service.ts).
   */
  async renderMenuBlock(tenant: TenantInfo): Promise<string> {
    const cacheKey = `whatsapp:menu-block:${tenant.id}`;
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    if (cached) return cached;

    const categories = await this.websiteService.getPublicMenu(tenant.slug) as Array<{
      name: string;
      products: Array<{ id: string; name: string; description: string | null; basePrice: unknown; tags: string[] }>;
    }>;

    const productIds = categories.flatMap((c) => c.products.map((p) => p.id));
    const optionGroups = productIds.length
      ? await this.prisma.productOptionGroup.findMany({
          where: { tenantId: tenant.id, productId: { in: productIds } },
          include: { options: { where: { isAvailable: true } } },
        })
      : [];

    const groupsByProduct = new Map<string, typeof optionGroups>();
    for (const g of optionGroups) {
      const list = groupsByProduct.get(g.productId) ?? [];
      list.push(g);
      groupsByProduct.set(g.productId, list);
    }

    const lines: string[] = [];
    for (const category of categories) {
      if (category.products.length === 0) continue;
      lines.push(`### ${category.name}`);
      for (const product of category.products) {
        const price = Number(product.basePrice).toFixed(0);
        lines.push(`- [id: ${product.id}] ${product.name} — ${price} ${tenant.currencySymbol}${product.description ? ` (${product.description})` : ''}`);
        for (const group of groupsByProduct.get(product.id) ?? []) {
          const opts = group.options
            .map((o) => `[id: ${o.id}] ${o.name}${Number(o.priceDelta) !== 0 ? ` (+${Number(o.priceDelta).toFixed(0)} ${tenant.currencySymbol})` : ''}`)
            .join(', ');
          lines.push(`  · ${group.name}${group.isRequired ? ' (obligatoire)' : ''} : ${opts}`);
        }
      }
    }

    const block = lines.length > 0
      ? lines.join('\n')
      : 'Aucun produit disponible actuellement.';

    await this.redis.client.set(cacheKey, block, 'EX', MENU_BLOCK_TTL).catch(() => null);
    return block;
  }

  /** Recherche texte libre dans le menu déjà chargé (fallback pour l'outil search_menu). */
  async searchProducts(tenant: TenantInfo, query: string): Promise<{ id: string; name: string }[]> {
    const categories = (await this.websiteService.getPublicMenu(tenant.slug)) as Array<{
      products: Array<{ id: string; name: string; description: string | null; tags: string[] }>;
    }>;
    const q = query.toLowerCase();
    return categories
      .flatMap((c) => c.products)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .map((p) => ({ id: p.id, name: p.name }));
  }
}
