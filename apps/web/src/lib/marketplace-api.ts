import { cache } from 'react';
import type {
  MarketplaceCity,
  MarketplaceRestaurant,
  MarketplacePaginatedResponse,
  MarketplaceSearchResult,
  MarketplaceStats,
  MarketplaceFilters,
  RestaurantMenuDuJour,
} from '@/types/marketplace';

// SSR: use internal Docker network URL to bypass nginx/HTTPS
// Browser: use the public HTTPS URL baked in at build time
const API_URL =
  typeof window === 'undefined'
    ? (process.env['API_INTERNAL_URL'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1')
    : (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1');

// ── Fetcher de base ───────────────────────────────────────────────────────────

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_URL}/marketplace${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

/** Fetcher générique — unwrap automatique de { data: T } si présent */
async function marketplaceFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  revalidate = 60,
): Promise<T> {
  const res = await fetch(buildUrl(path, params), {
    next: { revalidate },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Marketplace API ${res.status}: ${path}`);
  }

  const json = await res.json() as { data: T } | T;
  return (json as { data: T }).data ?? (json as T);
}

/** Fetcher brut — retourne la réponse JSON telle quelle (sans unwrap) */
async function marketplaceFetchRaw<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  revalidate = 60,
): Promise<T> {
  const res = await fetch(buildUrl(path, params), {
    next: { revalidate },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Marketplace API ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

// ── API Marketplace ───────────────────────────────────────────────────────────

/** Toutes les villes disponibles avec le nombre de restaurants */
// cache() déduplique dans la même requête serveur (ex: generateMetadata + composant page)
export const fetchMarketplaceCities = cache(async (): Promise<MarketplaceCity[]> => {
  return marketplaceFetch<MarketplaceCity[]>('/cities', undefined, 300);
});

/** Statistiques publiques */
export const fetchMarketplaceStats = cache(async (citySlug?: string): Promise<MarketplaceStats> => {
  return marketplaceFetch<MarketplaceStats>('/stats', citySlug ? { city_slug: citySlug } : undefined, 300);
});

/** Liste filtrée de restaurants */
export async function fetchMarketplaceRestaurants(
  filters: MarketplaceFilters & { page?: number; per_page?: number },
): Promise<MarketplacePaginatedResponse> {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (filters.city_slug) params['city_slug'] = filters.city_slug;
  if (filters.cuisine) params['cuisine'] = filters.cuisine;
  if (filters.budget) params['budget'] = filters.budget;
  if (filters.open_now !== undefined) params['open_now'] = filters.open_now;
  if (filters.delivery !== undefined) params['delivery'] = filters.delivery;
  if (filters.reservations !== undefined) params['reservations'] = filters.reservations;
  if (filters.q) params['q'] = filters.q;
  if (filters.sort) params['sort'] = filters.sort;
  if (filters.lat !== undefined) params['lat'] = filters.lat;
  if (filters.lng !== undefined) params['lng'] = filters.lng;
  if (filters.page) params['page'] = filters.page;
  if (filters.per_page) params['per_page'] = filters.per_page;

  // On utilise le fetcher brut pour conserver { data, meta } sans unwrap
  return marketplaceFetchRaw<MarketplacePaginatedResponse>('/restaurants', params, 30);
}

/** Profil public d'un restaurant */
export async function fetchMarketplaceRestaurant(slug: string): Promise<MarketplaceRestaurant> {
  return marketplaceFetch<MarketplaceRestaurant>(`/restaurants/${slug}`, undefined, 60);
}

/** Recherche rapide (autocomplete) */
export async function fetchMarketplaceSearch(q: string, citySlug?: string): Promise<MarketplaceSearchResult[]> {
  return marketplaceFetch<MarketplaceSearchResult[]>(
    '/search',
    { q, city_slug: citySlug },
    0,
  );
}

/** Restaurants featured d'une ville */
export async function fetchMarketplaceFeatured(citySlug: string): Promise<MarketplaceRestaurant[]> {
  return marketplaceFetch<MarketplaceRestaurant[]>('/featured', { city_slug: citySlug }, 120);
}

/** Types de cuisine disponibles dans une ville */
export async function fetchCuisineTypes(citySlug: string): Promise<string[]> {
  return marketplaceFetch<string[]>('/cuisines', { city_slug: citySlug }, 600);
}

/** Menus du jour : produits actifs des restaurants ouverts d'une ville */
export async function fetchMarketplaceMenusDuJour(citySlug: string): Promise<RestaurantMenuDuJour[]> {
  return marketplaceFetch<RestaurantMenuDuJour[]>('/menus-du-jour', { city_slug: citySlug }, 60);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Calcule l'estimation de livraison avec variation aléatoire */
export function formatDeliveryTime(minutes: number): string {
  const min = Math.max(15, minutes - 5);
  const max = minutes + 10;
  return `${min}–${max} min`;
}

/** Formate la distance en km ou m */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Vérifie si un restaurant est ouvert maintenant (côté client) */
export function checkIsOpenNow(opening_hours: Record<string, { open: string; close: string; closed?: boolean } | null> | null): boolean {
  if (!opening_hours) return true;
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const now = new Date();
  const dayName = dayNames[now.getDay()];
  const todayHours = opening_hours[dayName ?? ''];
  if (!todayHours || todayHours.closed) return false;
  const [openH = 0, openM = 0] = todayHours.open.split(':').map(Number);
  const [closeH = 23, closeM = 59] = todayHours.close.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= openH * 60 + openM && nowMin <= closeH * 60 + closeM;
}
