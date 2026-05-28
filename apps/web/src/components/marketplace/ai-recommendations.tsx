'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Flame, Clock, Sun, CloudRain, Star, TrendingUp, Moon } from 'lucide-react';
import type { MarketplaceRestaurant } from '@/types/marketplace';

interface Props {
  restaurants: MarketplaceRestaurant[];
  cityName: string;
}

function getTimeOfDay(): { label: string; icon: React.ReactNode; emoji: string; hour: number } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return { label: 'Le matin', icon: <Sun className="w-4 h-4" />, emoji: '☀️', hour };
  if (hour >= 11 && hour < 15) return { label: 'Le midi', icon: <Sun className="w-4 h-4" />, emoji: '🌤️', hour };
  if (hour >= 15 && hour < 19) return { label: 'L\'après-midi', icon: <Sun className="w-4 h-4" />, emoji: '🌅', hour };
  if (hour >= 19 && hour < 22) return { label: 'Le soir', icon: <Moon className="w-4 h-4" />, emoji: '🌙', hour };
  return { label: 'La nuit', icon: <Moon className="w-4 h-4" />, emoji: '🌃', hour };
}

function getMealSuggestion(hour: number): { meal: string; cuisines: string[]; reason: string } {
  if (hour >= 5 && hour < 11) return {
    meal: 'Petit-déjeuner',
    cuisines: ['café', 'boulangerie', 'fast-food'],
    reason: 'Commencez bien la journée',
  };
  if (hour >= 11 && hour < 15) return {
    meal: 'Déjeuner',
    cuisines: ['senegalaise', 'africaine', 'grillades'],
    reason: 'Le menu du midi vous attend',
  };
  if (hour >= 15 && hour < 19) return {
    meal: 'Goûter',
    cuisines: ['fast-food', 'pizza', 'végétarien'],
    reason: 'Une pause bien méritée',
  };
  if (hour >= 19) return {
    meal: 'Dîner',
    cuisines: ['grillades', 'fruits-de-mer', 'libanaise', 'française'],
    reason: 'Savourez votre soirée',
  };
  return { meal: 'Repas', cuisines: [], reason: 'Découvrez nos restaurants' };
}

interface AISuggestion {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  restaurants: MarketplaceRestaurant[];
}

export default function AIRecommendations({ restaurants, cityName }: Props) {
  const timeOfDay = getTimeOfDay();
  const mealSugg = getMealSuggestion(timeOfDay.hour);

  const suggestions = useMemo<AISuggestion[]>(() => {
    if (restaurants.length === 0) return [];

    const openNow = restaurants.filter((r) => r.is_open_now);
    const topRated = [...restaurants].sort((a, b) => b.rating - a.rating).slice(0, 4);
    const trending = [...restaurants].sort((a, b) => b.order_count - a.order_count).slice(0, 4);
    const withDelivery = restaurants.filter((r) => r.delivery_available).slice(0, 4);

    // Restaurants suggérés selon l'heure du jour
    const byMeal = restaurants.filter((r) =>
      r.cuisine_types.some((c) =>
        mealSugg.cuisines.some((mc) => c.toLowerCase().includes(mc)),
      ),
    ).slice(0, 4);

    const result: AISuggestion[] = [];

    if (byMeal.length > 0) {
      result.push({
        id: 'meal',
        title: `${mealSugg.meal} à ${cityName}`,
        subtitle: mealSugg.reason,
        icon: <span className="text-xl">{timeOfDay.emoji}</span>,
        color: '#D4A843',
        restaurants: byMeal,
      });
    }

    if (topRated.length > 0) {
      result.push({
        id: 'top-rated',
        title: 'Les mieux notés',
        subtitle: `Restaurants préférés de ${cityName}`,
        icon: <Star className="w-5 h-5 fill-current" />,
        color: '#C8553D',
        restaurants: topRated,
      });
    }

    if (trending.length > 0) {
      result.push({
        id: 'trending',
        title: 'Tendances du moment',
        subtitle: 'Les plus commandés cette semaine',
        icon: <TrendingUp className="w-5 h-5" />,
        color: '#2D6A4F',
        restaurants: trending,
      });
    }

    if (withDelivery.length > 0 && openNow.length > 0) {
      const deliveryOpen = withDelivery.filter((r) => r.is_open_now);
      if (deliveryOpen.length > 0) {
        result.push({
          id: 'delivery',
          title: 'Livraison rapide',
          subtitle: 'Ouvert maintenant · Livré en moins de 45 min',
          icon: <Flame className="w-5 h-5" />,
          color: '#3B82F6',
          restaurants: deliveryOpen.slice(0, 4),
        });
      }
    }

    return result.slice(0, 3);
  }, [restaurants, cityName, mealSugg, timeOfDay.emoji]);

  if (suggestions.length === 0) return null;

  return (
    <section className="py-8">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#C8553D] flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-[#1C1917] text-lg" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Recommandations pour vous
          </h2>
          <p className="text-xs text-[#57534E] flex items-center gap-1">
            {timeOfDay.icon}
            Personnalisées selon l&apos;heure et vos préférences
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A843]/10 border border-[#D4A843]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843] animate-pulse" />
          <span className="text-xs font-semibold text-[#D4A843]">IA</span>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex flex-col gap-6">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id}>
            {/* Titre de la catégorie */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${suggestion.color}15`, color: suggestion.color }}
              >
                {suggestion.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#1C1917]">{suggestion.title}</h3>
                <p className="text-xs text-[#57534E]">{suggestion.subtitle}</p>
              </div>
            </div>

            {/* Cartes horizontales scrollables */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {suggestion.restaurants.map((r) => (
                <Link
                  key={r.id}
                  href={`/${r.slug}/menu`}
                  className="shrink-0 w-48 bg-white rounded-xl border border-[#E7E5E4] hover:border-[#C8553D]/30 hover:shadow-md overflow-hidden transition-all group"
                >
                  <div className="h-28 relative bg-[#F5F4F2]">
                    {r.hero_image_url ? (
                      <img
                        src={r.hero_image_url}
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: `${suggestion.color}10` }}>
                        <span className="text-3xl">🍽️</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${r.is_open_now ? 'bg-[#2D6A4F] text-white' : 'bg-black/50 text-white/70'}`}>
                        {r.is_open_now ? '● Ouvert' : '○ Fermé'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="font-semibold text-xs text-[#1C1917] truncate">{r.name}</p>
                    <p className="text-[10px] text-[#57534E] truncate mt-0.5">{r.cuisine_types[0] ?? 'Restaurant'}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-[#D4A843]">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[#1C1917] font-semibold">{r.rating.toFixed(1)}</span>
                      </span>
                      {r.delivery_available && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#57534E]">
                          <Clock className="w-3 h-3" />
                          {r.estimated_delivery_time} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
