import Link from 'next/link';
import { Star, ArrowRight, Zap } from 'lucide-react';
import type { MarketplaceRestaurant } from '@/types/marketplace';

interface Props {
  restaurants: MarketplaceRestaurant[];
}

export default function SponsoredBanner({ restaurants }: Props) {
  const sponsored = restaurants.filter((r) => r.is_sponsored || r.is_featured).slice(0, 3);
  if (sponsored.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#D4A843] fill-current" />
          <h2 className="font-bold text-[#1C1917] text-sm" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Restaurants partenaires mis en avant
          </h2>
        </div>
        <span className="text-xs text-[#A8A29E] px-2 py-0.5 rounded-full bg-[#F5F4F2]">Sponsorisé</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sponsored.map((r) => (
          <Link
            key={r.id}
            href={`/${r.slug}/menu`}
            className="group relative overflow-hidden rounded-xl border-2 border-[#D4A843]/30 hover:border-[#D4A843] transition-all bg-gradient-to-br from-[#D4A843]/5 to-[#C8553D]/5"
          >
            <div className="flex items-center gap-3 p-3">
              {/* Logo */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white border border-[#E7E5E4] shadow-sm">
                {r.logo_url ? (
                  <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover" />
                ) : r.hero_image_url ? (
                  <img src={r.hero_image_url} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-[#FAFAF8]">🍽️</div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-[#D4A843] bg-[#D4A843]/15 px-1.5 py-0.5 rounded-full">Partenaire</span>
                </div>
                <h3 className="font-bold text-sm text-[#1C1917] truncate">{r.name}</h3>
                <p className="text-xs text-[#57534E] truncate">{r.cuisine_types.join(' · ')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-0.5 text-xs text-[#D4A843]">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[#1C1917] font-semibold">{r.rating.toFixed(1)}</span>
                  </span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.is_open_now ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#F5F4F2] text-[#A8A29E]'}`}>
                    {r.is_open_now ? '● Ouvert' : '○ Fermé'}
                  </span>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-[#D4A843] shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
