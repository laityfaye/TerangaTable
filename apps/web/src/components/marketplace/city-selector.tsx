import Link from 'next/link';
import { ChevronRight, ArrowRight, Building2 } from 'lucide-react';
import type { MarketplaceCity } from '@/types/marketplace';
import AnimateIn from '@/components/ui/animate-in';

// ── Données statiques ─────────────────────────────────────────────────────────

interface Props {
  cities: MarketplaceCity[];
}

const CITY_IMAGES: Record<string, string> = {
  dakar:         'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=85',
  thies:         'https://images.unsplash.com/photo-1566897819059-b03e12c3c86b?w=800&q=85',
  'saint-louis': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=85',
  abidjan:       'https://images.unsplash.com/photo-1572451372492-7f3abbc6038d?w=800&q=85',
  casablanca:    'https://images.unsplash.com/photo-1577147443647-81856d5152b0?w=800&q=85',
  paris:         'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=85',
};

const CITY_DESCRIPTIONS: Record<string, string> = {
  dakar:         'Capitale de la teranga — saveurs et traditions',
  thies:         'La ville des tisserands et des bonnes tables',
  'saint-louis': 'Patrimoine UNESCO et gastronomie du fleuve',
  abidjan:       "La locomotive de l'Afrique de l'Ouest",
  casablanca:    'Cuisine marocaine entre modernité et tradition',
  paris:         'La diaspora africaine au cœur de l\'Europe',
};

const COUNTRY_FLAGS: Record<string, string> = {
  SN: '🇸🇳', CI: '🇨🇮', MA: '🇲🇦', FR: '🇫🇷',
};

// ── Composant principal ───────────────────────────────────────────────────────

