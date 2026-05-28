// ── Types Marketplace TerangaTable ───────────────────────────────────────────

export interface OpeningHoursDay {
  open: string;   // "08:00"
  close: string;  // "22:00"
  closed?: boolean;
}

export interface OpeningHours {
  lundi?: OpeningHoursDay | null;
  mardi?: OpeningHoursDay | null;
  mercredi?: OpeningHoursDay | null;
  jeudi?: OpeningHoursDay | null;
  vendredi?: OpeningHoursDay | null;
  samedi?: OpeningHoursDay | null;
  dimanche?: OpeningHoursDay | null;
}

export interface MarketplaceCity {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  locale: string;
  restaurant_count: number;
  lat?: number;
  lng?: number;
  description?: string;
  image_url?: string;
}

export interface MarketplaceRestaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cuisine_types: string[];
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string;
  address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  opening_hours: OpeningHours | null;
  is_open_now: boolean;
  rating: number;
  review_count: number;
  delivery_available: boolean;
  reservations_available: boolean;
  min_order: number | null;
  delivery_fee: number | null;
  estimated_delivery_time: number;
  price_range: 1 | 2 | 3;  // 1=Budget, 2=Moyen, 3=Premium
  is_sponsored: boolean;
  is_featured: boolean;
  tags: string[];
  region: {
    name: string;
    slug: string;
    currency_code: string;
    currency_symbol: string;
  };
  distance?: number;          // en km (si géolocalisation active)
  order_count: number;
  created_at: string;
}

export interface MarketplacePaginatedResponse {
  data: MarketplaceRestaurant[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
  };
}

export interface MarketplaceSearchResult {
  slug: string;
  name: string;
  cuisine_type: string | null;
  logo_url: string | null;
  address: string | null;
  city: string;
  city_slug: string;
  /** Nom du plat qui a déclenché le match (ex : "Thiéboudienne") */
  matched_product?: string | null;
  /** Ce qui a matché : le nom du restaurant, un plat ou le type de cuisine */
  matched_via?: 'name' | 'product' | 'cuisine';
}

export interface MenuDuJourItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  is_featured: boolean;
}

export interface RestaurantMenuDuJour {
  restaurant_id: string;
  restaurant_slug: string;
  restaurant_name: string;
  logo_url: string | null;
  estimated_delivery_time: number;
  currency_symbol: string;
  is_open_now: boolean;
  items: MenuDuJourItem[];
}

export interface MarketplaceStats {
  restaurant_count: number;
  region_count: number;
  cuisine_count: number;
  avg_delivery_time: number;
}

export interface MarketplaceFilters {
  city_slug?: string;
  cuisine?: string;
  budget?: '1' | '2' | '3';
  open_now?: boolean;
  delivery?: boolean;
  reservations?: boolean;
  q?: string;
  sort?: 'distance' | 'rating' | 'popular' | 'new';
  lat?: number;
  lng?: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────

export const CUISINE_TYPES = [
  { value: 'senegalaise', label: 'Sénégalaise', emoji: '🇸🇳' },
  { value: 'africaine', label: 'Africaine', emoji: '🌍' },
  { value: 'fast-food', label: 'Fast-food', emoji: '🍔' },
  { value: 'grillades', label: 'Grillades', emoji: '🔥' },
  { value: 'fruits-de-mer', label: 'Fruits de mer', emoji: '🦞' },
  { value: 'pizza', label: 'Pizza / Italienne', emoji: '🍕' },
  { value: 'libanaise', label: 'Libanaise', emoji: '🧆' },
  { value: 'francaise', label: 'Française', emoji: '🥐' },
  { value: 'vegetarien', label: 'Végétarien', emoji: '🥗' },
  { value: 'asiatique', label: 'Asiatique', emoji: '🍜' },
] as const;

export const PRICE_RANGE_LABELS: Record<number, { label: string; symbol: string; color: string }> = {
  1: { label: 'Budget', symbol: '₣', color: '#2D6A4F' },
  2: { label: 'Moyen', symbol: '₣₣', color: '#D4A843' },
  3: { label: 'Premium', symbol: '₣₣₣', color: '#C8553D' },
};

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Les plus populaires' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'distance', label: 'Les plus proches' },
  { value: 'new', label: 'Nouveaux arrivants' },
] as const;
