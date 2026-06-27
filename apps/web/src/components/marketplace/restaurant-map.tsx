'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import type { MarketplaceRestaurant } from '@/types/marketplace';

export interface RestaurantMapProps {
  restaurants: MarketplaceRestaurant[];
  citySlug: string;
  userLat?: number;
  userLng?: number;
  maxDistanceKm?: number;
}

const RestaurantMapClient = dynamic(
  () => import('./restaurant-map-client'),
  {
    ssr: false,
    loading: () => (
      <div
        className="relative bg-[#F0EBE5] rounded-xl overflow-hidden border border-[#E7E5E4] shadow-sm flex items-center justify-center"
        style={{ height: 460 }}
      >
        <div className="flex flex-col items-center gap-2">
          <MapPin className="w-8 h-8 text-[#C8553D] animate-pulse" />
          <span className="text-sm text-[#57534E]">Chargement de la carte…</span>
        </div>
      </div>
    ),
  },
);

export default function RestaurantMap(props: RestaurantMapProps) {
  return <RestaurantMapClient {...props} />;
}