export default function CitySelector({ cities }: Props) {

  // Cas "aucune ville"
  if (cities.length === 0) {
    return (
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C8553D]/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-[#C8553D]" />
          </div>
          <SectionLabel>Bientôt disponible</SectionLabel>
          <h2 className="text-3xl font-bold text-[#1C1917] mt-3 mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            La plateforme arrive dans votre ville
          </h2>
          <p className="text-[#57534E] mb-8 leading-relaxed">
            TérangaTable se déploie progressivement dans toute l&apos;Afrique.
            Référencez votre restaurant dès maintenant pour être parmi les premiers.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C8553D] text-white font-semibold text-sm hover:bg-[#A33D28] transition-colors"
          >
            Référencer mon restaurant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  const [first, second, ...rest] = cities;

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FAFAF8]">
      <div className="max-w-6xl mx-auto">

        {/* En-tête */}
        <AnimateIn type="up" threshold={0.1}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <SectionLabel>Couverture</SectionLabel>
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1C1917] mt-2"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Choisissez votre ville
            </h2>
            <p className="text-[#57534E] mt-2 text-sm sm:text-base">
              {cities.length} ville{cities.length > 1 ? 's' : ''} disponible{cities.length > 1 ? 's' : ''} en Afrique & Europe
            </p>
          </div>
          {cities.length > 3 && (
            <Link
              href="/decouvrir"
              className="text-sm font-semibold text-[#C8553D] hover:text-[#A33D28] flex items-center gap-1 transition-colors shrink-0"
            >
              Voir toutes les villes
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        </AnimateIn>

        {/* Grille principale */}
        {cities.length === 1 && first ? (
          <AnimateIn type="in" threshold={0.1}><CityCardFull city={first} /></AnimateIn>
        ) : cities.length >= 2 ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Grande carte principale */}
            {first && (
              <AnimateIn type="left" delay={0} threshold={0.1} className="lg:col-span-3">
                <CityCardLarge city={first} />
              </AnimateIn>
            )}
            {/* Colonne secondaire */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {second && (
                <AnimateIn type="right" delay={120} threshold={0.1} className="flex-1">
                  <CityCardMedium city={second} />
                </AnimateIn>
              )}
              {rest[0] && (
                <AnimateIn type="right" delay={220} threshold={0.1} className="flex-1">
                  <CityCardMedium city={rest[0]} />
                </AnimateIn>
              )}
            </div>
          </div>
        ) : null}

        {/* Grille des villes supplémentaires */}
        {cities.length > 3 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {cities.slice(3).map((city, i) => (
              <AnimateIn key={city.slug} type="up" delay={i * 60} threshold={0.05}>
                <CityCardMini city={city} />
              </AnimateIn>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px w-8 bg-[#C8553D]" />
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8553D]">{children}</span>
    </div>
  );
}

// Grande carte hero (2/3 de largeur)
function CityCardLarge({ city }: { city: MarketplaceCity }) {
  const flag = COUNTRY_FLAGS[city.country_code] ?? '🌍';
  const image = city.image_url ?? CITY_IMAGES[city.slug] ?? CITY_IMAGES['dakar'];
  const description = CITY_DESCRIPTIONS[city.slug] ?? city.description ?? city.country_name;
  const hasRestaurants = city.restaurant_count > 0;

  return (
    <Link
      href={`/decouvrir/${city.slug}`}
      className="group hover-lift relative overflow-hidden rounded-2xl flex flex-col justify-end bg-[#1A1A18] aspect-[4/3] sm:aspect-[16/10]"
    >
      <img
        src={image}
        alt={city.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
      />

      {/* Dégradé */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#C8553D]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Badge statut */}
      {!hasRestaurants && (
        <div className="absolute top-4 right-4">
          <span className="px-2.5 py-1 rounded-full bg-[#D4A843]/95 text-[#1A1A18] text-xs font-bold shadow-lg">
            Bientôt
          </span>
        </div>
      )}
      {hasRestaurants && (
        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 rounded-full bg-[#C8553D] text-white text-xs font-bold shadow-lg">
            {flag} Populaire
          </span>
        </div>
      )}

      {/* Contenu */}
      <div className="relative z-10 p-5 sm:p-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3
              className="text-white text-2xl sm:text-3xl font-bold leading-tight"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              {city.name}
            </h3>
            <p className="text-white/60 text-sm mt-1 max-w-sm leading-relaxed">{description}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-white/50 text-sm">📍</span>
              <span className="text-white/80 text-sm font-medium">
                {hasRestaurants
                  ? `${city.restaurant_count} restaurant${city.restaurant_count > 1 ? 's' : ''}`
                  : 'Déploiement en cours'}
              </span>
            </div>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-[#C8553D] group-hover:border-[#C8553D] transition-all duration-300">
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Carte moyenne (pour la colonne latérale)
function CityCardMedium({ city }: { city: MarketplaceCity }) {
  const flag = COUNTRY_FLAGS[city.country_code] ?? '🌍';
  const image = city.image_url ?? CITY_IMAGES[city.slug] ?? CITY_IMAGES['dakar'];
  const hasRestaurants = city.restaurant_count > 0;

  return (
    <Link
      href={`/decouvrir/${city.slug}`}
      className="group hover-lift relative overflow-hidden rounded-2xl flex flex-col justify-end bg-[#1A1A18] min-h-[160px] flex-1"
    >
      <img
        src={image}
        alt={city.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {!hasRestaurants && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 rounded-full bg-[#D4A843]/90 text-[#1A1A18] text-[10px] font-bold">
            Bientôt
          </span>
        </div>
      )}

      <div className="relative z-10 p-4 flex items-end justify-between gap-2">
        <div>
          <div className="text-lg mr-1 inline">{flag}</div>
          <h3
            className="text-white text-lg font-bold inline leading-tight"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            {city.name}
          </h3>
          <div className="text-white/60 text-xs mt-1">
            {hasRestaurants
              ? `${city.restaurant_count} restaurant${city.restaurant_count > 1 ? 's' : ''}`
              : 'Déploiement en cours'}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}

// Petite carte (grille des villes supplémentaires)
function CityCardMini({ city }: { city: MarketplaceCity }) {
  const flag = COUNTRY_FLAGS[city.country_code] ?? '🌍';
  const hasRestaurants = city.restaurant_count > 0;

  return (
    <Link
      href={`/decouvrir/${city.slug}`}
      className="group hover-lift flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#E7E5E4] hover:border-[#C8553D]/40 transition-all duration-200"
    >
      <span className="text-2xl shrink-0">{flag}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#1C1917] group-hover:text-[#C8553D] transition-colors truncate">
          {city.name}
        </p>
        <p className="text-xs text-[#A8A29E] mt-0.5">
          {hasRestaurants ? `${city.restaurant_count} restaurants` : 'Bientôt'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#C8553D] group-hover:translate-x-0.5 shrink-0 transition-all" />
    </Link>
  );
}

// Carte pleine largeur (quand 1 seule ville)
function CityCardFull({ city }: { city: MarketplaceCity }) {
  const flag = COUNTRY_FLAGS[city.country_code] ?? '🌍';
  const image = city.image_url ?? CITY_IMAGES[city.slug] ?? CITY_IMAGES['dakar'];
  const description = CITY_DESCRIPTIONS[city.slug] ?? city.country_name;

  return (
    <Link
      href={`/decouvrir/${city.slug}`}
      className="group relative overflow-hidden rounded-2xl flex flex-col justify-end bg-[#1A1A18] aspect-[2/1] max-h-72"
    >
      <img
        src={image}
        alt={city.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
      <div className="relative z-10 p-7">
        <span className="text-2xl mr-2">{flag}</span>
        <h3
          className="text-white text-2xl font-bold inline"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          {city.name}
        </h3>
        <p className="text-white/60 text-sm mt-2">{description}</p>
        <p className="text-white/80 text-sm mt-2 font-medium flex items-center gap-1.5">
          <span>📍</span>
          {city.restaurant_count > 0
            ? `${city.restaurant_count} restaurant${city.restaurant_count > 1 ? 's' : ''}`
            : 'Déploiement en cours'}
        </p>
      </div>
    </Link>
  );
}
