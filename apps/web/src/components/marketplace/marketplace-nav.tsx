'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown, X, Menu, Utensils } from 'lucide-react';
import { fetchMarketplaceSearch } from '@/lib/marketplace-api';
import type { MarketplaceSearchResult } from '@/types/marketplace';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  currentCity?: string;
  currentCitySlug?: string;
  cities?: Array<{ name: string; slug: string; country_code: string }>;
}

const COUNTRY_FLAGS: Record<string, string> = {
  SN: '🇸🇳', CI: '🇨🇮', MA: '🇲🇦', FR: '🇫🇷',
};

// ── Composant ─────────────────────────────────────────────────────────────────

export default function MarketplaceNav({ currentCity, currentCitySlug, cities = [] }: Props) {
  const router = useRouter();

  // État scroll — la nav commence transparente sur le hero
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MarketplaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Détection du scroll pour la transparence
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initialisation
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Recherche auto-complete
  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await fetchMarketplaceSearch(q, currentCitySlug);
      setResults(data);
      setShowResults(true);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }, [currentCitySlug]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim()) {
      debounceRef.current = setTimeout(() => handleSearch(query), 300);
    } else {
      setResults([]);
      setShowResults(false);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, handleSearch]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCities(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectRestaurant = (slug: string) => {
    router.push(`/${slug}/menu`);
    setQuery('');
    setShowResults(false);
  };

  // Soumission via Entrée ou clic bouton → navigue vers la page de recherche
  const submitSearch = () => {
    if (!query.trim()) return;
    const base = currentCitySlug
      ? `/decouvrir/${currentCitySlug}`
      : '/decouvrir';           // sans ville → recherche globale
    router.push(`${base}?q=${encodeURIComponent(query.trim())}`);
    setShowResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch();
    if (e.key === 'Escape') { setShowResults(false); setQuery(''); }
  };

  // ── Classes dynamiques selon le scroll ──────────────────────────────────────

  const navBg = scrolled
    ? 'bg-white/97 backdrop-blur-md border-b border-[#E7E5E4] shadow-sm'
    : 'bg-transparent border-b border-transparent';

  const logoTextColor = scrolled ? 'text-[#1A1A18]' : 'text-white';
  // Fond sombre explicite quand la nav est transparente → le texte blanc reste lisible
  const searchBg = scrolled
    ? 'bg-[#FAFAF8] border-[#E7E5E4]'
    : 'bg-[#1C1917]/55 border-white/20 backdrop-blur-sm';
  const searchPlaceholderColor = scrolled ? 'placeholder:text-[#A8A29E]' : 'placeholder:text-white/40';
  // On force aussi caret-color en blanc pour que le curseur soit visible
  const searchTextColor = scrolled ? 'text-[#1C1917] caret-[#1C1917]' : 'text-white caret-white';
  const cityButtonColor = scrolled ? 'text-[#1C1917] bg-[#FAFAF8] border-[#E7E5E4]' : 'text-white bg-white/10 border-white/15';
  const cityChevronColor = scrolled ? 'text-[#57534E]' : 'text-white/60';
  const navLinkColor = scrolled ? 'text-[#57534E] hover:text-[#1C1917]' : 'text-white/70 hover:text-white';
  const menuButtonColor = scrolled ? 'text-[#57534E] hover:bg-[#FAFAF8]' : 'text-white/70 hover:bg-white/10';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#C8553D] flex items-center justify-center shadow-sm">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <span
            className={`font-bold text-lg hidden sm:block transition-colors duration-300 ${logoTextColor}`}
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            TérangaTable
          </span>
        </Link>

        {/* ── Sélecteur de ville ── */}
        <div className="relative shrink-0" ref={cityRef}>
          <button
            onClick={() => setShowCities(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-300 ${cityButtonColor}`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#C8553D]" />
            <span className="max-w-[80px] sm:max-w-[120px] truncate">
              {currentCity ?? 'Toutes les villes'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${cityChevronColor} ${showCities ? 'rotate-180' : ''}`} />
          </button>

          {showCities && cities.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-[#E7E5E4] shadow-xl overflow-hidden z-50">
              <div className="p-1">
                <Link
                  href="/decouvrir"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#FAFAF8] text-sm text-[#1C1917] transition-colors"
                  onClick={() => setShowCities(false)}
                >
                  <span>🌍</span>
                  <span>Toutes les villes</span>
                </Link>
                {cities.map(city => (
                  <Link
                    key={city.slug}
                    href={`/decouvrir/${city.slug}`}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#FAFAF8] text-sm transition-colors ${
                      city.slug === currentCitySlug
                        ? 'bg-[#C8553D]/8 text-[#C8553D] font-semibold'
                        : 'text-[#1C1917]'
                    }`}
                    onClick={() => setShowCities(false)}
                  >
                    <span>{COUNTRY_FLAGS[city.country_code] ?? '🌍'}</span>
                    <span>{city.name}</span>
                    {city.slug === currentCitySlug && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C8553D]" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Barre de recherche ── */}
        <div className="flex-1 relative" ref={searchRef}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${scrolled ? 'text-[#57534E]' : 'text-white/70'}`} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setShowResults(true)}
              onKeyDown={handleKeyDown}
              placeholder={`Rechercher${currentCity ? ` à ${currentCity}` : ' un restaurant'}…`}
              className={`w-full pl-9 pr-20 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#C8553D]/30 focus:border-[#C8553D] text-sm transition-all duration-300 ${searchBg} ${searchTextColor} ${searchPlaceholderColor}`}
            />
            {/* Bouton Rechercher (toujours visible) + ✕ si query */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button
                  onClick={() => { setQuery(''); setShowResults(false); }}
                  className={`p-1 rounded transition-colors ${scrolled ? 'text-[#A8A29E] hover:text-[#57534E]' : 'text-white/50 hover:text-white/80'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={submitSearch}
                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                  query.trim()
                    ? 'bg-[#C8553D] text-white hover:bg-[#A33D28]'
                    : scrolled
                      ? 'bg-[#E7E5E4] text-[#A8A29E] cursor-default'
                      : 'bg-white/15 text-white/40 cursor-default'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Résultats autocomplete */}
          {showResults && query.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E7E5E4] shadow-xl overflow-hidden z-50">
              {searching ? (
                <div className="flex items-center justify-center py-5 gap-2 text-sm text-[#57534E]">
                  <div className="w-4 h-4 border-2 border-[#C8553D] border-t-transparent rounded-full animate-spin" />
                  Recherche…
                </div>
              ) : results.length === 0 ? (
                /* Aucun résultat API — proposer la navigation vers la page de recherche */
                <div className="p-3">
                  <button
                    onClick={submitSearch}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FAFAF8] text-left transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#C8553D]/10 flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4 text-[#C8553D]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#1C1917]">
                        Rechercher &ldquo;{query}&rdquo;
                      </div>
                      <div className="text-xs text-[#A8A29E]">
                        {currentCity ? `Voir les résultats à ${currentCity}` : 'Voir tous les résultats'}
                      </div>
                    </div>
                    <Search className="w-4 h-4 text-[#C8553D] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ) : (
                <ul className="py-1 max-h-64 overflow-y-auto">
                  {results.map(r => (
                    <li key={r.slug}>
                      <button
                        onClick={() => selectRestaurant(r.slug)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF8] text-left transition-colors"
                      >
                        {r.logo_url ? (
                          <img src={r.logo_url} alt={r.name} className="w-9 h-9 rounded-lg object-cover bg-[#F5F4F2]" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#C8553D]/10 flex items-center justify-center">
                            <Utensils className="w-4 h-4 text-[#C8553D]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-[#1C1917] truncate">{r.name}</div>
                          <div className="text-xs text-[#57534E] truncate flex items-center gap-1">
                            {/* Affiche ce qui a déclenché le match */}
                            {r.matched_via === 'product' && r.matched_product ? (
                              <span className="text-[#C8553D] font-medium">🍽️ {r.matched_product} ·</span>
                            ) : r.matched_via === 'cuisine' ? (
                              <span className="text-[#D4A843] font-medium">👨‍🍳 {r.cuisine_type} ·</span>
                            ) : r.cuisine_type ? (
                              <span className="mr-0.5">{r.cuisine_type} ·</span>
                            ) : null}
                            <span>{r.city}</span>
                          </div>
                        </div>
                        <MapPin className="w-3.5 h-3.5 text-[#A8A29E] shrink-0" />
                      </button>
                    </li>
                  ))}
                  {/* Lien "Voir tous les résultats" en bas de la liste */}
                  <li className="border-t border-[#F5F4F2]">
                    <button
                      onClick={submitSearch}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-[#C8553D] font-semibold hover:bg-[#C8553D]/5 transition-colors"
                    >
                      Voir tous les résultats pour &ldquo;{query}&rdquo;
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Actions desktop ── */}
        <nav className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className={`text-sm px-3 py-2 transition-colors duration-300 ${navLinkColor}`}
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-4 py-2 rounded-full bg-[#C8553D] text-white hover:bg-[#A33D28] transition-colors shadow-sm"
          >
            Votre restaurant
          </Link>
        </nav>

        {/* ── Menu mobile ── */}
        <button
          onClick={() => setMobileMenu(v => !v)}
          className={`md:hidden p-2 rounded-lg transition-colors duration-300 ${menuButtonColor}`}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Menu mobile overlay ── */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-t border-[#E7E5E4] px-4 py-4 flex flex-col gap-2 shadow-lg">
          <Link
            href="/login"
            className="text-sm text-[#57534E] py-2.5 hover:text-[#1C1917] transition-colors"
            onClick={() => setMobileMenu(false)}
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold py-2.5 text-[#C8553D] hover:text-[#A33D28] transition-colors"
            onClick={() => setMobileMenu(false)}
          >
            Référencer votre restaurant →
          </Link>
        </div>
      )}
    </header>
  );
}
