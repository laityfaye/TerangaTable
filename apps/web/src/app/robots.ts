import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/decouvrir', '/decouvrir/'],
        disallow: ['/dashboard/', '/super-admin/', '/login', '/api/'],
      },
    ],
    sitemap: 'https://terangatable.cloud/sitemap.xml',
    host: 'https://terangatable.cloud',
  };
}
