'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CUISINE_TYPES } from '@/types/marketplace';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  citySlug?: string;
  activeCategory?: string;
}

// ── Toutes les catégories (avec "Tout" en tête) ───────────────────────────────

const ALL = [
  { value: '' as const, emoji: '🍽️', label: 'Tout voir' },
  ...CUISINE_TYPES,
];

// ── Composant ─────────────────────────────────────────────────────────────────

export default function CuisineCategories({ citySlug, activeCategory }: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  // Mise à jour des flèches selon la position de scroll
  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    // Vérification initiale après rendu
    const raf = requestAnimationFrame(updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });

  const handleSelect = (value: string) => {
    const base = citySlug ? `/decouvrir/${citySlug}` : '/decouvrir';
    router.push(value ? `${base}?cuisine=${value}` : base);
  };

  return (
    <div className="bg-white border-b border-[#E7E5E4] sticky top-16 z-40 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">

        {/* ── Flèche gauche ── */}
        {canLeft && (
          <>
            {/* Dégradé */}
            <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('left')}
              aria-label="Défiler à gauche"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-[#E7E5E4] flex items-center justify-center hover:bg-[#FAFAF8] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#57534E]" />
            </button>
          </>
        )}

        {/* ── Liste scrollable ── */}
        <div
          ref={scrollRef}
          className="flex gap-2 py-3.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ALL.map(cat => {
            const isActive = cat.value === '' ? !activeCategory : cat.value === activeCategory;
            return (
              <button
                key={cat.value || 'all'}
                onClick={() => handleSelect(cat.value)}
                className={[
                  'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 select-none',
                  isActive
                    ? 'bg-[#1C1917] text-white shadow-sm'
                    : 'bg-[#F5F4F2] text-[#57534E] hover:bg-[#ECEAE8] hover:text-[#1C1917]',
                ].join(' ')}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Flèche droite ── */}
        {canRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('right')}
              aria-label="Défiler à droite"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white shadow-md border border-[#E7E5E4] flex items-center justify-center hover:bg-[#FAFAF8] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[#57534E]" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
