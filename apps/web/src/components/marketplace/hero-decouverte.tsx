'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Navigation, ArrowRight, Star, Clock,
  ChevronRight, Sparkles, X,
} from 'lucide-react';
import type { MarketplaceStats } from '@/types/marketplace';

// ── Données décoratives ──────────────────────────────────────────────────────

const ROTATING_WORDS = ['africains', 'sénégalais', 'ivoiriens', 'marocains', 'du monde'];

const QUICK_TAGS = [
  { emoji: '🍚', label: 'Thiéboudienne', query: 'thiéboudienne' },
  { emoji: '🔥', label: 'Grillades', query: 'grillades' },
  { emoji: '🦞', label: 'Fruits de mer', query: 'fruits de mer' },
  { emoji: '⚡', label: 'Livraison rapide', query: '' },
  { emoji: '⭐', label: 'Top notés', query: '' },
];

// ── Types pour les cartes flottantes ─────────────────────────────────────────

export interface FloatingMenuData {
  productName: string;
  restaurantName: string;
  cityName: string;
  restaurantSlug: string;
  price: number;
  currencySymbol: string;
  imageUrl?: string | null;
}

export interface FloatingRestaurantData {
  name: string;
  cuisineLabel?: string;   // ex: "Sénégalaise 🇸🇳"
  imageUrl?: string | null;
  rating?: number;
  deliveryTime?: number;
  slug?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  cityName?: string;
  citySlug?: string;
  stats?: MarketplaceStats;
  suggestedCities?: Array<{ name: string; slug: string; flag: string; restaurant_count: number }>;
  floatingMenu?: FloatingMenuData;
  floatingRestaurant?: FloatingRestaurantData;
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function HeroDecouverte({ cityName, citySlug, stats, suggestedCities = [], floatingMenu, floatingRestaurant }: Props) {
  const router = useRouter();
  const urlParams = useSearchParams();

  // ── Sync de l'input avec le paramètre ?q= de l'URL ───────────────────────
  const [query, setQuery] = useState(urlParams.get('q') ?? '');
  useEffect(() => {
    setQuery(urlParams.get('q') ?? '');
  }, [urlParams]);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileCardsVisible, setMobileCardsVisible] = useState(true);
  const [desktopRestaurantVisible, setDesktopRestaurantVisible] = useState(true);
  const [desktopMenuVisible, setDesktopMenuVisible] = useState(true);

