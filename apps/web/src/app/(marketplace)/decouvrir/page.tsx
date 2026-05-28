import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search, Smartphone, Zap, MapPin, ChefHat, Users } from 'lucide-react';
import AnimateIn from '@/components/ui/animate-in';
import { fetchMarketplaceCities, fetchMarketplaceStats, fetchMarketplaceMenusDuJour, fetchMarketplaceRestaurants, fetchMarketplaceSearch } from '@/lib/marketplace-api';
import type { FloatingMenuData, FloatingRestaurantData } from '@/components/marketplace/hero-decouverte';
import MarketplaceNav from '@/components/marketplace/marketplace-nav';
import HeroDecouverte from '@/components/marketplace/hero-decouverte';
import CuisineCategories from '@/components/marketplace/cuisine-categories';
import StatsLive from '@/components/marketplace/stats-live';
import CitySelector from '@/components/marketplace/city-selector';
import type { MarketplaceCity } from '@/types/marketplace';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Découvrez les restaurants près de vous — TérangaTable',
  description:
    "Tous les meilleurs restaurants d'Afrique en un seul endroit — menus du jour, livraison, réservations et avis clients.",
  alternates: { canonical: 'https://terangatable.com/decouvrir' },
  openGraph: {
    title: 'TérangaTable — Découvrez les restaurants',
    description: 'Trouvez les meilleurs restaurants africains près de chez vous.',
    type: 'website',
  },
};

// ── Fallbacks ─────────────────────────────────────────────────────────────────

const FALLBACK_CITIES: MarketplaceCity[] = [
  {
    id: 'dakar',
    name: 'Dakar',
    slug: 'dakar',
    country_code: 'SN',
    country_name: 'Sénégal',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    locale: 'fr',
    restaurant_count: 0,
    lat: 14.6928,
    lng: -17.4467,
    description: 'Capitale dynamique du Sénégal',
    image_url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  },
  {
    id: 'thies',
    name: 'Thiès',
    slug: 'thies',
    country_code: 'SN',
    country_name: 'Sénégal',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    locale: 'fr',
    restaurant_count: 0,
    lat: 14.7924,
    lng: -16.9261,
    description: 'La deuxième ville du Sénégal',
    image_url: 'https://images.unsplash.com/photo-1566897819059-b03e12c3c86b?w=800',
  },
  {
    id: 'saint-louis',
    name: 'Saint-Louis',
    slug: 'saint-louis',
    country_code: 'SN',
    country_name: 'Sénégal',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    locale: 'fr',
    restaurant_count: 0,
    lat: 16.0179,
    lng: -16.5017,
    description: 'La ville historique du fleuve',
    image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
  },
  {
    id: 'abidjan',
    name: 'Abidjan',
    slug: 'abidjan',
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    locale: 'fr',
    restaurant_count: 0,
    lat: 5.36,
    lng: -4.0083,
    description: 'La perle de la lagune ivoirienne',
    image_url: 'https://images.unsplash.com/photo-1572451372492-7f3abbc6038d?w=800',
  },
  {
    id: 'casablanca',
    name: 'Casablanca',
    slug: 'casablanca',
    country_code: 'MA',
    country_name: 'Maroc',
    currency_code: 'MAD',
    currency_symbol: 'DH',
    locale: 'fr',
    restaurant_count: 0,
    lat: 33.5731,
    lng: -7.5898,
    description: 'La métropole du Maroc',
    image_url: 'https://images.unsplash.com/photo-1577147443647-81856d5152b0?w=800',
  },
  {
    id: 'paris',
    name: 'Paris',
    slug: 'paris',
    country_code: 'FR',
    country_name: 'France',
    currency_code: 'EUR',
    currency_symbol: '€',
    locale: 'fr',
    restaurant_count: 0,
    lat: 48.8566,
    lng: 2.3522,
    description: 'La ville lumière',
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  },
];

const FALLBACK_STATS = {
  restaurant_count: 0,
  region_count: 6,
  cuisine_count: 12,
  avg_delivery_time: 28,
};

// ── Page ──────────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = { SN: '🇸🇳', CI: '🇨🇮', MA: '🇲🇦', FR: '🇫🇷', TN: '🇹🇳', CM: '🇨🇲' };

