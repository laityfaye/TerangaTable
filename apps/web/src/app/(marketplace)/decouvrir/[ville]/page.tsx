import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchMarketplaceCities,
  fetchMarketplaceRestaurants,
  fetchMarketplaceStats,
  fetchMarketplaceFeatured,
  fetchMarketplaceMenusDuJour,
} from '@/lib/marketplace-api';
import MarketplaceNav from '@/components/marketplace/marketplace-nav';
import HeroDecouverte, { type FloatingMenuData, type FloatingRestaurantData } from '@/components/marketplace/hero-decouverte';
import FilterBar from '@/components/marketplace/filter-bar';
import RestaurantCard from '@/components/marketplace/restaurant-card';
import RestaurantMap from '@/components/marketplace/restaurant-map';
import AIRecommendations from '@/components/marketplace/ai-recommendations';
import SponsoredBanner from '@/components/marketplace/sponsored-banner';
import MenuDuJour from '@/components/marketplace/menu-du-jour';
import StatsLive from '@/components/marketplace/stats-live';
import type { MarketplaceFilters } from '@/types/marketplace';
import { Map, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 30;

interface Props {
  params: Promise<{ ville: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateStaticParams() {
  try {
    const cities = await fetchMarketplaceCities();
    return cities.map((c) => ({ ville: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { ville } = await params;
  const sp = await searchParams;

  try {
    const cities = await fetchMarketplaceCities();
    const city = cities.find((c) => c.slug === ville);
    if (!city) return { title: 'TérangaTable' };

    const cuisine = typeof sp['cuisine'] === 'string' ? sp['cuisine'] : undefined;
    const title = cuisine
      ? `Restaurants ${cuisine} à ${city.name} — TérangaTable`
      : `Restaurants à ${city.name} — TérangaTable`;

    const description = `Découvrez les ${city.restaurant_count}+ restaurants de ${city.name}. Menus du jour, livraison, réservations et avis clients sur TérangaTable.`;

    return {
      title,
      description,
      keywords: [
        `restaurants ${city.name}`,
        `livraison repas ${city.name}`,
        `menus du jour ${city.name}`,
        `réservation restaurant ${city.name}`,
        `TérangaTable ${city.name}`,
        city.country_name,
      ],
      alternates: { canonical: `/decouvrir/${ville}` },
      openGraph: {
        title,
        description,
        type: 'website',
        url: `/decouvrir/${ville}`,
        images: city.image_url ? [{ url: city.image_url, alt: `Restaurants à ${city.name}` }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    return { title: `Restaurants — TérangaTable` };
  }
}

// ── Composant pagination ──────────────────────────────────────────────────────

function Pagination({ currentPage, totalPages, citySlug, searchParamsStr }: {
  currentPage: number; totalPages: number; citySlug: string; searchParamsStr: string;
}) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParamsStr);
    params.set('page', String(page));
    return `/decouvrir/${citySlug}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-[#E7E5E4] bg-white text-[#57534E] hover:border-[#C8553D]/40 transition-all text-sm">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </Link>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
          const page = i + 1;
          return (
            <Link
              key={page}
              href={buildUrl(page)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                page === currentPage
                  ? 'bg-[#C8553D] text-white'
                  : 'bg-white border border-[#E7E5E4] text-[#57534E] hover:border-[#C8553D]/40'
              }`}
            >
              {page}
            </Link>
          );
        })}
        {totalPages > 7 && <span className="text-[#A8A29E] px-2">…</span>}
      </div>

      {currentPage < totalPages && (
        <Link href={buildUrl(currentPage + 1)} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-[#E7E5E4] bg-white text-[#57534E] hover:border-[#C8553D]/40 transition-all text-sm">
          Suivant <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default async function CityDiscoveryPage({ params, searchParams }: Props) {
  const { ville } = await params;
  const sp = await searchParams;

  // Récupérer les villes disponibles
  let cities = await fetchMarketplaceCities().catch(() => []);
  const city = cities.find((c) => c.slug === ville);
  if (!city) notFound();

  // Construire les filtres depuis les searchParams
  // Note: avec exactOptionalPropertyTypes, les propriétés optionnelles ne peuvent pas
  // être explicitement undefined — on les omet ou on les spread conditionnellement
  const cuisineRaw = typeof sp['cuisine'] === 'string' ? sp['cuisine'] : null;
  const budgetRaw = typeof sp['budget'] === 'string' ? sp['budget'] : null;
  const qRaw = typeof sp['q'] === 'string' ? sp['q'] : null;
  const sortRaw = typeof sp['sort'] === 'string' ? sp['sort'] : null;
  const latRaw = typeof sp['lat'] === 'string' ? parseFloat(sp['lat']) : null;
  const lngRaw = typeof sp['lng'] === 'string' ? parseFloat(sp['lng']) : null;
  const maxDistanceRaw = typeof sp['max_distance'] === 'string' ? parseFloat(sp['max_distance']) : null;

  const filters: MarketplaceFilters & { page: number; per_page: number } = {
    city_slug: ville,
    ...(cuisineRaw ? { cuisine: cuisineRaw } : {}),
    ...(budgetRaw ? { budget: budgetRaw as '1' | '2' | '3' } : {}),
    open_now: sp['open_now'] === 'true',
    delivery: sp['delivery'] === 'true',
    reservations: sp['reservations'] === 'true',
    ...(qRaw ? { q: qRaw } : {}),
    sort: (sortRaw as 'distance' | 'rating' | 'popular' | 'new' | undefined) ?? 'popular',
    ...(latRaw !== null ? { lat: latRaw } : {}),
    ...(lngRaw !== null ? { lng: lngRaw } : {}),
    ...(maxDistanceRaw !== null ? { max_distance: maxDistanceRaw } : {}),
    page: sp['page'] ? parseInt(sp['page'] as string, 10) : 1,
    per_page: 20,
  };

  // Charger les données en parallèle
  const [restaurantsResponse, stats, featured, menusDuJour] = await Promise.all([
    fetchMarketplaceRestaurants(filters).catch(() => ({ data: [], meta: { total: 0, page: 1, per_page: 20, total_pages: 0, has_next: false } })),
    fetchMarketplaceStats(ville).catch(() => ({ restaurant_count: 0, region_count: 0, cuisine_count: 12, avg_delivery_time: 28 })),
    fetchMarketplaceFeatured(ville).catch(() => []),
    fetchMarketplaceMenusDuJour(ville).catch(() => []),
  ]);

  const { data: restaurants, meta } = restaurantsResponse;
  const activeCities = cities.filter((c) => c.restaurant_count > 0);

  // ── Données pour les cartes flottantes du Hero ────────────────────────────
  const countryFlag: Record<string, string> = { SN: '🇸🇳', CI: '🇨🇮', MA: '🇲🇦', FR: '🇫🇷', TN: '🇹🇳', CM: '🇨🇲' };
  const flag = countryFlag[city.country_code.toUpperCase()] ?? '';

  const firstMenu = menusDuJour[0];
  const firstProduct = firstMenu?.items[0];
  const floatingMenu: FloatingMenuData | undefined = firstProduct
    ? {
        productName: firstProduct.name,
        restaurantName: firstMenu.restaurant_name,
        cityName: city.name,
        restaurantSlug: firstMenu.restaurant_slug,
        price: firstProduct.price,
        currencySymbol: firstMenu.currency_symbol,
        imageUrl: firstProduct.image_url,
      }
    : undefined;

  const firstResto = restaurants[0];
  const cuisineLabel = [firstResto?.cuisine_types[0], flag].filter(Boolean).join(' ');
  const floatingRestaurant: FloatingRestaurantData | undefined = firstResto
    ? {
        name: firstResto.name,
        ...(cuisineLabel ? { cuisineLabel } : {}),
        imageUrl: firstResto.hero_image_url ?? firstResto.logo_url,
        rating: firstResto.rating,
        deliveryTime: firstResto.estimated_delivery_time,
        slug: firstResto.slug,
      }
    : undefined;

  // Construire la chaîne searchParams pour la pagination
  const searchParamsStr = Object.entries(sp)
    .filter(([k]) => k !== 'page')
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  return (
    <>
      {/* Navigation avec recherche */}
      <MarketplaceNav
        currentCity={city.name}
        currentCitySlug={ville}
        cities={activeCities.map((c) => ({ name: c.name, slug: c.slug, country_code: c.country_code }))}
      />

      {/* Hero de la ville */}
      <HeroDecouverte
        cityName={city.name}
        citySlug={ville}
        stats={stats}
        {...(floatingMenu !== undefined ? { floatingMenu } : {})}
        {...(floatingRestaurant !== undefined ? { floatingRestaurant } : {})}
      />

      {/* JSON-LD pour le SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Restaurants à ${city.name}`,
            description: `Les meilleurs restaurants de ${city.name} sur TérangaTable`,
            numberOfItems: meta.total,
            itemListElement: restaurants.slice(0, 10).map((r, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Restaurant',
                name: r.name,
                url: `https://terangatable.com/${r.slug}`,
                address: { '@type': 'PostalAddress', addressLocality: city.name },
                aggregateRating: r.review_count > 0 ? { '@type': 'AggregateRating', ratingValue: r.rating, reviewCount: r.review_count } : undefined,
              },
            })),
          }),
        }}
      />

      {/* Ancre de scroll — ciblée par la recherche du hero */}
      <div id="resultats" style={{ scrollMarginTop: '4rem' }} />

      {/* Barre de filtres (sticky) */}
      <FilterBar citySlug={ville} totalCount={meta.total} />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Banner sponsorisé */}
        {filters.page === 1 && !filters.q && <SponsoredBanner restaurants={featured} />}

        {/* Recommandations IA (page 1 seulement, sans filtre actif) */}
        {filters.page === 1 && !filters.cuisine && !filters.q && restaurants.length > 0 && (
          <AIRecommendations restaurants={restaurants} cityName={city.name} />
        )}

        {/* Menu du jour */}
        {filters.page === 1 && !filters.q && menusDuJour.length > 0 && (
          <MenuDuJour menus={menusDuJour} />
        )}

        {/* Layout principal : grille + carte */}
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">

          {/* Liste des restaurants */}
          <div>
            {/* En-tête de résultats */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-bold text-[#1C1917] text-xl" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {filters.q ? `Résultats pour "${filters.q}" à ${city.name}` : `Restaurants à ${city.name}`}
                </h1>
                <p className="text-sm text-[#57534E] mt-0.5">
                  {meta.total === 0 ? 'Aucun résultat' :
                    `${meta.total.toLocaleString('fr-FR')} restaurant${meta.total > 1 ? 's' : ''}${meta.total_pages > 1 ? ` · Page ${meta.page}/${meta.total_pages}` : ''}`}
                </p>
              </div>
              {/* Lien "Effacer la recherche" quand q est actif */}
              {filters.q && (
                <Link
                  href={`/decouvrir/${ville}`}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#C8553D] hover:text-[#A33D28] transition-colors bg-[#C8553D]/8 px-3 py-1.5 rounded-full"
                >
                  ✕ Effacer
                </Link>
              )}
            </div>

            {/* Bandeau contexte recherche */}
            {filters.q && restaurants.length > 0 && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-[#FAFAF8] border border-[#E7E5E4] text-sm text-[#57534E]">
                <span className="text-base">🔍</span>
                <span>
                  Restaurants proposant{' '}
                  <span className="font-semibold text-[#1C1917]">&ldquo;{filters.q}&rdquo;</span>
                  {' '}— plat du menu, cuisine ou nom
                </span>
              </div>
            )}

            {/* Résultats */}
            {restaurants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-6xl mb-4">🍽️</span>
                <h3 className="font-bold text-[#1C1917] text-lg mb-2">Aucun restaurant trouvé</h3>
                <p className="text-[#57534E] text-sm max-w-sm">
                  Essayez de modifier vos filtres ou d&apos;élargir votre recherche.
                </p>
                <Link
                  href={`/decouvrir/${ville}`}
                  className="mt-4 px-6 py-2.5 rounded-full bg-[#C8553D] text-white text-sm font-semibold hover:bg-[#A33D28] transition-colors"
                >
                  Voir tous les restaurants
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                  {restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      variant="grid"
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.total_pages}
                  citySlug={ville}
                  searchParamsStr={searchParamsStr}
                />
              </>
            )}
          </div>

          {/* Carte (colonne droite, desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <RestaurantMap
                restaurants={restaurants}
                citySlug={ville}
                {...(filters.lat !== undefined && filters.lng !== undefined
                  ? { userLat: filters.lat, userLng: filters.lng }
                  : {})}
                {...(filters.max_distance !== undefined ? { maxDistanceKm: filters.max_distance } : {})}
              />

              {/* Stats en dessous de la carte */}
              <div className="mt-4">
                <StatsLive stats={stats} cityName={city.name} compact />
              </div>

              {/* CTA référencer restaurant */}
              <div className="mt-4 p-4 bg-[#1A1A18] rounded-xl text-center">
                <p className="text-white text-sm font-bold mb-1">Vous êtes restaurateur à {city.name} ?</p>
                <p className="text-white/50 text-xs mb-3">Rejoignez TérangaTable et touchez +10 000 clients</p>
                <Link
                  href="/register"
                  className="block py-2.5 rounded-lg bg-[#C8553D] text-white text-sm font-semibold hover:bg-[#A33D28] transition-colors"
                >
                  Référencer mon restaurant
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Carte mobile (en bas) */}
        <div className="lg:hidden mt-8">
          <h3 className="font-bold text-[#1C1917] mb-3 flex items-center gap-2">
            <Map className="w-5 h-5 text-[#C8553D]" />
            Carte des restaurants
          </h3>
          <RestaurantMap
            restaurants={restaurants}
            citySlug={ville}
            {...(filters.lat !== undefined && filters.lng !== undefined
              ? { userLat: filters.lat, userLng: filters.lng }
              : {})}
            {...(filters.max_distance !== undefined ? { maxDistanceKm: filters.max_distance } : {})}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1A1A18] text-white/50 py-10 px-4 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C8553D] flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <span className="text-white font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>TérangaTable</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/register" className="text-[#C8553D] hover:text-[#E8826F] font-semibold transition-colors">Référencer mon restaurant</Link>
              <Link href="/login" className="hover:text-white transition-colors">Espace restaurant</Link>
              <a href="mailto:contact@terangatable.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>

          {/* Liens vers les villes */}
          <div className="border-t border-white/10 pt-6 mb-4">
            <p className="text-xs mb-2">Restaurants par ville :</p>
            <div className="flex flex-wrap gap-2">
              {activeCities.map((c) => (
                <Link key={c.slug} href={`/decouvrir/${c.slug}`} className="text-xs hover:text-[#C8553D] transition-colors">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center text-xs">
            <p>© {new Date().getFullYear()} TérangaTable — Tous droits réservés</p>
          </div>
        </div>
      </footer>
    </>
  );
}
