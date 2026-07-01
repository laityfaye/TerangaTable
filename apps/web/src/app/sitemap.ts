import type { MetadataRoute } from 'next';
import { fetchMarketplaceCities } from '@/lib/marketplace-api';

const BASE = 'https://terangatable.cloud';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/decouvrir`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const cities = await fetchMarketplaceCities();
    const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
      url: `${BASE}/decouvrir/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
    return [...staticRoutes, ...cityRoutes];
  } catch {
    return staticRoutes;
  }
}
