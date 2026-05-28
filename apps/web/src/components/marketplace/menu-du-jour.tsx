import Image from 'next/image';
import Link from 'next/link';
import { Flame, Clock, Star, ChevronRight } from 'lucide-react';
import type { RestaurantMenuDuJour } from '@/types/marketplace';

interface Props {
  menus: RestaurantMenuDuJour[];
}

/** Emoji fallback par catégorie de plat */
function categoryEmoji(category: string | null): string {
  if (!category) return '🍽️';
  const c = category.toLowerCase();
  if (c.includes('poisson') || c.includes('mer')) return '🐟';
  if (c.includes('poulet') || c.includes('volaille')) return '🍗';
  if (c.includes('viande') || c.includes('bœuf') || c.includes('boeuf')) return '🥩';
  if (c.includes('riz')) return '🍚';
  if (c.includes('dessert') || c.includes('pâtisserie')) return '🍰';
  if (c.includes('boisson') || c.includes('jus')) return '🥤';
  if (c.includes('salade')) return '🥗';
  if (c.includes('grillad')) return '🔥';
  if (c.includes('pizza')) return '🍕';
  if (c.includes('soupe') || c.includes('bouillon')) return '🍲';
  return '🍽️';
}

export default function MenuDuJour({ menus }: Props) {
  if (menus.length === 0) return null;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Aplatir : un élément = un produit (avec son restaurant)
  const items = menus.flatMap((menu) =>
    menu.items.map((item) => ({ ...item, menu }))
  );

  return (
    <section className="py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C8553D] flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2
              className="font-bold text-[#1C1917] text-lg"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Menus du jour
            </h2>
            <p className="text-xs text-[#57534E] capitalize">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
          {menus.length} ouvert{menus.length > 1 ? 's' : ''} maintenant
        </div>
      </div>

      {/* Grille produits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.slice(0, 6).map((item) => {
          const currencySymbol = item.menu.currency_symbol;
          return (
            <Link
              key={item.id}
              href={`/${item.menu.restaurant_slug}/menu`}
              className="group flex gap-3 p-3 bg-white rounded-xl border border-[#E7E5E4] hover:border-[#C8553D]/30 hover:shadow-md transition-all"
            >
              {/* Image ou emoji fallback */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#C8553D]/10 to-[#D4A843]/10 flex items-center justify-center shrink-0 overflow-hidden">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-3xl">{categoryEmoji(item.category)}</span>
                )}
              </div>

              {/* Infos produit */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#1C1917] leading-tight line-clamp-1">
                    {item.name}
                  </h3>
                  {item.is_featured && (
                    <span className="shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C8553D] text-white">
                      <Star className="w-2.5 h-2.5" />
                      Vedette
                    </span>
                  )}
                  {!item.is_featured && item.category && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#D4A843]/15 text-[#D4A843]">
                      {item.category}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-[#57534E] line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#C8553D]">
                      {item.price.toLocaleString('fr-FR')} {currencySymbol}
                    </span>
                    <span className="text-xs text-[#57534E] font-medium truncate max-w-[90px]">
                      @ {item.menu.restaurant_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#A8A29E]">
                    <Clock className="w-3 h-3" />
                    {item.menu.estimated_delivery_time} min
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      {items.length > 6 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-[#C8553D] font-semibold hover:text-[#A33D28] cursor-pointer transition-colors">
            Voir tous les menus du jour
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </section>
  );
}
