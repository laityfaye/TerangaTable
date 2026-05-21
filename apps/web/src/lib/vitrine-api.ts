import type { VitrineData, VitrineCategory, VitrineProduct } from '@/types/vitrine';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';

async function apiFetch<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  // ResponseTransformInterceptor wraps all NestJS responses in { data: ... }
  const json = (await res.json()) as { data: T } | T;
  return (json as { data: T }).data ?? (json as T);
}

export async function fetchVitrineData(slug: string): Promise<VitrineData> {
  return apiFetch<VitrineData>(`/public/${slug}`, 300);
}

export async function fetchVitrineMenu(slug: string): Promise<VitrineCategory[]> {
  return apiFetch<VitrineCategory[]>(`/public/${slug}/menu`, 60);
}

export async function fetchFeaturedProducts(slug: string): Promise<VitrineProduct[]> {
  return apiFetch<VitrineProduct[]>(`/public/${slug}/featured`, 300);
}

export async function fetchAllSlugs(): Promise<string[]> {
  return apiFetch<string[]>('/public/slugs', 300);
}

export function formatPrice(price: string | number, currencySymbol: string): string {
  const amount = typeof price === 'string' ? parseFloat(price) : price;
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} ${currencySymbol}`;
}
