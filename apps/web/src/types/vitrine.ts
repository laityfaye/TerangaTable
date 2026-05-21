export interface VitrineRegion {
  name: string;
  currencyCode: string;
  currencySymbol: string;
  locale: string;
  countryName: string;
}

export interface TenantSettings {
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  about_text?: string;
  about_chef?: string;
  about_image?: string;
  opening_hours?: Record<string, { open: string; close: string } | 'closed'>;
}

export interface WebsiteSettings {
  id: string;
  tenant_id: string;
  is_published: boolean;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  google_analytics: string | null;
  sections_config: Record<string, unknown>;
  social_links: SocialLinks;
  font_heading: string;
  font_body: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface VitrineData {
  id: string;
  name: string;
  slug: string;
  status: string;
  region: VitrineRegion;
  settings: TenantSettings;
  website_settings: WebsiteSettings | null;
  modules: string[];
}

export interface VitrineProduct {
  id: string;
  name: string;
  description: string | null;
  basePrice: string | number;
  imageUrl: string | null;
  images: string[];
  tags: string[];
  allergens: string[];
  isFeatured?: boolean;
}

export interface VitrineCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  products: VitrineProduct[];
}

export interface PublicReservationPayload {
  date: string;
  time: string;
  party_size: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
}

export interface PublicReservationResult {
  id: string;
  status: string;
  reservedAt: string;
  partySize: number;
  customerName: string;
}

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};
