import type { MetadataRoute } from 'next';
import { fetchMarketplaceCities } from '@/lib/marketplace-api';
import { fetchAllSlugs } from '@/lib/vitrine-api';

const BASE = 'https://terangatable.cloud';

// Régénère le sitemap toutes les 5 min (aligné sur le cache de fetchMarketplaceCities /
// fetchAllSlugs) pour qu'une nouvelle région ou un nouveau restaurant publié
// apparaisse sans redéploiement.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE}/decouvrir`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Chaque source est indépendante : si l'une échoue, l'autre reste dans le sitemap.
  const [citiesResult, slugsResult] = await Promise.allSettled([
    fetchMarketplaceCities(),
    fetchAllSlugs(),
  ]);

  const cityRoutes: MetadataRoute.Sitemap =
    citiesResult.status === 'fulfilled'
      ? citiesResult.value.map((city) => ({
          url: `${BASE}/decouvrir/${city.slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.9,
        }))
      : [];

  const restaurantRoutes: MetadataRoute.Sitemap =
    slugsResult.status === 'fulfilled'
      ? slugsResult.value.map((slug) => ({
          url: `${BASE}/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.7,
        }))
      : [];

  return [...staticRoutes, ...cityRoutes, ...restaurantRoutes];
}
