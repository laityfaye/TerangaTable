'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal, X, ChevronDown, Bike, Calendar,
  Clock, MapPin, LocateFixed, Loader2,
} from 'lucide-react';
import { CUISINE_TYPES, SORT_OPTIONS } from '@/types/marketplace';

interface Props {
  citySlug: string;
  totalCount?: number;
}

const BUDGET_OPTIONS = [
  { value: '1', label: 'Budget',  symbol: '₣',   color: '#2D6A4F' },
  { value: '2', label: 'Moyen',   symbol: '₣₣',  color: '#D4A843' },
  { value: '3', label: 'Premium', symbol: '₣₣₣', color: '#C8553D' },
];

const DISTANCE_OPTIONS = [
  { value: '0.1', label: '100 m' },
  { value: '0.2', label: '200 m' },
  { value: '0.5', label: '500 m' },
  { value: '1',   label: '1 km'  },
  { value: '2',   label: '2 km'  },
  { value: '5',   label: '5 km'  },
];

export default function FilterBar({ citySlug: _citySlug, totalCount }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [showFilters,      setShowFilters]      = useState(false);
  const [showMoreCuisines, setShowMoreCuisines] = useState(false);
  const [locating,         setLocating]         = useState(false);

  const currentCuisine     = searchParams.get('cuisine')      ?? '';
  const currentBudget      = searchParams.get('budget')       ?? '';
  const currentSort        = searchParams.get('sort')         ?? 'popular';
  const currentMaxDistance = searchParams.get('max_distance') ?? '';
  const isOpenNow          = searchParams.get('open_now')     === 'true';
  const hasDelivery        = searchParams.get('delivery')     === 'true';
  const hasReservations    = searchParams.get('reservations') === 'true';
  const hasLocation        = !!(searchParams.get('lat') && searchParams.get('lng'));

  const activeFiltersCount = [
    currentCuisine, currentBudget, isOpenNow,
    hasDelivery, hasReservations, currentMaxDistance,
  ].filter(Boolean).length;

  const activeDistanceLabel = DISTANCE_OPTIONS.find(d => d.value === currentMaxDistance)?.label;

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleParam(key: string, value: string) {
    updateParam(key, searchParams.get(key) === value ? null : value);
  }

  function clearAll() {
    router.push(pathname, { scroll: false });
  }

  function requestLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('lat', String(pos.coords.latitude));
        params.set('lng', String(pos.coords.longitude));
        params.set('sort', 'distance');
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  type CuisineOption = (typeof CUISINE_TYPES)[number];
  const visibleCuisines: readonly CuisineOption[] =
    showMoreCuisines ? CUISINE_TYPES : CUISINE_TYPES.slice(0, 5);

  /* ─────────────────────────────────────────────────────────────────────────
     Contenu du panneau — rendu sur desktop (inline) ET mobile (bottom sheet)
  ───────────────────────────────────────────────────────────────────────── */
  const panelContent = (
    <div className="p-4">
      {/* En-tête visible sur mobile uniquement */}
      <div className="flex items-center justify-between mb-4 sm:hidden">
        <h3 className="font-bold text-[#1C1917] text-base">Filtres avancés</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="w-8 h-8 rounded-full bg-[#F5F4F2] flex items-center justify-center text-[#57534E]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grille : 1 col mobile, 3 col sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* Budget */}
        <div>
          <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-2">Budget</h4>
          <div className="flex gap-2">
            {BUDGET_OPTIONS.map((b) => (
              <button
                key={b.value}
                onClick={() => toggleParam('budget', b.value)}
                className={`flex-1 py-2.5 sm:py-2 px-3 rounded-lg border text-sm font-mono transition-all ${
                  currentBudget === b.value ? 'font-semibold' : 'border-[#E7E5E4] text-[#57534E]'
                }`}
                style={{
                  color: b.color,
                  borderColor: currentBudget === b.value ? b.color : undefined,
                  backgroundColor: currentBudget === b.value ? `${b.color}15` : undefined,
                }}
              >
                {b.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Tri */}
        <div>
          <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-2">Trier par</h4>
          <div className="flex flex-col gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam('sort', opt.value)}
                className={`flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg text-sm text-left transition-all ${
                  currentSort === opt.value
                    ? 'bg-[#C8553D]/10 text-[#C8553D] font-semibold'
                    : 'text-[#57534E] hover:bg-[#FAFAF8]'
                }`}
              >
                {currentSort === opt.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8553D] shrink-0" />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-2">Services</h4>
          <div className="flex flex-col gap-3 sm:gap-2">
            {[
              { key: 'open_now',     label: 'Ouvert maintenant',    icon: <Clock    className="w-4 h-4" />, value: isOpenNow,       color: '#2D6A4F' },
              { key: 'delivery',     label: 'Livraison disponible', icon: <Bike     className="w-4 h-4" />, value: hasDelivery,     color: '#3B82F6' },
              { key: 'reservations', label: 'Réservation en ligne', icon: <Calendar className="w-4 h-4" />, value: hasReservations, color: '#D4A843' },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center gap-3 cursor-pointer group select-none">
                <div
                  onClick={() => updateParam(opt.key, opt.value ? null : 'true')}
                  className={`w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    opt.value ? 'border-current bg-current' : 'border-[#E7E5E4] group-hover:border-current/50'
                  }`}
                  style={{ color: opt.color }}
                >
                  {opt.value && (
                    <svg className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="flex items-center gap-2 text-sm text-[#57534E]"
                  style={{ color: opt.value ? opt.color : undefined }}>
                  {opt.icon}{opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Rayon — toujours visible, propose l'activation si pas de position */}
      <div className="mt-5 sm:mt-4 pt-4 border-t border-[#F5F4F2]">
        <h4 className="text-xs font-bold text-[#1C1917] uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#C8553D]" />
          Rayon autour de moi
        </h4>
        {!hasLocation ? (
          <button
            onClick={() => { requestLocation(); setShowFilters(false); }}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#C8553D]/40 text-[#C8553D] text-sm font-medium hover:bg-[#C8553D]/5 transition-all disabled:opacity-60"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            Activer ma position pour filtrer par distance
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {DISTANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleParam('max_distance', opt.value)}
                className={`px-4 py-2 sm:px-3 sm:py-1.5 rounded-full border text-sm transition-all ${
                  currentMaxDistance === opt.value
                    ? 'bg-[#C8553D] border-[#C8553D] text-white font-semibold'
                    : 'bg-white border-[#E7E5E4] text-[#57534E] hover:border-[#C8553D]/40'
                }`}
              >
                &lt;{opt.label}
              </button>
            ))}
            {currentMaxDistance && (
              <button
                onClick={() => updateParam('max_distance', null)}
                className="px-3 py-2 sm:py-1.5 rounded-full border border-red-200 bg-red-50 text-red-500 text-sm flex items-center gap-1 hover:bg-red-100 transition-all"
              >
                <X className="w-3 h-3" /> Tout afficher
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-5 sm:mt-4 pt-4 border-t border-[#F5F4F2]">
        {totalCount !== undefined && (
          <p className="text-sm text-[#57534E]">
            <span className="font-semibold text-[#1C1917]">{totalCount}</span>{' '}
            résultat{totalCount !== 1 ? 's' : ''}
          </p>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={clearAll}
            className="text-sm text-[#57534E] hover:text-[#C8553D] px-3 py-1.5 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={() => setShowFilters(false)}
            className="px-5 py-2.5 sm:py-2 rounded-full bg-[#C8553D] text-white text-sm font-semibold hover:bg-[#A33D28] transition-colors"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <>
      {/* ── Barre sticky ────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-4 py-3">

          {/* Ligne scrollable */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">

            {/* Bouton Filtres */}
            <button
              onClick={() => setShowFilters(v => !v)}
              aria-expanded={showFilters}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium shrink-0 transition-all ${
                activeFiltersCount > 0
                  ? 'bg-[#C8553D] border-[#C8553D] text-white'
                  : 'bg-white border-[#E7E5E4] text-[#1C1917] hover:border-[#C8553D]/40'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-[#C8553D] text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="w-px h-6 bg-[#E7E5E4] shrink-0" />

            {/* Ouvert maintenant */}
            <button
              onClick={() => updateParam('open_now', isOpenNow ? null : 'true')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm shrink-0 transition-all ${
                isOpenNow
                  ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white font-semibold'
                  : 'bg-white border-[#E7E5E4] text-[#57534E] hover:border-[#2D6A4F]/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="sm:hidden">Ouvert</span>
              <span className="hidden sm:inline">Ouvert maintenant</span>
            </button>

            {/* Livraison */}
            <button
              onClick={() => updateParam('delivery', hasDelivery ? null : 'true')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm shrink-0 transition-all ${
                hasDelivery
                  ? 'bg-[#3B82F6] border-[#3B82F6] text-white font-semibold'
                  : 'bg-white border-[#E7E5E4] text-[#57534E] hover:border-[#3B82F6]/40'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Livraison</span>
            </button>

            {/* Réservation */}
            <button
              onClick={() => updateParam('reservations', hasReservations ? null : 'true')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm shrink-0 transition-all ${
                hasReservations
                  ? 'bg-[#D4A843] border-[#D4A843] text-white font-semibold'
                  : 'bg-white border-[#E7E5E4] text-[#57534E] hover:border-[#D4A843]/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="sm:hidden">Rés.</span>
              <span className="hidden sm:inline">Réservation</span>
            </button>

            <div className="w-px h-6 bg-[#E7E5E4] shrink-0" />

            {/* ── Rayon : 1 bouton compact, pas 6 chips dans la barre ── */}
            {!hasLocation ? (
              <button
                onClick={requestLocation}
                disabled={locating}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-dashed border-[#C8553D]/50 bg-white text-[#C8553D] text-sm shrink-0 hover:bg-[#C8553D]/5 transition-all disabled:opacity-60"
              >
                {locating
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <LocateFixed className="w-3.5 h-3.5" />}
                <span>Près de moi</span>
              </button>
            ) : currentMaxDistance ? (
              <button
                onClick={() => updateParam('max_distance', null)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#C8553D] bg-[#C8553D] text-white text-sm shrink-0"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>&lt;{activeDistanceLabel}</span>
                <X className="w-3 h-3 opacity-75" />
              </button>
            ) : (
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E7E5E4] bg-white text-[#57534E] text-sm shrink-0 hover:border-[#C8553D]/40 hover:text-[#C8553D] transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Rayon</span>
              </button>
            )}

            <div className="w-px h-6 bg-[#E7E5E4] shrink-0" />

            {/* Cuisine — emoji seul sur mobile, emoji + label sur sm+ */}
            {visibleCuisines.map((cuisine) => (
              <button
                key={cuisine.value}
                onClick={() => toggleParam('cuisine', cuisine.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm shrink-0 transition-all ${
                  currentCuisine === cuisine.value
                    ? 'bg-[#1A1A18] border-[#1A1A18] text-white font-semibold'
                    : 'bg-white border-[#E7E5E4] text-[#57534E] hover:border-[#1A1A18]/30'
                }`}
              >
                <span>{cuisine.emoji}</span>
                <span className="hidden sm:inline">{cuisine.label}</span>
              </button>
            ))}

            {!showMoreCuisines && CUISINE_TYPES.length > 5 && (
              <button
                onClick={() => setShowMoreCuisines(true)}
                className="flex items-center gap-1 px-3.5 py-2 rounded-full border border-[#E7E5E4] bg-white text-[#57534E] text-sm shrink-0 hover:border-[#C8553D]/40"
              >
                +{CUISINE_TYPES.length - 5}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}

            {activeFiltersCount > 0 && (
              <>
                <div className="w-px h-6 bg-[#E7E5E4] shrink-0" />
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-red-200 bg-red-50 text-red-600 text-sm shrink-0 hover:bg-red-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Effacer</span>
                </button>
              </>
            )}
          </div>

          {/* Résumé des filtres actifs */}
          {(currentCuisine || currentBudget || currentMaxDistance) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-[#A8A29E]">Actifs :</span>
              {currentCuisine && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A1A18] text-white text-xs">
                  {CUISINE_TYPES.find(c => c.value === currentCuisine)?.emoji}
                  <span className="hidden sm:inline ml-0.5">
                    {CUISINE_TYPES.find(c => c.value === currentCuisine)?.label}
                  </span>
                  <button onClick={() => updateParam('cuisine', null)} className="ml-1 text-white/60 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {currentBudget && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A1A18] text-white text-xs font-mono">
                  {BUDGET_OPTIONS.find(b => b.value === currentBudget)?.symbol}
                  <button onClick={() => updateParam('budget', null)} className="ml-1 text-white/60 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {currentMaxDistance && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C8553D] text-white text-xs">
                  <MapPin className="w-3 h-3" />
                  &lt;{activeDistanceLabel}
                  <button onClick={() => updateParam('max_distance', null)} className="ml-1 text-white/60 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Panneau avancé — DESKTOP (inline dans la barre sticky, elle s'étend) */}
        {showFilters && (
          <div className="hidden sm:block border-t border-[#E7E5E4] bg-white">
            <div className="max-w-7xl mx-auto">
              {panelContent}
            </div>
          </div>
        )}
      </div>

      {/* Panneau avancé — MOBILE (bottom sheet avec overlay) */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 sm:hidden"
            onClick={() => setShowFilters(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-2xl sm:hidden"
            style={{ maxHeight: '82vh', overflowY: 'auto' }}
          >
            {/* Poignée de drag */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E7E5E4]" />
            </div>
            {panelContent}
          </div>
        </>
      )}
    </>
  );
}