  // Rotation des mots-clés dans le titre
  useEffect(() => {
    if (cityName) return;
    const id = setInterval(() => {
      setFadeOut(true);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % ROTATING_WORDS.length);
        setFadeOut(false);
      }, 380);
    }, 3200);
    return () => clearInterval(id);
  }, [cityName]);

  // Déclenchement des animations d'entrée au montage
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  /**
   * Génère les props d'animation pour un élément du hero.
   * Avant mount : opacity 0 (invisible mais sans décalage SSR visible).
   * Après mount : animation spring avec délai.
   */
  const sa = (cls: 'anim-spring-up' | 'anim-spring-down' | 'anim-spring-in' | 'anim-fade-rise', delay = 0) => ({
    className: mounted ? cls : '',
    style: mounted
      ? { animationDelay: `${delay}ms` }
      : { opacity: 0 as const },
  });

  // Base URL selon le contexte : ville connue → city page, sinon → /decouvrir (global)
  const searchBase = citySlug ? `/decouvrir/${citySlug}` : '/decouvrir';

  /** Fait défiler vers la section résultats après navigation */
  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      // Recherche avec terme : navigation + scroll vers résultats
      router.push(`${searchBase}?q=${encodeURIComponent(trimmed)}`, { scroll: false });
      scrollToResults();
    } else {
      // Input vide : supprimer ?q= et revenir à la liste complète
      router.push(searchBase, { scroll: false });
      scrollToResults();
    }
  };

  const goQuery = (q: string) => {
    router.push(q ? `${searchBase}?q=${encodeURIComponent(q)}` : searchBase, { scroll: false });
    if (q) scrollToResults();
  };

  const handleGeo = () => {
    setLocating(true);
    setLocationError(false);
    if (!navigator.geolocation) {
      setLocationError(true);
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const base = citySlug ? `/decouvrir/${citySlug}` : '/decouvrir';
        router.push(`${base}?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&sort=distance`);
        setLocating(false);
      },
      () => { setLocationError(true); setLocating(false); },
      { timeout: 8000 },
    );
  };

  const restaurantCount = stats?.restaurant_count
    ? `${stats.restaurant_count}+`
    : '500+';

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">

      {/* ── Fond image ──────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=85"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
          style={{ filter: 'brightness(0.55) saturate(0.9)' }}
        />
        {/* Couche sombre de base */}
        <div className="absolute inset-0 bg-[#0A0A08]/50" />
        {/* Dégradé vertical : bas très sombre pour la transition vers le contenu */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A08]/40 via-transparent to-[#1A1A18]" />
        {/* Vignette latérale gauche */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A08]/30 via-transparent to-transparent" />
        {/* Teinte terracotta très subtile */}
        <div className="absolute inset-0 bg-[#C8553D]/4" />
      </div>

      {/* ── Motif africain décoratif ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 3L57 30L30 57L3 30z' fill='none' stroke='%23C8553D' stroke-width='1.5'/%3E%3Cpath d='M30 14L46 30L30 46L14 30z' fill='%23C8553D' opacity='0.6'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Halos lumineux ambiants ──────────────────────────────────────────── */}
      <div
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[130px] z-0 pointer-events-none"
        style={{ background: 'rgba(200,85,61,0.12)', animation: 'pulse 6s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-[320px] h-[320px] rounded-full blur-[100px] z-0 pointer-events-none"
        style={{ background: 'rgba(212,168,67,0.08)', animation: 'pulse 8s ease-in-out infinite' }}
      />

      {/* ── Cartes flottantes décoratives (desktop uniquement) ───────────────── */}
      {desktopRestaurantVisible && (
        <div
          className={`hidden lg:block absolute top-28 right-8 xl:right-16 z-10 ${sa('anim-spring-in', 900).className}`}
          style={sa('anim-spring-in', 900).style}
        >
          <FloatingRestaurantCard
            {...(floatingRestaurant !== undefined ? { data: floatingRestaurant } : {})}
            onClose={() => setDesktopRestaurantVisible(false)}
          />
        </div>
      )}
      {desktopMenuVisible && (
        <div
          className={`hidden lg:block absolute bottom-36 right-12 xl:right-28 z-10 ${sa('anim-spring-in', 1050).className}`}
          style={sa('anim-spring-in', 1050).style}
        >
          <FloatingMenuCard
            {...(floatingMenu !== undefined ? { data: floatingMenu } : {})}
            onClose={() => setDesktopMenuVisible(false)}
          />

        </div>
      )}

      {/* ── Contenu principal ────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-5 sm:px-6 pt-28 pb-20 flex flex-col items-center gap-7 text-center">

        {/* Badge live */}
        <div
          className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 backdrop-blur-sm border border-white/12 ${sa('anim-spring-down', 0).className}`}
          style={sa('anim-spring-down', 0).style}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8553D] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8553D]" />
          </span>
          <span className="text-white text-xs sm:text-sm font-medium tracking-wide">
            {restaurantCount} restaurants · Afrique & Europe
          </span>
        </div>

        {/* Titre animé */}
        <h1
          className={`text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold text-white leading-[1.1] ${sa('anim-spring-up', 150).className}`}
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', textShadow: '0 2px 20px rgba(0,0,0,0.8)', ...sa('anim-spring-up', 150).style }}
        >
          {cityName ? (
            <>
              Les meilleurs restaurants
              <br />
              <span className="text-[#C8553D]">de {cityName}</span>
            </>
          ) : (
            <>
              Découvrez les restaurants
              {' '}
              <span
                className="text-[#C8553D] inline-block"
                style={{
                  opacity: fadeOut ? 0 : 1,
                  transform: fadeOut ? 'translateY(10px)' : 'translateY(0)',
                  transition: 'opacity 0.38s ease, transform 0.38s ease',
                }}
              >
                {ROTATING_WORDS[wordIdx]}
              </span>
              <br />
              <span
                className="font-medium"
                style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72em' }}
              >
                près de chez vous
              </span>
            </>
          )}
        </h1>

        {/* Sous-titre */}
        <p
          className={`text-white/75 text-base sm:text-lg max-w-xl leading-relaxed ${sa('anim-fade-rise', 300).className}`}
          style={{ textShadow: '0 1px 12px rgba(0,0,0,0.9)', ...sa('anim-fade-rise', 300).style }}
        >
          {cityName
            ? `Commandez en ligne, réservez une table et explorez les adresses incontournables de ${cityName}.`
            : 'Commandez en ligne, réservez une table ou explorez les meilleures adresses culinaires africaines.'}
        </p>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className={`w-full max-w-2xl ${sa('anim-spring-up', 430).className}`} style={sa('anim-spring-up', 430).style}>
          <div
            className="flex items-center bg-white rounded-2xl overflow-hidden p-1.5 gap-2"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
          >
            <div className="flex-1 flex items-center gap-2 px-3 min-w-0">
              <Search className="w-5 h-5 text-[#A8A29E] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={
                  cityName
                    ? `Restaurant, plat ou cuisine à ${cityName}…`
                    : 'Plat, restaurant, cuisine… (ex : thiéboudienne)'
                }
                className="flex-1 py-3.5 text-[#1C1917] placeholder:text-[#A8A29E] text-sm sm:text-base focus:outline-none bg-transparent min-w-0"
              />
              {/* Bouton ✕ pour vider l'input */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    const base = searchBase;
                    router.push(base, { scroll: false });
                  }}
                  className="shrink-0 p-1 rounded-full text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F4F2] transition-all"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="shrink-0 flex items-center gap-1.5 px-5 py-3.5 rounded-xl bg-[#C8553D] text-white font-bold text-sm hover:bg-[#B04432] active:scale-95 transition-all"
            >
              <span className="hidden sm:inline">Rechercher</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Indicateur de recherche active */}
          {urlParams.get('q') && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-white/70 text-xs">
                Résultats pour <span className="text-white font-semibold">&ldquo;{urlParams.get('q')}&rdquo;</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  const base = searchBase;
                  router.push(base, { scroll: false });
                  scrollToResults();
                }}
                className="text-[#E8826F] text-xs hover:text-white transition-colors underline underline-offset-2"
              >
                Effacer
              </button>
            </div>
          )}
        </form>

        {/* Géolocalisation */}
        <div
          className={`flex flex-col items-center gap-1.5 -mt-1 ${sa('anim-fade-rise', 560).className}`}
          style={sa('anim-fade-rise', 560).style}
        >
          <button
            onClick={handleGeo}
            disabled={locating}
            className="flex items-center gap-2 text-sm text-white/65 hover:text-white transition-colors disabled:opacity-30 group"
          >
            {locating
              ? <div className="w-4 h-4 border-2 border-[#C8553D] border-t-transparent rounded-full animate-spin" />
              : <Navigation className="w-4 h-4 text-[#C8553D]" />
            }
            <span>{locating ? 'Localisation en cours…' : 'Utiliser ma position actuelle'}</span>
          </button>
          {locationError && (
            <p className="text-xs text-red-400">Localisation indisponible — vérifiez vos permissions.</p>
          )}
        </div>

        {/* Tags rapides */}
        <div
          className={`flex flex-wrap justify-center gap-2 ${sa('anim-spring-up', 660).className}`}
          style={sa('anim-spring-up', 660).style}
        >
          <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#D4A843] font-bold uppercase tracking-widest self-center">
            <Sparkles className="w-3 h-3" />
            Tendances
          </span>
          {QUICK_TAGS.map(t => (
            <button
              key={t.label}
              onClick={() => goQuery(t.query)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs sm:text-sm hover:bg-white/25 hover:border-white/35 hover:text-white transition-all"
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Raccourcis villes */}
        {suggestedCities.length > 0 && !cityName && (
          <div
            className={`flex flex-wrap justify-center gap-2 mt-1 ${sa('anim-fade-rise', 780).className}`}
            style={sa('anim-fade-rise', 780).style}
          >
            <span className="text-white/60 text-xs sm:text-sm self-center">Explorer :</span>
            {suggestedCities.slice(0, 5).map(city => (
              <a
                key={city.slug}
                href={`/decouvrir/${city.slug}`}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white/85 text-xs sm:text-sm hover:bg-white/25 hover:text-white transition-all"
              >
                <span>{city.flag}</span>
                <span>{city.name}</span>
                <ChevronRight className="w-3 h-3 text-white/28 group-hover:text-white/55 group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        )}

        {/* ── Cartes flottantes — version mobile & tablette (dans le flux) ── */}
        {mobileCardsVisible && (
          <div
            className={`flex lg:hidden gap-3 justify-center flex-wrap w-full mt-2 relative ${sa('anim-spring-up', 850).className}`}
            style={sa('anim-spring-up', 850).style}
          >
            {/* Bouton de fermeture */}
            <button
              onClick={() => setMobileCardsVisible(false)}
              aria-label="Masquer les suggestions"
              className="absolute -top-2 -right-1 z-20 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white/70 hover:bg-white/35 hover:text-white transition-all"
            >
              <X className="w-3 h-3" />
            </button>

            <FloatingRestaurantCard
              {...(floatingRestaurant !== undefined ? { data: floatingRestaurant } : {})}
              noRotate
            />
            <FloatingMenuCard
              {...(floatingMenu !== undefined ? { data: floatingMenu } : {})}
              noRotate
            />
          </div>
        )}
      </div>

      {/* ── Indicateur de scroll ─────────────────────────────────────────────── */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none" style={{ opacity: 0.3 }}>
        <div className="w-px h-7 bg-gradient-to-b from-transparent to-white" />
        <svg
          className="w-4 h-4 text-white animate-bounce"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

// ── Sous-composants flottants ─────────────────────────────────────────────────

const FALLBACK_RESTAURANT: FloatingRestaurantData = {
  name: 'La Teranga',
  cuisineLabel: 'Sénégalaise 🇸🇳',
  imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120&q=80',
  rating: 4.8,
  deliveryTime: 25,
};

const FALLBACK_MENU: FloatingMenuData = {
  productName: 'Thiéboudienne royale',
  restaurantName: 'La Teranga',
  cityName: 'Dakar',
  restaurantSlug: 'la-teranga',
  price: 2500,
  currencySymbol: 'F',
};

function FloatingRestaurantCard({ data, noRotate, onClose }: { data?: FloatingRestaurantData; noRotate?: boolean; onClose?: () => void }) {
  const d = data ?? FALLBACK_RESTAURANT;
  return (
    <div className="relative">
      {/* Bouton fermeture */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Masquer cette carte"
          className="absolute -top-2 -left-2 z-20 w-5 h-5 rounded-full bg-[#1A1A18]/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/60 hover:bg-[#1A1A18] hover:text-white transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    <a
      href={d.slug ? `/${d.slug}/menu` : '#'}
      className="w-56 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-white/40 hover:scale-105 transition-transform duration-300 block"
      style={{
        boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2)',
        transform: noRotate ? 'none' : 'rotate(2deg)',
      }}
    >
      {/* Badge */}
      <div className="absolute -top-2.5 -right-2.5 px-2.5 py-0.5 rounded-full bg-[#C8553D] text-white text-[10px] font-bold shadow-lg">
        🔥 Populaire
      </div>

      <div className="flex items-center gap-3">
        {/* Photo restaurant */}
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#F5F4F2]">
          {d.imageUrl ? (
            <img
              src={d.imageUrl}
              alt={d.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
        </div>

        {/* Infos restaurant */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#1C1917] text-sm leading-tight truncate">{d.name}</div>
          {d.cuisineLabel && (
            <div className="text-[#57534E] text-xs mt-0.5 truncate">{d.cuisineLabel}</div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-0.5 text-xs font-semibold text-[#1C1917]">
              <Star className="w-3 h-3 text-[#D4A843] fill-[#D4A843]" />
              {(d.rating ?? 4.5).toFixed(1)}
            </span>
            <span className="text-[#E7E5E4]">·</span>
            <span className="flex items-center gap-0.5 text-xs text-[#57534E]">
              <Clock className="w-3 h-3" />
              {d.deliveryTime ?? 30} min
            </span>
          </div>
        </div>
      </div>
    </a>
    </div>
  );
}

function FloatingMenuCard({ data, noRotate, onClose }: { data?: FloatingMenuData; noRotate?: boolean; onClose?: () => void }) {
  const d = data ?? FALLBACK_MENU;
  return (
    <div className="relative">
      {/* Bouton fermeture */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Masquer cette carte"
          className="absolute -top-2 -left-2 z-20 w-5 h-5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/30 hover:text-white transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <div
        className="w-52 bg-[#1A1A18]/92 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:scale-105 transition-transform duration-300"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          transform: noRotate ? 'none' : 'rotate(-1.5deg)',
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          {d.imageUrl ? (
            <img
              src={d.imageUrl}
              alt=""
              className="w-6 h-6 rounded-md object-cover shrink-0"
            />
          ) : (
            <span className="text-base">🍽️</span>
          )}
          <span className="text-[#D4A843] text-[9px] font-bold uppercase tracking-widest">
            Menu du jour
          </span>
        </div>
        <div className="font-bold text-white text-sm leading-tight line-clamp-2">{d.productName}</div>
        <div className="text-white/45 text-xs mt-0.5 truncate">
          {d.restaurantName} · {d.cityName}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span
            className="text-[#C8553D] font-bold text-lg"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            {d.price.toLocaleString('fr-FR')} {d.currencySymbol}
          </span>
          <a
            href={`/${d.restaurantSlug}/menu`}
            className="px-3 py-1.5 rounded-lg bg-[#C8553D] text-white text-[10px] font-bold hover:bg-[#A33D28] transition-colors"
          >
            Commander
          </a>
        </div>
      </div>
    </div>
  );
}
