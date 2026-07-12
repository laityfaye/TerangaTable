import { cache } from 'react';
import type { VitrineData, VitrineCategory, VitrineProduct } from '@/types/vitrine';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';

async function apiFetch<T>(path: string, revalidate: number, tags: string[]): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate, tags },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  // ResponseTransformInterceptor wraps all NestJS responses in { data: ... }
  const json = (await res.json()) as { data: T } | T;
  return (json as { data: T }).data ?? (json as T);
}

// cache() déduplique les appels identiques dans la même requête serveur,
// même entre generateMetadata et les composants (passes séparées dans Next.js).
// Le tag `vitrine:{slug}` permet à /api/revalidate d'invalider ce cache à la
// demande dès qu'un restaurateur sauvegarde ses réglages Apparence.
export const fetchVitrineData = cache(async (slug: string): Promise<VitrineData> => {
  return apiFetch<VitrineData>(`/public/${slug}`, 300, [`vitrine:${slug}`]);
});

export const fetchVitrineMenu = cache(async (slug: string): Promise<VitrineCategory[]> => {
  return apiFetch<VitrineCategory[]>(`/public/${slug}/menu`, 60, [`vitrine:${slug}`]);
});

export const fetchFeaturedProducts = cache(async (slug: string): Promise<VitrineProduct[]> => {
  return apiFetch<VitrineProduct[]>(`/public/${slug}/featured`, 300, [`vitrine:${slug}`]);
});

export interface VitrineReview {
  id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  customer_first_name: string | null;
}

export interface VitrineReviewsPage {
  data: VitrineReview[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// Endpoint dédié : la réponse est déjà `{ data, meta }` (ResponseTransformInterceptor
// ne rajoute pas de couche puisque l'objet a déjà une clé `data`) — pas de
// désenveloppement supplémentaire ici, contrairement à `apiFetch`.
export const fetchVitrineReviews = cache(async (slug: string): Promise<VitrineReviewsPage> => {
  const res = await fetch(`${API_URL}/public/${slug}/reviews`, {
    next: { revalidate: 60, tags: [`vitrine:${slug}`] },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`API ${res.status}: /public/${slug}/reviews`);
  return res.json() as Promise<VitrineReviewsPage>;
});

export async function fetchAllSlugs(): Promise<string[]> {
  return apiFetch<string[]>('/public/slugs', 300, ['vitrine:slugs']);
}

export function formatPrice(price: string | number, currencySymbol: string): string {
  const amount = typeof price === 'string' ? parseFloat(price) : price;
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} ${currencySymbol}`;
}
