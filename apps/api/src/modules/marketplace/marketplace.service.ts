import { Injectable } from '@nestjs/common';
import { Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { MarketplaceQueryDto } from './dto/marketplace-query.dto';

const CITIES_TTL     = 300;
const RESTAURANTS_TTL = 30;
const STATS_TTL      = 300;
const FEATURED_TTL   = 120;
const MENUS_TTL      = 60;
const CUISINES_TTL   = 600;
const RESTAURANT_TTL = 60;

// ── Types internes ────────────────────────────────────────────────────────────

export interface OpeningHours {
  [day: string]: { open: string; close: string; closed?: boolean } | null;
}

export interface TenantSettingsJson {
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
  opening_hours?: OpeningHours;
  cuisine_type?: string;
  cuisine_types?: string[];
  price_range?: number;
  delivery_fee?: number;
  min_order?: number;
  estimated_delivery_time?: number;
  rating?: number;
  review_count?: number;
  tags?: string[];
  gallery_images?: string[];
  about_text?: string;
  is_sponsored?: boolean;
  is_featured?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function isOpenNow(hours?: OpeningHours): boolean {
  if (!hours) return true;
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const todayHours = hours[dayName ?? ''];
  if (!todayHours || todayHours.closed) return false;
  const [openH, openM] = (todayHours.open ?? '00:00').split(':').map(Number);
  const [closeH, closeM] = (todayHours.close ?? '23:59').split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = (openH ?? 0) * 60 + (openM ?? 0);
  const closeMinutes = (closeH ?? 0) * 60 + (closeM ?? 0);
  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchesSearch(name: string, description: string, q: string): boolean {
  const query = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const target = `${name} ${description}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return target.includes(query);
}

// ── Sélecteurs Prisma réutilisables ───────────────────────────────────────────

/** Sélecteur commun pour lister les restaurants de la marketplace */
const RESTAURANT_LIST_SELECT = {
  id: true,
  slug: true,
  name: true,
  settings: true,
  createdAt: true,
  region: {
    select: {
      name: true,
      slug: true,
      currencyCode: true,
      currencySymbol: true,
    },
  },
  websiteSettings: {
    select: {
      logoUrl: true,
      heroImageUrl: true,
      primaryColor: true,
      isPublished: true,
    },
  },
  // TenantModule → module.slug pour obtenir les slugs des modules actifs
  tenantModules: {
    where: { isActive: true },
    select: {
      module: {
        select: { slug: true },
      },
    },
  },
  _count: {
    select: { orders: true },
  },
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisCacheService,
  ) {}

  /**
   * Toutes les villes/régions actives avec le nombre de restaurants
   */
  async getCities() {
    const cacheKey = 'marketplace:cities';
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached);

    await this.prisma.setSuperAdminContext();
    const regions = await this.prisma.region.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        countryCode: true,
        countryName: true,
        currencyCode: true,
        currencySymbol: true,
        locale: true,
        _count: {
          select: { tenants: { where: { status: { in: ['active', 'trial'] }, slug: { not: '__platform__' } } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const CITY_COORDS: Record<string, { lat: number; lng: number; description: string; image?: string }> = {
      dakar:         { lat: 14.6928, lng: -17.4467, description: 'Capitale dynamique du Sénégal', image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800' },
      thies:         { lat: 14.7924, lng: -16.9261, description: 'La deuxième ville du Sénégal', image: 'https://images.unsplash.com/photo-1566897819059-b03e12c3c86b?w=800' },
      'saint-louis': { lat: 16.0179, lng: -16.5017, description: 'La ville historique du fleuve', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800' },
      abidjan:       { lat: 5.3600,  lng: -4.0083,  description: 'La perle de la lagune ivoirienne', image: 'https://images.unsplash.com/photo-1572451372492-7f3abbc6038d?w=800' },
      casablanca:    { lat: 33.5731, lng: -7.5898,  description: 'La métropole du Maroc', image: 'https://images.unsplash.com/photo-1577147443647-81856d5152b0?w=800' },
      paris:         { lat: 48.8566, lng: 2.3522,   description: 'La ville lumière', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800' },
    };

    const result = regions.map((r) => {
      const coords = CITY_COORDS[r.slug] ?? null;
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        country_code: r.countryCode,
        country_name: r.countryName,
        currency_code: r.currencyCode,
        currency_symbol: r.currencySymbol,
        locale: r.locale,
        restaurant_count: r._count.tenants,
        lat: coords?.lat,
        lng: coords?.lng,
        description: coords?.description,
        image_url: coords?.image,
      };
    });
    await this.redis.client.set(cacheKey, JSON.stringify(result), 'EX', CITIES_TTL).catch(() => null);
    return result;
  }

  /**
   * Liste paginée et filtrée des restaurants d'une ville
   */
  async getRestaurants(query: MarketplaceQueryDto) {
    const cacheKey = `marketplace:restaurants:${JSON.stringify(query)}`;
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached);

    await this.prisma.setSuperAdminContext();
    const {
      city_slug,
      cuisine,
      budget,
      open_now,
      delivery,
      reservations: needsReservations,
      q,
      page = 1,
      per_page = 20,
      lat,
      lng,
      sort = 'popular',
    } = query;

    const regionFilter = city_slug
      ? { region: { slug: city_slug, isActive: true } }
      : { region: { isActive: true } };

    // ── Pré-requête plats : IDs des restaurants ayant un produit actif correspondant ──
    // Exécutée en parallèle avec la requête principale pour éviter la latence.
    const [tenants, productMatchIds] = await Promise.all([
      this.prisma.tenant.findMany({
        where: {
          status: { in: ['active', 'trial'] },
          slug: { not: '__platform__' },
          ...regionFilter,
        },
        select: RESTAURANT_LIST_SELECT,
      }),
      // Seulement si q est défini — chercher les tenantId des produits correspondants
      q && q.length >= 2
        ? this.prisma.product
            .findMany({
              where: {
                isAvailable: true,
                name: { contains: q, mode: 'insensitive' },
                tenant: {
                  status: { in: ['active', 'trial'] },
                  slug: { not: '__platform__' },
                  ...regionFilter,
                },
              },
              select: { tenantId: true },
              distinct: ['tenantId'],
            })
            .then((rows) => new Set(rows.map((r) => r.tenantId)))
        : Promise.resolve(null as Set<string> | null),
    ]);

    // Mapper et enrichir
    const results = tenants
      .map((tenant) => {
        const s = (tenant.settings ?? {}) as TenantSettingsJson;
        // Extraire les slugs de modules actifs via tenant → tenantModules → module.slug
        const modules: string[] = tenant.tenantModules.map((tm) => tm.module.slug);
        const cuisineTypes: string[] = s.cuisine_types ?? (s.cuisine_type ? [s.cuisine_type] : []);
        const openNow = isOpenNow(s.opening_hours);
        const hasDelivery = modules.includes('delivery');
        const hasReservations = modules.includes('reservations');

        let distance: number | undefined;
        if (lat !== undefined && lng !== undefined && s.lat !== undefined && s.lng !== undefined) {
          distance = Math.round(haversineKm(lat, lng, s.lat, s.lng) * 10) / 10;
        }

        return {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          description: s.description ?? null,
          cuisine_types: cuisineTypes,
          logo_url: tenant.websiteSettings?.logoUrl ?? null,
          hero_image_url: tenant.websiteSettings?.heroImageUrl ?? null,
          primary_color: tenant.websiteSettings?.primaryColor ?? '#C8553D',
          address: s.address ?? null,
          phone: s.phone ?? null,
          lat: s.lat ?? null,
          lng: s.lng ?? null,
          opening_hours: s.opening_hours ?? null,
          is_open_now: openNow,
          rating: s.rating ?? 4.2,
          review_count: s.review_count ?? 0,
          delivery_available: hasDelivery,
          reservations_available: hasReservations,
          min_order: s.min_order ?? null,
          delivery_fee: s.delivery_fee ?? null,
          estimated_delivery_time: s.estimated_delivery_time ?? 30,
          price_range: s.price_range ?? 2,
          is_sponsored: s.is_sponsored ?? false,
          is_featured: s.is_featured ?? false,
          tags: s.tags ?? [],
          region: {
            name: tenant.region.name,
            slug: tenant.region.slug,
            currency_code: tenant.region.currencyCode,
            currency_symbol: tenant.region.currencySymbol,
          },
          distance,
          order_count: tenant._count.orders,
          created_at: tenant.createdAt,
        };
      })
      .filter((r) => {
        if (cuisine && r.cuisine_types.length > 0) {
          const c = cuisine.toLowerCase();
          if (!r.cuisine_types.some((ct) => ct.toLowerCase().includes(c))) return false;
        }
        if (budget) {
          const b = parseInt(budget, 10);
          if (!isNaN(b) && r.price_range !== b) return false;
        }
        if (open_now && !r.is_open_now) return false;
        if (delivery && !r.delivery_available) return false;
        if (needsReservations && !r.reservations_available) return false;
        if (q) {
          // Axe 1 : nom / description du restaurant
          const nameDescMatch = matchesSearch(r.name, r.description ?? '', q);
          // Axe 2 : type de cuisine (déjà mappé dans r.cuisine_types)
          const qNorm = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
          const cuisineMatch = r.cuisine_types.some((ct) =>
            ct.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(qNorm),
          );
          // Axe 3 : plat actif (pré-calculé via productMatchIds)
          const productMatch = productMatchIds?.has(r.id) ?? false;
          if (!nameDescMatch && !cuisineMatch && !productMatch) return false;
        }
        return true;
      });

    // Tri
    results.sort((a, b) => {
      if (a.is_sponsored !== b.is_sponsored) return a.is_sponsored ? -1 : 1;
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      switch (sort) {
        case 'distance':
          if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
          return 0;
        case 'rating':
          return b.rating - a.rating;
        case 'new':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: // popular
          return b.order_count - a.order_count;
      }
    });

    // Pagination
    const total = results.length;
    const pageNum = Math.max(1, page);
    const perPage = Math.min(50, Math.max(1, per_page));
    const offset = (pageNum - 1) * perPage;

    const paginatedResult = {
      data: results.slice(offset, offset + perPage),
      meta: {
        total,
        page: pageNum,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
        has_next: offset + perPage < total,
      },
    };
    await this.redis.client.set(cacheKey, JSON.stringify(paginatedResult), 'EX', RESTAURANTS_TTL).catch(() => null);
    return paginatedResult;
  }

  /**
   * Profil public complet d'un restaurant (par slug)
   */
  async getRestaurantBySlug(slug: string) {
    const cacheKey = `marketplace:restaurant:${slug}`;
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached);

    await this.prisma.setSuperAdminContext();
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, status: { in: ['active', 'trial'] }, NOT: { slug: '__platform__' } },
      select: {
        id: true,
        slug: true,
        name: true,
        settings: true,
        createdAt: true,
        region: {
          select: { name: true, slug: true, currencyCode: true, currencySymbol: true },
        },
        websiteSettings: {
          select: {
            logoUrl: true,
            heroImageUrl: true,
            primaryColor: true,
            isPublished: true,
            seoTitle: true,
            seoDescription: true,
          },
        },
        tenantModules: {
          where: { isActive: true },
          select: {
            module: { select: { slug: true } },
          },
        },
        products: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            imageUrl: true,
            isFeatured: true,
            category: { select: { name: true } },
          },
          orderBy: { isFeatured: 'desc' },
          take: 20,
        },
      },
    });

    if (!tenant) return null;

    const s = (tenant.settings ?? {}) as TenantSettingsJson;
    const modules: string[] = tenant.tenantModules.map((tm) => tm.module.slug);

    const result = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      description: s.description ?? null,
      about_text: s.about_text ?? null,
      cuisine_types: s.cuisine_types ?? (s.cuisine_type ? [s.cuisine_type] : []),
      logo_url: tenant.websiteSettings?.logoUrl ?? null,
      hero_image_url: tenant.websiteSettings?.heroImageUrl ?? null,
      primary_color: tenant.websiteSettings?.primaryColor ?? '#C8553D',
      seo_title: tenant.websiteSettings?.seoTitle ?? null,
      seo_description: tenant.websiteSettings?.seoDescription ?? null,
      address: s.address ?? null,
      phone: s.phone ?? null,
      email: s.email ?? null,
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      opening_hours: s.opening_hours ?? null,
      is_open_now: isOpenNow(s.opening_hours),
      rating: s.rating ?? 4.2,
      review_count: s.review_count ?? 0,
      price_range: s.price_range ?? 2,
      delivery_available: modules.includes('delivery'),
      reservations_available: modules.includes('reservations'),
      min_order: s.min_order ?? null,
      delivery_fee: s.delivery_fee ?? null,
      estimated_delivery_time: s.estimated_delivery_time ?? 30,
      gallery_images: s.gallery_images ?? [],
      tags: s.tags ?? [],
      region: {
        name: tenant.region.name,
        slug: tenant.region.slug,
        currency_symbol: tenant.region.currencySymbol,
      },
      featured_products: tenant.products.slice(0, 6).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.basePrice),
        image_url: p.imageUrl,
        category: p.category?.name ?? null,
      })),
      created_at: tenant.createdAt,
    };
    await this.redis.client.set(cacheKey, JSON.stringify(result), 'EX', RESTAURANT_TTL).catch(() => null);
    return result;
  }

  /**
   * Recherche textuelle rapide (autocomplete + page résultats).
   *
   * Couvre trois axes :
   *  1. Nom du restaurant
   *  2. Nom d'un plat actif (Product.name, isAvailable=true)
   *  3. Type de cuisine stocké dans settings.cuisine_types (JSONB)
   */
  async search(q: string, citySlug?: string) {
    await this.prisma.setSuperAdminContext();
    if (!q || q.length < 2) return [];

    // ── 1 & 2 : nom du restaurant OU nom de plat actif ─────────────────────────
    // Note : on type `where` explicitement pour éviter un type-union conditionnel
    // qui empêcherait Prisma d'inférer correctement le type de retour du `select`.
    const searchWhere: Prisma.TenantWhereInput = {
      status: { in: [TenantStatus.active, TenantStatus.trial] },
      slug: { not: '__platform__' },
      region: citySlug
        ? { slug: citySlug, isActive: true }
        : { isActive: true },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        {
          products: {
            some: {
              name: { contains: q, mode: 'insensitive' },
              isAvailable: true,
            },
          },
        },
      ],
    };

    const byNameOrProduct = await this.prisma.tenant.findMany({
      where: searchWhere,
      select: {
        slug: true,
        name: true,
        settings: true,
        region: { select: { name: true, slug: true } },
        websiteSettings: { select: { logoUrl: true } },
        // Premier plat correspondant → affiché dans l'autocomplete
        products: {
          where: {
            name: { contains: q, mode: 'insensitive' },
            isAvailable: true,
          },
          select: { name: true },
          take: 1,
        },
      },
      take: 8,
    });

    // ── 3 : type de cuisine dans settings.cuisine_types (JSONB) ───────────────
    // Prisma ne sait pas filtrer dans un tableau JSON → raw SQL
    type RawRow = {
      slug: string;
      name: string;
      settings: unknown;
      region_name: string;
      region_slug: string;
      logo_url: string | null;
    };

    const likePattern = `%${q}%`;
    const cityFilter = citySlug
      ? Prisma.sql`AND r.slug = ${citySlug}`
      : Prisma.sql``;

    const byCuisine = await this.prisma.$queryRaw<RawRow[]>`
      SELECT DISTINCT ON (t.slug)
        t.slug,
        t.name,
        t.settings,
        r.name  AS region_name,
        r.slug  AS region_slug,
        ws.logo_url
      FROM tenants t
      JOIN   regions         r  ON r.id = t.region_id AND r.is_active = true
      LEFT JOIN website_settings ws ON ws.tenant_id = t.id
      WHERE t.status IN ('active', 'trial')
        AND t.slug != '__platform__'
        ${cityFilter}
        AND EXISTS (
          SELECT 1
          FROM   jsonb_array_elements_text(
                   COALESCE(t.settings->'cuisine_types', '[]'::jsonb)
                 ) elem
          WHERE  elem ILIKE ${likePattern}
        )
      LIMIT 4
    `;

    // ── Fusion & déduplication ─────────────────────────────────────────────────
    type SearchResult = {
      slug: string;
      name: string;
      cuisine_type: string | null;
      logo_url: string | null;
      address: string | null;
      city: string;
      city_slug: string;
      matched_product: string | null;
      matched_via: 'name' | 'product' | 'cuisine';
    };

    const seen = new Set<string>();
    const results: SearchResult[] = [];

    // Résultats nom/plat
    for (const t of byNameOrProduct) {
      if (seen.has(t.slug)) continue;
      seen.add(t.slug);
      const s = (t.settings ?? {}) as TenantSettingsJson;
      const nameMatches = t.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .includes(
          q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
        );
      const matchedProduct = t.products[0]?.name ?? null;
      results.push({
        slug: t.slug,
        name: t.name,
        cuisine_type: s.cuisine_types?.[0] ?? s.cuisine_type ?? null,
        logo_url: t.websiteSettings?.logoUrl ?? null,
        address: s.address ?? null,
        city: t.region.name,
        city_slug: t.region.slug,
        matched_product: nameMatches ? null : matchedProduct,
        matched_via: nameMatches ? 'name' : 'product',
      });
    }

    // Résultats cuisine
    for (const r of byCuisine) {
      if (seen.has(r.slug)) continue;
      seen.add(r.slug);
      const s = (r.settings ?? {}) as TenantSettingsJson;
      results.push({
        slug: r.slug,
        name: r.name,
        cuisine_type: s.cuisine_types?.[0] ?? s.cuisine_type ?? null,
        logo_url: r.logo_url,
        address: s.address ?? null,
        city: r.region_name,
        city_slug: r.region_slug,
        matched_product: null,
        matched_via: 'cuisine',
      });
    }

    return results.slice(0, 8);
  }

  /**
   * Restaurants mis en avant / sponsorisés d'une ville
   */
  async getFeatured(citySlug: string) {
    const cacheKey = `marketplace:featured:${citySlug}`;
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached);

    await this.prisma.setSuperAdminContext();
    const tenants = await this.prisma.tenant.findMany({
      where: {
        status: { in: ['active', 'trial'] },
        slug: { not: '__platform__' },
        region: { slug: citySlug, isActive: true },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        settings: true,
        region: { select: { name: true, currencySymbol: true } },
        websiteSettings: {
          select: { logoUrl: true, heroImageUrl: true, primaryColor: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const featured = tenants
      .map((t) => {
        const s = (t.settings ?? {}) as TenantSettingsJson;
        return {
          id: t.id,
          slug: t.slug,
          name: t.name,
          description: s.description ?? null,
          cuisine_types: s.cuisine_types ?? (s.cuisine_type ? [s.cuisine_type] : []),
          logo_url: t.websiteSettings?.logoUrl ?? null,
          hero_image_url: t.websiteSettings?.heroImageUrl ?? null,
          primary_color: t.websiteSettings?.primaryColor ?? '#C8553D',
          address: s.address ?? null,
          rating: s.rating ?? 4.5,
          review_count: s.review_count ?? 0,
          price_range: s.price_range ?? 2,
          is_open_now: isOpenNow(s.opening_hours),
          delivery_available: false,
          estimated_delivery_time: s.estimated_delivery_time ?? 30,
          is_sponsored: s.is_sponsored ?? false,
          is_featured: s.is_featured ?? false,
          order_count: t._count.orders,
        };
      })
      .sort((a, b) => {
        if (a.is_sponsored !== b.is_sponsored) return a.is_sponsored ? -1 : 1;
        return b.order_count - a.order_count;
      })
      .slice(0, 6);
    await this.redis.client.set(cacheKey, JSON.stringify(featured), 'EX', FEATURED_TTL).catch(() => null);
    return featured;
  }

  /**
   * Statistiques publiques d'une ville
   */
  async getStats(citySlug?: string) {
    const cacheKey = `marketplace:stats:${citySlug ?? '_global'}`;
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached);

    await this.prisma.setSuperAdminContext();
    const regionFilter = citySlug
      ? { region: { slug: citySlug, isActive: true } }
      : { region: { isActive: true } };

    const [restaurantCount, regionCount] = await Promise.all([
      this.prisma.tenant.count({
        where: {
          status: { in: ['active', 'trial'] },
          slug: { not: '__platform__' },
          ...regionFilter,
        },
      }),
      this.prisma.region.count({ where: { isActive: true } }),
    ]);

    const stats = {
      restaurant_count: restaurantCount,
      region_count: regionCount,
      cuisine_count: 12,
      avg_delivery_time: 28,
    };
    await this.redis.client.set(cacheKey, JSON.stringify(stats), 'EX', STATS_TTL).catch(() => null);
    return stats;
  }

  /**
   * Menus du jour : produits actifs (is_available=true) des restaurants ouverts.
   * Priorité aux produits isFeatured=true, sinon les premiers actifs.
   * Retourne au maximum `limit` restaurants, chacun avec jusqu'à `itemsPerRestaurant` produits.
   */
  async getMenusDuJour(citySlug: string, limit = 6, itemsPerRestaurant = 3) {
    const cacheKey = `marketplace:menus-du-jour:${citySlug}`;
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached);

    await this.prisma.setSuperAdminContext();

    const tenants = await this.prisma.tenant.findMany({
      where: {
        status: { in: ['active', 'trial'] },
        slug: { not: '__platform__' },
        region: { slug: citySlug, isActive: true },
        // Ne garder que les restaurants qui ont au moins un produit actif
        products: { some: { isAvailable: true } },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        settings: true,
        region: {
          select: { currencySymbol: true },
        },
        websiteSettings: {
          select: { logoUrl: true },
        },
        products: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            imageUrl: true,
            isFeatured: true,
            category: { select: { name: true } },
          },
          orderBy: [
            { isFeatured: 'desc' },
            { sortOrder: 'asc' },
          ],
          take: itemsPerRestaurant,
        },
        _count: { select: { orders: true } },
      },
    });

    // Filtrer sur les restaurants ouverts maintenant et mapper
    const result = tenants
      .filter((t) => {
        const s = (t.settings ?? {}) as TenantSettingsJson;
        return isOpenNow(s.opening_hours);
      })
      .sort((a, b) => b._count.orders - a._count.orders)
      .slice(0, limit)
      .map((t) => {
        const s = (t.settings ?? {}) as TenantSettingsJson;
        return {
          restaurant_id: t.id,
          restaurant_slug: t.slug,
          restaurant_name: t.name,
          logo_url: t.websiteSettings?.logoUrl ?? null,
          estimated_delivery_time: s.estimated_delivery_time ?? 30,
          currency_symbol: t.region.currencySymbol,
          is_open_now: true, // déjà filtré ci-dessus
          items: t.products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? null,
            price: Number(p.basePrice),
            image_url: p.imageUrl ?? null,
            category: p.category?.name ?? null,
            is_featured: p.isFeatured,
          })),
        };
      });

    await this.redis.client.set(cacheKey, JSON.stringify(result), 'EX', MENUS_TTL).catch(() => null);
    return result;
  }

  /**
   * Types de cuisine disponibles dans une ville
   */
  async getCuisineTypes(citySlug: string): Promise<string[]> {
    const cacheKey = `marketplace:cuisines:${citySlug}`;
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached);

    await this.prisma.setSuperAdminContext();
    const tenants = await this.prisma.tenant.findMany({
      where: {
        status: { in: ['active', 'trial'] },
        slug: { not: '__platform__' },
        region: { slug: citySlug, isActive: true },
      },
      select: { settings: true },
    });

    const cuisines = new Set<string>();
    for (const t of tenants) {
      const s = (t.settings ?? {}) as TenantSettingsJson;
      const types = s.cuisine_types ?? (s.cuisine_type ? [s.cuisine_type] : []);
      for (const c of types) cuisines.add(c);
    }

    const cuisineList = Array.from(cuisines).sort();
    await this.redis.client.set(cacheKey, JSON.stringify(cuisineList), 'EX', CUISINES_TTL).catch(() => null);
    return cuisineList;
  }
}
