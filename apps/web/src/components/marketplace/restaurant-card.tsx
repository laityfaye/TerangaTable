import Link from 'next/link';
import { MapPin, Star, Clock, Bike, Users, Zap } from 'lucide-react';
import type { MarketplaceRestaurant } from '@/types/marketplace';
import { PRICE_RANGE_LABELS } from '@/types/marketplace';
import { formatDeliveryTime, formatDistance } from '@/lib/marketplace-api';

interface Props {
  restaurant: MarketplaceRestaurant;
  variant?: 'grid' | 'list' | 'featured';
}

const CUISINE_EMOJIS: Record<string, string> = {
  senegalaise: '🇸🇳',
  africaine: '🌍',
  'fast-food': '🍔',
  grillades: '🔥',
  'fruits-de-mer': '🦞',
  pizza: '🍕',
  libanaise: '🧆',
  francaise: '🥐',
  vegetarien: '🥗',
  asiatique: '🍜',
};

function getCuisineEmoji(types: string[]): string {
  for (const t of types) {
    const key = t.toLowerCase().replace(/\s+/g, '-');
    if (CUISINE_EMOJIS[key]) return CUISINE_EMOJIS[key];
  }
  return '🍽️';
}

export default function RestaurantCard({ restaurant: r, variant = 'grid' }: Props) {
  const priceLabel = PRICE_RANGE_LABELS[r.price_range] ?? PRICE_RANGE_LABELS[2]!;

  if (variant === 'featured') {
    return (
      <Link
        href={`/${r.slug}/menu`}
        className="group relative overflow-hidden rounded-2xl aspect-[4/3] flex flex-col justify-end bg-[#1A1A18] hover:scale-[1.02] transition-transform duration-300"
      >
        {/* Image de fond */}
        {r.hero_image_url ? (
          <img
            src={r.hero_image_url}
            alt={r.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#C8553D]/30 to-[#D4A843]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {r.is_sponsored && (
            <span className="px-2 py-0.5 rounded-full bg-[#D4A843] text-[#1A1A18] text-[10px] font-bold uppercase tracking-wide">
              Sponsorisé
            </span>
          )}
          {r.is_open_now ? (
            <span className="px-2 py-0.5 rounded-full bg-[#2D6A4F] text-white text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Ouvert
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-black/50 text-white/80 text-[10px] font-semibold">Fermé</span>
          )}
        </div>

        {/* Contenu bas */}
        <div className="relative z-10 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{r.name}</h3>
              <p className="text-white/60 text-xs mt-0.5">{r.cuisine_types.join(' · ') || 'Restaurant'}</p>
            </div>
            {r.logo_url && (
              <img src={r.logo_url} alt={r.name} className="w-10 h-10 rounded-lg object-cover border-2 border-white/20 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-[#D4A843] text-sm">
              <Star className="w-3.5 h-3.5 fill-current" />
              {r.rating.toFixed(1)}
            </span>
            {r.delivery_available && (
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <Bike className="w-3.5 h-3.5" />
                {formatDeliveryTime(r.estimated_delivery_time)}
              </span>
            )}
            {r.distance !== undefined && (
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin className="w-3 h-3" />
                {formatDistance(r.distance)}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'list') {
    return (
      <Link
        href={`/${r.slug}/menu`}
        className="group flex gap-4 p-4 bg-white rounded-xl border border-[#E7E5E4] hover:border-[#C8553D]/30 hover:shadow-md transition-all"
      >
        {/* Image */}
        <div className="w-28 h-24 rounded-lg overflow-hidden shrink-0 bg-[#F5F4F2] relative">
          {r.hero_image_url ? (
            <img src={r.hero_image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {getCuisineEmoji(r.cuisine_types)}
            </div>
          )}
          {r.is_sponsored && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-[#D4A843] text-[#1A1A18] text-[9px] font-bold">AD</div>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-[#1C1917] truncate" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{r.name}</h3>
              <p className="text-xs text-[#57534E] mt-0.5 truncate">{r.cuisine_types.join(' · ') || 'Restaurant'}</p>
            </div>
            {/* Statut ouvert */}
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.is_open_now ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#F5F4F2] text-[#A8A29E]'}`}>
              {r.is_open_now ? '● Ouvert' : '○ Fermé'}
            </span>
          </div>

          {r.address && (
            <p className="flex items-center gap-1 text-xs text-[#A8A29E] mt-1.5 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {r.address}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-sm text-[#D4A843]">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-semibold">{r.rating.toFixed(1)}</span>
              {r.review_count > 0 && <span className="text-[#A8A29E] text-xs">({r.review_count})</span>}
            </span>
            <span className="text-xs font-mono text-[#57534E]">{priceLabel.symbol}</span>
            {r.delivery_available && (
              <span className="flex items-center gap-1 text-xs text-[#57534E]">
                <Bike className="w-3.5 h-3.5" />
                {formatDeliveryTime(r.estimated_delivery_time)}
              </span>
            )}
            {r.distance !== undefined && (
              <span className="flex items-center gap-1 text-xs text-[#57534E]">
                <MapPin className="w-3 h-3" />
                {formatDistance(r.distance)}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ── Variante Grid (défaut) ──────────────────────────────────────────────────
  return (
    <Link
      href={`/${r.slug}/menu`}
      className="group flex flex-col bg-white rounded-xl border border-[#E7E5E4] hover:border-[#C8553D]/30 hover:shadow-lg overflow-hidden transition-all duration-200"
    >
      {/* Image header */}
      <div className="relative h-44 bg-[#F5F4F2] overflow-hidden">
        {r.hero_image_url ? (
          <img
            src={r.hero_image_url}
            alt={r.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `${r.primary_color}15` }}>
            <span className="text-5xl opacity-60">{getCuisineEmoji(r.cuisine_types)}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Badges superposés */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {r.is_sponsored && (
            <span className="px-2 py-0.5 rounded-full bg-[#D4A843] text-[#1A1A18] text-[10px] font-bold uppercase tracking-wide shadow">
              Sponsorisé
            </span>
          )}
          {r.delivery_available && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1 shadow">
              <Bike className="w-3 h-3" />
              Livraison
            </span>
          )}
        </div>

        {/* Statut ouvert */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold shadow backdrop-blur-sm flex items-center gap-1 ${
            r.is_open_now ? 'bg-[#2D6A4F] text-white' : 'bg-black/50 text-white/70'
          }`}>
            {r.is_open_now ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Ouvert</>
            ) : 'Fermé'}
          </span>
        </div>

        {/* Logo du restaurant */}
        {r.logo_url && (
          <div className="absolute bottom-3 right-3 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-white">
            <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Contenu de la carte */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Nom + cuisine */}
        <div>
          <h3 className="font-bold text-[#1C1917] leading-tight line-clamp-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {r.name}
          </h3>
          <p className="text-xs text-[#57534E] mt-0.5 flex items-center gap-1">
            <span>{getCuisineEmoji(r.cuisine_types)}</span>
            <span className="truncate">{r.cuisine_types.join(' · ') || 'Restaurant'}</span>
          </p>
        </div>

        {/* Adresse */}
        {r.address && (
          <p className="flex items-center gap-1 text-xs text-[#A8A29E] truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {r.address}
          </p>
        )}

        {/* Métriques */}
        <div className="flex items-center justify-between pt-1 border-t border-[#F5F4F2] mt-auto">
          <div className="flex items-center gap-3">
            {/* Note */}
            <span className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-[#D4A843] text-[#D4A843]" />
              <span className="font-bold text-[#1C1917]">{r.rating.toFixed(1)}</span>
              {r.review_count > 0 && <span className="text-[#A8A29E] text-xs">({r.review_count})</span>}
            </span>

            {/* Prix */}
            <span className="text-xs font-mono font-semibold" style={{ color: priceLabel.color }}>
              {priceLabel.symbol}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#57534E]">
            {r.distance !== undefined && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {formatDistance(r.distance)}
              </span>
            )}
            {r.delivery_available && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {formatDeliveryTime(r.estimated_delivery_time)}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {r.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {r.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-[#FAFAF8] border border-[#E7E5E4] text-[10px] text-[#57534E]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

export function RestaurantCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-xl border border-[#E7E5E4] overflow-hidden animate-pulse">
      <div className="h-44 bg-[#F5F4F2]" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-[#E7E5E4] rounded w-3/4" />
        <div className="h-3 bg-[#F5F4F2] rounded w-1/2" />
        <div className="h-3 bg-[#F5F4F2] rounded w-2/3" />
        <div className="flex items-center justify-between pt-2 border-t border-[#F5F4F2]">
          <div className="h-4 bg-[#E7E5E4] rounded w-16" />
          <div className="h-3 bg-[#F5F4F2] rounded w-20" />
        </div>
      </div>
    </div>
  );
}
