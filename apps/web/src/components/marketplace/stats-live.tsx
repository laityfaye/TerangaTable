'use client';

import { useEffect, useState } from 'react';
import type { MarketplaceStats } from '@/types/marketplace';
import AnimateIn from '@/components/ui/animate-in';

// ── Compteur animé ────────────────────────────────────────────────────────────

function AnimatedCounter({
  target,
  duration = 1600,
  suffix = '',
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const steps = 40;
    const stepValue = target / steps;
    const stepDuration = duration / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(stepValue * step), target));
      if (step >= steps) clearInterval(id);
    }, stepDuration);
    return () => clearInterval(id);
  }, [target, duration]);

  return (
    <span>
      {current.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  stats: MarketplaceStats;
  cityName?: string;
  /** Mode compact pour usage en sidebar ou dans une section secondaire */
  compact?: boolean;
}

// ── Données ───────────────────────────────────────────────────────────────────

function getItems(stats: MarketplaceStats, cityName?: string) {
  return [
    {
      value: stats.restaurant_count,
      suffix: '+',
      label: 'Restaurants',
      sub: cityName ? `à ${cityName}` : 'sur la plateforme',
      emoji: '🍽️',
      color: '#C8553D',
    },
    {
      value: stats.cuisine_count,
      suffix: '',
      label: 'Types de cuisine',
      sub: 'référencés',
      emoji: '🌍',
      color: '#D4A843',
    },
    {
      value: stats.avg_delivery_time,
      suffix: ' min',
      label: 'Livraison moyenne',
      sub: 'estimée',
      emoji: '⚡',
      color: '#2D6A4F',
    },
    {
      value: stats.region_count,
      suffix: '',
      label: 'Villes',
      sub: 'en Afrique & Europe',
      emoji: '📍',
      color: '#6366F1',
    },
  ] as const;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function StatsLive({ stats, cityName, compact = false }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const items = getItems(stats, cityName);

  // ── Mode compact (sidebar / secondaire) ──────────────────────────────────────
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-[#E7E5E4] p-3 text-center hover:border-current/30 hover:shadow-sm transition-all"
          >
            <div
              className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-base"
              style={{ backgroundColor: `${item.color}15` }}
            >
              {item.emoji}
            </div>
            <div
              className="text-xl font-bold tabular-nums"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: item.color }}
            >
              {mounted
                ? <AnimatedCounter target={item.value} suffix={item.suffix} />
                : `${item.value}${item.suffix}`}
            </div>
            <div className="text-xs font-semibold text-[#1C1917] mt-0.5">{item.label}</div>
            <div className="text-[10px] text-[#A8A29E]">{item.sub}</div>
          </div>
        ))}
      </div>
    );
  }

  // ── Mode plein largeur (page principale) ────────────────────────────────────
  return (
    <section className="relative bg-[#1A1A18] py-3 sm:py-4 overflow-hidden">
      {/* Texture de fond */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #C8553D 0px, #C8553D 1px,
            transparent 1px, transparent 14px
          )`,
        }}
      />
      {/* Halos */}
      <div className="absolute -top-20 left-1/4 w-80 h-80 bg-[#C8553D]/8 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-10 right-1/3 w-60 h-60 bg-[#D4A843]/6 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
        {/* Séparateur décoratif */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#C8553D]/40" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#C8553D]">
            La plateforme en chiffres
          </span>
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#C8553D]/40" />
        </div>

        {/* Grille de stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/8">
          {items.map((item, i) => (
            <AnimateIn key={i} type="up" delay={i * 90} threshold={0.15} className="h-full">
            <div
              className="group relative h-full bg-[#1A1A18] hover:bg-[#222220] py-3 px-2 flex flex-col items-center text-center transition-colors duration-200"
            >
              {/* Barre colorée en haut */}
              <div
                className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: item.color }}
              />

              {/* Emoji */}
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-sm mb-1.5"
                style={{ backgroundColor: `${item.color}18` }}
              >
                {item.emoji}
              </div>

              {/* Nombre */}
              <div
                className="text-lg sm:text-xl font-bold text-white mb-0.5 tabular-nums"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: item.color }}
              >
                {mounted
                  ? <AnimatedCounter target={item.value} suffix={item.suffix} />
                  : `${item.value}${item.suffix}`}
              </div>

              {/* Label */}
              <div className="text-xs sm:text-sm font-semibold text-white/80">
                {item.label}
              </div>

              {/* Sous-label */}
              <div className="text-[10px] text-white/35 mt-0.5">
                {item.sub}
              </div>
            </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
