'use client';

import { useState, useCallback } from 'react';
import { MapPin, X, Star, Bike, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { MarketplaceRestaurant } from '@/types/marketplace';

interface Props {
  restaurants: MarketplaceRestaurant[];
  citySlug: string;
  userLat?: number;
  userLng?: number;
}

// Coordonnées par défaut par ville
const CITY_VIEWPORTS: Record<string, { lat: number; lng: number; zoom: number }> = {
  dakar:         { lat: 14.6928, lng: -17.4467, zoom: 13 },
  thies:         { lat: 14.7924, lng: -16.9261, zoom: 13 },
  'saint-louis': { lat: 16.0179, lng: -16.5017, zoom: 13 },
  abidjan:       { lat: 5.3600,  lng: -4.0083,  zoom: 12 },
  casablanca:    { lat: 33.5731, lng: -7.5898,  zoom: 12 },
  paris:         { lat: 48.8566, lng:  2.3522,  zoom: 12 },
};

/**
 * Projette des coordonnées géographiques vers des coordonnées pixel
 * dans une vue SVG simplifiée (projection Mercator approximative)
 */
function geoToPixel(
  lat: number, lng: number,
  centerLat: number, centerLng: number,
  zoom: number, width: number, height: number,
): { x: number; y: number } {
  const scale = Math.pow(2, zoom) * 128;
  const cx = (centerLng + 180) / 360 * scale;
  const cy = (1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * scale;
  const px = (lng + 180) / 360 * scale;
  const py = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale;
  return {
    x: (px - cx) + width / 2,
    y: (py - cy) + height / 2,
  };
}

export default function RestaurantMap({ restaurants, citySlug, userLat, userLng }: Props) {
  const [selected, setSelected] = useState<MarketplaceRestaurant | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const DEFAULT_VIEWPORT = { lat: 14.6928, lng: -17.4467, zoom: 13 };
  const _vp = CITY_VIEWPORTS[citySlug];
  const viewport = _vp !== undefined ? _vp : DEFAULT_VIEWPORT;
  const W = 600;
  const H = 400;

  const restaurantsWithCoords = restaurants.filter(
    (r) => r.lat !== null && r.lng !== null,
  );

  const getPixel = useCallback(
    (lat: number, lng: number) => geoToPixel(lat, lng, viewport.lat, viewport.lng, viewport.zoom, W, H),
    [viewport],
  );

  const userPos = userLat !== undefined && userLng !== undefined
    ? getPixel(userLat, userLng)
    : null;

  // Ouvrir dans OpenStreetMap
  const openInMaps = () => {
    const url = `https://www.openstreetmap.org/#map=${viewport.zoom}/${viewport.lat}/${Math.abs(viewport.lng)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative bg-[#E8E0D5] rounded-xl overflow-hidden border border-[#E7E5E4] shadow-sm">

      {/* En-tête de la carte */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
          <MapPin className="w-4 h-4 text-[#C8553D]" />
          <span className="text-xs font-semibold text-[#1C1917]">
            {restaurantsWithCoords.length} restaurant{restaurantsWithCoords.length !== 1 ? 's' : ''} sur la carte
          </span>
        </div>
        <button
          onClick={openInMaps}
          className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm text-xs text-[#57534E] hover:text-[#C8553D] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Agrandir
        </button>
      </div>

      {/* SVG Carte stylisée */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 400 }}
        onClick={() => setSelected(null)}
      >
        {/* Fond de carte */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D4C9BD" strokeWidth="0.5" />
          </pattern>
          {/* Gradient de fond */}
          <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EDE8E0" />
            <stop offset="100%" stopColor="#DDD6CC" />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#mapBg)" />
        <rect width={W} height={H} fill="url(#grid)" />

        {/* Routes simulées (lignes organiques) */}
        <g stroke="#C9C0B4" strokeWidth="2" fill="none" opacity="0.6">
          <path d={`M 0 ${H/2} Q ${W*0.3} ${H*0.4} ${W*0.6} ${H/2} T ${W} ${H*0.45}`} />
          <path d={`M ${W*0.2} 0 Q ${W*0.3} ${H*0.3} ${W*0.35} ${H}`} />
          <path d={`M 0 ${H*0.3} Q ${W*0.5} ${H*0.2} ${W} ${H*0.35}`} />
          <path d={`M ${W*0.7} 0 Q ${W*0.65} ${H*0.5} ${W*0.75} ${H}`} />
        </g>
        {/* Routes principales */}
        <g stroke="#B8AFA3" strokeWidth="3.5" fill="none" opacity="0.5">
          <path d={`M 0 ${H*0.55} Q ${W*0.5} ${H*0.5} ${W} ${H*0.55}`} />
          <path d={`M ${W*0.4} 0 Q ${W*0.45} ${H*0.5} ${W*0.5} ${H}`} />
        </g>

        {/* Blocs de bâtiments simulés */}
        {[
          { x: 60, y: 60, w: 40, h: 30 }, { x: 120, y: 50, w: 55, h: 25 },
          { x: 200, y: 80, w: 35, h: 35 }, { x: 300, y: 40, w: 50, h: 30 },
          { x: 400, y: 70, w: 40, h: 40 }, { x: 480, y: 50, w: 60, h: 25 },
          { x: 80, y: 250, w: 45, h: 35 }, { x: 160, y: 270, w: 40, h: 30 },
          { x: 350, y: 260, w: 55, h: 35 }, { x: 440, y: 280, w: 40, h: 25 },
          { x: 520, y: 260, w: 50, h: 40 }, { x: 250, y: 150, w: 35, h: 30 },
        ].map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill="#D4C9BD" opacity="0.5" />
        ))}

        {/* Zone verte (parc/espace) */}
        <ellipse cx={W * 0.15} cy={H * 0.7} rx="50" ry="35" fill="#C8D9BC" opacity="0.4" />
        <ellipse cx={W * 0.8} cy={H * 0.15} rx="40" ry="30" fill="#C8D9BC" opacity="0.4" />

        {/* Eau (si ville côtière) */}
        {['dakar', 'saint-louis', 'abidjan'].includes(citySlug) && (
          <rect x={W * 0.85} y={0} width={W * 0.15} height={H} fill="#B8D4E8" opacity="0.5" rx="0" />
        )}

        {/* Marqueurs restaurants */}
        {restaurantsWithCoords.map((r) => {
          const pos = getPixel(r.lat!, r.lng!);
          if (pos.x < -20 || pos.x > W + 20 || pos.y < -20 || pos.y > H + 20) return null;
          const isHovered = hoveredId === r.id;
          const isSelected = selected?.id === r.id;
          const scale = isHovered || isSelected ? 1.3 : 1;

          return (
            <g
              key={r.id}
              transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
              style={{ cursor: 'pointer', transformOrigin: `${pos.x}px ${pos.y}px`, transition: 'transform 0.15s ease' }}
              onClick={(e) => { e.stopPropagation(); setSelected(r); }}
              onMouseEnter={() => setHoveredId(r.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Ombre */}
              <circle cx="0" cy="3" r="10" fill="black" opacity="0.15" />
              {/* Pin principal */}
              <circle
                cx="0" cy="0" r="12"
                fill={r.is_sponsored ? '#D4A843' : r.is_open_now ? '#C8553D' : '#A8A29E'}
                stroke="white"
                strokeWidth="2"
              />
              {/* Logo ou emoji */}
              {r.logo_url ? (
                <image href={r.logo_url} x="-8" y="-8" width="16" height="16" clipPath="circle(8px)" />
              ) : (
                <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white">🍽</text>
              )}
            </g>
          );
        })}

        {/* Position utilisateur */}
        {userPos && (
          <g transform={`translate(${userPos.x}, ${userPos.y})`}>
            <circle cx="0" cy="0" r="20" fill="#3B82F6" opacity="0.15" />
            <circle cx="0" cy="0" r="10" fill="#3B82F6" opacity="0.3" />
            <circle cx="0" cy="0" r="6" fill="#3B82F6" stroke="white" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="8" fill="white">📍</text>
          </g>
        )}
      </svg>

      {/* Légende */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#C8553D]" />
          <span className="text-[10px] text-[#57534E]">Ouvert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#D4A843]" />
          <span className="text-[10px] text-[#57534E]">Sponsorisé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#A8A29E]" />
          <span className="text-[10px] text-[#57534E]">Fermé</span>
        </div>
        {userPos && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
            <span className="text-[10px] text-[#57534E]">Ma position</span>
          </div>
        )}
      </div>

      {/* Popup restaurant sélectionné */}
      {selected && (
        <div className="absolute bottom-16 left-3 w-72 bg-white rounded-xl shadow-2xl border border-[#E7E5E4] overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#F5F4F2] flex items-center justify-center text-[#57534E] hover:bg-[#E7E5E4]"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {selected.hero_image_url && (
            <img src={selected.hero_image_url} alt={selected.name} className="w-full h-24 object-cover" />
          )}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2 pr-6">
              <div>
                <h4 className="font-bold text-sm text-[#1C1917]">{selected.name}</h4>
                <p className="text-xs text-[#57534E]">{selected.cuisine_types.join(' · ')}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${selected.is_open_now ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#F5F4F2] text-[#A8A29E]'}`}>
                {selected.is_open_now ? '● Ouvert' : '○ Fermé'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-[#57534E]">
              <span className="flex items-center gap-1 text-[#D4A843]">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-semibold text-[#1C1917]">{selected.rating.toFixed(1)}</span>
              </span>
              {selected.delivery_available && (
                <span className="flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5" />
                  {selected.estimated_delivery_time} min
                </span>
              )}
              {selected.distance !== undefined && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selected.distance.toFixed(1)} km
                </span>
              )}
            </div>

            <Link
              href={`/${selected.slug}/menu`}
              className="mt-3 block w-full py-2 rounded-lg bg-[#C8553D] text-white text-xs font-semibold text-center hover:bg-[#A33D28] transition-colors"
            >
              Voir le menu
            </Link>
          </div>
        </div>
      )}

      {/* Message si aucune coordonnée */}
      {restaurantsWithCoords.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <MapPin className="w-10 h-10 text-[#E7E5E4] mb-2" />
          <p className="text-sm text-[#57534E]">Coordonnées GPS non disponibles</p>
          <p className="text-xs text-[#A8A29E] mt-1">Les restaurants apparaîtront ici une fois géolocalisés</p>
        </div>
      )}
    </div>
  );
}