export default async function DiscoveryHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const searchQuery = typeof sp['q'] === 'string' ? sp['q'].trim() : '';

  // Ville par défaut pour les cartes flottantes : première ville active ou Dakar
  const DEFAULT_CITY = 'dakar';

  const [apiCities, apiStats, apiMenus, apiRestaurants, searchResults] = await Promise.all([
    fetchMarketplaceCities().catch(() => null),
    fetchMarketplaceStats().catch(() => null),
    fetchMarketplaceMenusDuJour(DEFAULT_CITY).catch(() => []),
    fetchMarketplaceRestaurants({ city_slug: DEFAULT_CITY, sort: 'popular', page: 1, per_page: 1 }).catch(() => null),
    searchQuery ? fetchMarketplaceSearch(searchQuery).catch(() => []) : Promise.resolve([]),
  ]);

  const rawCities: MarketplaceCity[] =
    apiCities && apiCities.length > 0 ? apiCities : FALLBACK_CITIES;
  const stats = apiStats ?? FALLBACK_STATS;

  // Pour chaque ville, récupère le restaurant le plus populaire pour utiliser son image en couverture
  const topImages = await Promise.all(
    rawCities
      .filter(c => c.restaurant_count > 0)
      .map(c =>
        fetchMarketplaceRestaurants({ city_slug: c.slug, sort: 'popular', page: 1, per_page: 1 })
          .then(r => ({
            slug: c.slug,
            imageUrl: r.data[0]?.hero_image_url ?? r.data[0]?.logo_url ?? null,
          }))
          .catch(() => ({ slug: c.slug, imageUrl: null })),
      ),
  );
  const topImageMap = Object.fromEntries(topImages.map(r => [r.slug, r.imageUrl]));

  const cities: MarketplaceCity[] = rawCities
    .map(c => ({ ...c, image_url: topImageMap[c.slug] ?? c.image_url }))
    .sort((a, b) => b.restaurant_count - a.restaurant_count);

  const suggestedCities = cities.slice(0, 5).map(c => ({
    name: c.name,
    slug: c.slug,
    flag: COUNTRY_FLAGS[c.country_code] ?? '🌍',
    restaurant_count: c.restaurant_count,
  }));

  // Cartes flottantes du hero
  const defaultCity = cities.find(c => c.slug === DEFAULT_CITY) ?? cities[0];
  const firstMenu = apiMenus[0];
  const firstProduct = firstMenu?.items[0];
  const floatingMenu: FloatingMenuData | undefined = firstProduct
    ? {
        productName: firstProduct.name,
        restaurantName: firstMenu.restaurant_name,
        cityName: defaultCity?.name ?? 'Dakar',
        restaurantSlug: firstMenu.restaurant_slug,
        price: firstProduct.price,
        currencySymbol: firstMenu.currency_symbol,
        imageUrl: firstProduct.image_url,
      }
    : undefined;

  const firstResto = apiRestaurants?.data[0];
  const flag = defaultCity ? (COUNTRY_FLAGS[defaultCity.country_code] ?? '') : '';
  const cuisineLabelGlobal = [firstResto?.cuisine_types[0], flag].filter(Boolean).join(' ');
  const floatingRestaurant: FloatingRestaurantData | undefined = firstResto
    ? {
        name: firstResto.name,
        ...(cuisineLabelGlobal ? { cuisineLabel: cuisineLabelGlobal } : {}),
        imageUrl: firstResto.hero_image_url ?? firstResto.logo_url,
        rating: firstResto.rating,
        deliveryTime: firstResto.estimated_delivery_time,
        slug: firstResto.slug,
      }
    : undefined;

  return (
    <>
      {/* ── Navigation (transparente au sommet, opaque au scroll) ── */}
      <MarketplaceNav
        cities={cities.map(c => ({ name: c.name, slug: c.slug, country_code: c.country_code }))}
      />

      {/* ── Hero plein écran ── */}
      <HeroDecouverte
        stats={stats}
        suggestedCities={suggestedCities}
        {...(floatingMenu !== undefined ? { floatingMenu } : {})}
        {...(floatingRestaurant !== undefined ? { floatingRestaurant } : {})}
      />

      {/* Ancre de scroll — ciblée par la recherche du hero */}
      <div id="resultats" style={{ scrollMarginTop: '4rem' }} />

      {/* ── Résultats de recherche globale ── */}
      {searchQuery && (
        <section className="bg-white border-b border-[#E7E5E4]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[#1C1917] text-xl" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Résultats pour &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-sm text-[#57534E] mt-0.5">
                  {searchResults.length === 0
                    ? 'Aucun restaurant trouvé — essayez une autre ville'
                    : `${searchResults.length} restaurant${searchResults.length > 1 ? 's' : ''} sur toutes les villes`}
                </p>
              </div>
              <Link
                href="/decouvrir"
                className="text-sm text-[#C8553D] hover:text-[#A33D28] font-semibold flex items-center gap-1 transition-colors"
              >
                ✕ Effacer
              </Link>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map(r => (
                  <div
                    key={r.slug}
                    className="flex items-center gap-3 p-3 bg-[#FAFAF8] rounded-xl border border-[#E7E5E4] hover:border-[#C8553D]/40 hover:shadow-sm transition-all group"
                  >
                    {/* Logo */}
                    {r.logo_url ? (
                      <img src={r.logo_url} alt={r.name} className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#C8553D]/10 flex items-center justify-center shrink-0 text-xl">🍽️</div>
                    )}

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${r.slug}/menu`}
                        className="font-semibold text-sm text-[#1C1917] truncate group-hover:text-[#C8553D] transition-colors block"
                      >
                        {r.name}
                      </Link>
                      {/* Raison du match : plat, cuisine ou nom */}
                      {r.matched_via === 'product' && r.matched_product ? (
                        <div className="text-xs mt-0.5 truncate">
                          <span className="text-[#C8553D] font-medium">🍽️ {r.matched_product}</span>
                          <span className="text-[#A8A29E]"> · </span>
                          {r.city_slug ? (
                            <Link href={`/decouvrir/${r.city_slug}?q=${encodeURIComponent(searchQuery)}`} className="text-[#57534E] hover:underline">
                              {r.city}
                            </Link>
                          ) : <span className="text-[#57534E]">{r.city}</span>}
                        </div>
                      ) : r.matched_via === 'cuisine' ? (
                        <div className="text-xs mt-0.5 truncate">
                          <span className="text-[#D4A843] font-medium">👨‍🍳 {r.cuisine_type}</span>
                          <span className="text-[#A8A29E]"> · </span>
                          {r.city_slug ? (
                            <Link href={`/decouvrir/${r.city_slug}?q=${encodeURIComponent(searchQuery)}`} className="text-[#57534E] hover:underline">
                              {r.city}
                            </Link>
                          ) : <span className="text-[#57534E]">{r.city}</span>}
                        </div>
                      ) : (
                        <div className="text-xs text-[#57534E] truncate mt-0.5">
                          {r.cuisine_type && <span>{r.cuisine_type} · </span>}
                          {r.city_slug ? (
                            <Link href={`/decouvrir/${r.city_slug}?q=${encodeURIComponent(searchQuery)}`} className="text-[#C8553D] hover:underline">
                              {r.city}
                            </Link>
                          ) : <span>{r.city}</span>}
                        </div>
                      )}
                    </div>

                    {/* Flèche → restaurant */}
                    <Link href={`/${r.slug}/menu`} className="shrink-0" aria-label={`Voir ${r.name}`}>
                      <ArrowRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#C8553D] transition-colors" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              /* Pas de résultats : suggérer les villes */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {cities.filter(c => c.restaurant_count > 0).slice(0, 5).map(c => (
                  <Link
                    key={c.slug}
                    href={`/decouvrir/${c.slug}?q=${encodeURIComponent(searchQuery)}`}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-[#E7E5E4] hover:border-[#C8553D]/40 hover:bg-[#FAFAF8] transition-all text-center"
                  >
                    <span className="text-2xl">{COUNTRY_FLAGS[c.country_code] ?? '🌍'}</span>
                    <span className="font-semibold text-sm text-[#1C1917]">{c.name}</span>
                    <span className="text-xs text-[#C8553D]">Chercher ici →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Barre de catégories sticky ── */}
      {!searchQuery && <CuisineCategories />}

      {/* ── Stats plein largeur ── */}
      <StatsLive stats={stats} />

      {/* ── Contenu principal ── */}
      <main>
        {/* Sélecteur de ville */}
        <CitySelector cities={cities} />

        {/* Comment ça marche */}
        <HowItWorksSection />

        {/* CTA Restaurant Owner */}
        <RestaurantOwnerSection />
      </main>

      {/* ── Footer ── */}
      <MarketplaceFooter />
    </>
  );
}

// ── Section "Comment ça marche" ───────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: <Search className="w-6 h-6" />,
      title: 'Cherchez',
      description:
        'Tapez un plat, un restaurant ou une cuisine. Ou laissez-vous guider par votre position GPS pour découvrir ce qui est ouvert autour de vous.',
      color: '#C8553D',
    },
    {
      number: '02',
      icon: <MapPin className="w-6 h-6" />,
      title: 'Découvrez',
      description:
        'Consultez les menus, les avis clients, les horaires et les photos. Filtrez par cuisine, budget ou délai de livraison.',
      color: '#D4A843',
    },
    {
      number: '03',
      icon: <Zap className="w-6 h-6" />,
      title: 'Commandez',
      description:
        'Passez votre commande en ligne ou réservez une table en quelques secondes. Payez par Wave, Orange Money, carte ou espèces.',
      color: '#2D6A4F',
    },
  ];

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">

        {/* En-tête */}
        <AnimateIn type="up" threshold={0.15}>
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-[#C8553D]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8553D]">
              Simple comme bonjour
            </span>
            <div className="h-px w-10 bg-[#C8553D]" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Comment ça marche ?
          </h2>
          <p className="text-[#57534E] mt-3 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            TérangaTable vous connecte aux meilleurs restaurants de votre ville en 3 étapes.
          </p>
        </div>
        </AnimateIn>

        {/* Étapes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Ligne de connexion desktop */}
          <div className="hidden md:block absolute top-14 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-[#C8553D]/30 via-[#D4A843]/30 to-[#2D6A4F]/30" />

          {steps.map((step, i) => (
            <AnimateIn key={i} type="up" delay={i * 130} threshold={0.1}>
            <div className="relative flex flex-col items-center text-center group">
              {/* Numéro + icône */}
              <div className="relative mb-6">
                <div
                  className="w-28 h-28 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: `${step.color}10`, border: `1.5px solid ${step.color}25` }}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.icon}
                  </div>
                </div>
                {/* Numéro */}
                <div
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                  style={{ backgroundColor: step.color }}
                >
                  {step.number}
                </div>
              </div>

              <h3
                className="text-xl font-bold text-[#1C1917] mb-3"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {step.title}
              </h3>
              <p className="text-[#57534E] text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
            </AnimateIn>
          ))}
        </div>

        {/* CTA central */}
        <AnimateIn type="pop" delay={200} threshold={0.1}>
        <div className="flex justify-center mt-12">
          <Link
            href="/decouvrir/dakar"
            className="hover-pop inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C8553D] text-white font-semibold text-sm hover:bg-[#A33D28] transition-colors shadow-md hover:shadow-lg"
          >
            Explorer les restaurants
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        </AnimateIn>
      </div>
    </section>
  );
}

// ── Section CTA Restaurateurs ──────────────────────────────────────────────────

function RestaurantOwnerSection() {
  const perks = [
    { icon: <Smartphone className="w-5 h-5" />, label: 'Caisse & POS mobile' },
    { icon: <ChefHat className="w-5 h-5" />, label: 'Menu digital en ligne' },
    { icon: <Users className="w-5 h-5" />, label: 'CRM & Fidélité clients' },
    { icon: <Zap className="w-5 h-5" />, label: 'Commandes en temps réel' },
  ];

  return (
    <section className="relative overflow-hidden bg-[#1A1A18] py-20 sm:py-24 px-4 sm:px-6">
      {/* Fond image subtil */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=60"
          alt=""
          className="w-full h-full object-cover opacity-30"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A18]/80 to-[#1A1A18]" />
      </div>

      {/* Halos */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C8553D]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-[#D4A843]/6 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Texte */}
          <AnimateIn type="left" threshold={0.15}>
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-[#C8553D]" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8553D]">
                Pour les restaurateurs
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-[2.5rem] font-bold text-white leading-tight mb-5"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Votre restaurant n&apos;est pas encore sur TérangaTable&nbsp;?
            </h2>
            <p className="text-white/55 text-base leading-relaxed mb-8">
              Rejoignez 500+ restaurateurs qui ont digitalisé leur activité avec TérangaTable —
              caisse POS, menu digital, commandes en ligne, réservations et analytics.
              Tout en un, pensé pour l&apos;Afrique.
            </p>

            {/* Perks */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {perks.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white/70 text-sm"
                >
                  <span className="text-[#C8553D] shrink-0">{p.icon}</span>
                  <span>{p.label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="hover-pop inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#C8553D] text-white font-bold text-sm hover:bg-[#B04432] transition-colors shadow-lg"
              >
                Référencer mon restaurant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="hover-pop inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/8 hover:border-white/35 transition-all"
              >
                Espace restaurant
              </Link>
            </div>
          </div>
          </AnimateIn>

          {/* Illustration — carte restaurant mockup */}
          <AnimateIn type="right" delay={150} threshold={0.15}>
          <div className="relative flex justify-center md:block">
            <div className="relative mx-auto w-80 pb-6 pr-8">
              {/* Carte principale */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
                <div className="relative h-44 bg-[#F5F4F2]">
                  <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80"
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2D6A4F] text-white text-xs font-semibold shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Ouvert maintenant
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-[#1C1917] text-base">La Teranga</h4>
                      <p className="text-[#57534E] text-xs mt-0.5">Sénégalaise · Dakar</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#1C1917]">⭐ 4.8</div>
                      <div className="text-xs text-[#A8A29E]">127 avis</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#FAFAF8] border border-[#E7E5E4] text-xs text-[#57534E]">
                      🚀 25 min
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#FAFAF8] border border-[#E7E5E4] text-xs text-[#57534E]">
                      💰 Dès 2 500 F
                    </span>
                  </div>
                  <button className="w-full mt-3 py-2.5 rounded-xl bg-[#C8553D] text-white text-sm font-semibold hover:bg-[#A33D28] transition-colors">
                    Commander maintenant
                  </button>
                </div>
              </div>

              {/* Badge flottant "stats" */}
              <div className="absolute -bottom-4 -right-6 w-40 bg-[#1A1A18] border border-white/10 rounded-2xl p-3 shadow-xl">
                <div className="text-[#D4A843] text-[9px] font-bold uppercase tracking-widest mb-1.5">
                  Ce mois-ci
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-white font-bold text-2xl" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    142
                  </span>
                  <span className="text-white/50 text-xs mb-0.5">commandes</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[#2D6A4F] text-xs">↑ 18%</span>
                  <span className="text-white/30 text-xs">vs mois dernier</span>
                </div>
              </div>
            </div>
          </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function MarketplaceFooter() {
  const links = {
    Explorer: [
      { label: 'Tous les restaurants', href: '/decouvrir' },
      { label: 'Dakar', href: '/decouvrir/dakar' },
      { label: 'Abidjan', href: '/decouvrir/abidjan' },
      { label: 'Casablanca', href: '/decouvrir/casablanca' },
    ],
    Plateforme: [
      { label: 'Fonctionnalités', href: '/#fonctionnalites' },
      { label: 'Tarifs', href: '/#tarifs' },
      { label: 'Régions', href: '/#regions' },
      { label: 'Espace restaurant', href: '/login' },
    ],
    Contact: [
      { label: 'contact@terangatable.com', href: 'mailto:contact@terangatable.com' },
      { label: 'Confidentialité', href: '#' },
      { label: 'Conditions d\'utilisation', href: '#' },
    ],
  };

  return (
    <footer className="bg-[#111110] text-white/45">
      {/* Bande supérieure */}
      <div className="border-t border-white/8 px-4 sm:px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#C8553D] flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span
                className="text-white font-bold text-base"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                TérangaTable
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-[200px]">
              Le Shopify + Odoo de la Restauration en Afrique.
            </p>
            <div className="flex gap-3 mt-5">
              {/* Réseaux sociaux (placeholders) */}
              {['𝕏', 'in', 'f'].map(s => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-xs text-white/50 hover:bg-[#C8553D]/20 hover:text-white hover:border-[#C8553D]/40 transition-all"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Colonnes liens */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4
                className="text-white text-sm font-semibold mb-4"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm hover:text-white transition-colors leading-relaxed"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bande inférieure */}
      <div className="border-t border-white/6 px-4 sm:px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} TérangaTable — Tous droits réservés.</p>
          <p>
            Made with{' '}
            <span className="text-[#C8553D]">♥</span>{' '}
            pour la restauration africaine
          </p>
        </div>
      </div>
    </footer>
  );
}
