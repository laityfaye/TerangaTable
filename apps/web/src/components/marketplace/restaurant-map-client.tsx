'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import L from 'leaflet';
import { MapPin, Star, Navigation, X, Bike, Loader2, LocateFixed } from 'lucide-react';
import Link from 'next/link';
import type { MarketplaceRestaurant } from '@/types/marketplace';

interface Props {
  restaurants: MarketplaceRestaurant[];
  citySlug: string;
  userLat?: number;
  userLng?: number;
  maxDistanceKm?: number;
}

const CITY_CENTERS: Record<string, [number, number]> = {
  dakar:         [14.6928, -17.4467],
  thies:         [14.7924, -16.9261],
  'saint-louis': [16.0179, -16.5017],
  abidjan:       [5.3600,  -4.0083],
  casablanca:    [33.5731, -7.5898],
  paris:         [48.8566,  2.3522],
};

function createRestaurantIcon(r: MarketplaceRestaurant): L.DivIcon {
  const bg = r.is_sponsored ? '#D4A843' : r.is_open_now ? '#C8553D' : '#A8A29E';
  const inner = r.logo_url
    ? `<img src="${r.logo_url}" width="22" height="22" style="border-radius:50%;object-fit:cover;" onerror="this.style.display='none'" />`
    : `<span style="font-size:15px;line-height:1">🍽</span>`;

  return L.divIcon({
    html: `<div style="
      width:38px;height:38px;
      background:${bg};
      border:3px solid #fff;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,.25);
      cursor:pointer;
    ">${inner}</div>`,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:22px;height:22px;
      background:#3B82F6;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 0 0 8px rgba(59,130,246,.2),0 2px 8px rgba(59,130,246,.5);
    "></div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function RestaurantMapClient({ restaurants, citySlug, userLat, userLng, maxDistanceKm }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);

  const [selected, setSelected] = useState<MarketplaceRestaurant | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const defaultCenter: [number, number] = CITY_CENTERS[citySlug] ?? [14.6928, -17.4467];
  const hasUserPos = userLat !== undefined && userLng !== undefined;
  const restaurantsWithCoords = restaurants.filter((r) => r.lat != null && r.lng != null);

  // ── Initialiser la carte une seule fois ───────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = hasUserPos
      ? [userLat!, userLng!]
      : defaultCenter;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);

    // Fermer le popup en cliquant sur le fond de carte
    map.on('click', () => setSelected(null));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      userLayerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mettre à jour les marqueurs restaurants ───────────────────────────────
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    restaurantsWithCoords.forEach((r) => {
      const marker = L.marker([r.lat!, r.lng!], { icon: createRestaurantIcon(r) });
      marker.on('click', (e) => {
        L.DomEvent.stop(e); // empêche le click de remonter au fond de carte
        setSelected(r);
      });
      markersLayerRef.current!.addLayer(marker);
    });
  }, [restaurants]);

  // ── Mettre à jour la position utilisateur + cercle de rayon ──────────────
  useEffect(() => {
    if (!userLayerRef.current) return;
    userLayerRef.current.clearLayers();

    if (hasUserPos) {
      L.marker([userLat!, userLng!], { icon: createUserIcon(), zIndexOffset: 1000 })
        .addTo(userLayerRef.current);

      if (maxDistanceKm !== undefined) {
        L.circle([userLat!, userLng!], {
          radius: maxDistanceKm * 1000,
          color: '#C8553D',
          fillColor: '#C8553D',
          fillOpacity: 0.07,
          weight: 2,
          dashArray: '6,4',
        }).addTo(userLayerRef.current);
      }
    }
  }, [userLat, userLng, maxDistanceKm, hasUserPos]);

  // ── Centrer la carte sur l'utilisateur quand sa position devient disponible
  useEffect(() => {
    if (!mapRef.current || !hasUserPos) return;
    mapRef.current.setView([userLat!, userLng!], 15, { animate: true });
  }, [userLat, userLng, hasUserPos]);

  // ── Géolocalisation depuis la carte ──────────────────────────────────────
  function handleLocate() {
    if (!navigator.geolocation) { setGeoError(true); return; }
    setLocating(true);
    setGeoError(false);

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
      () => {
        setGeoError(true);
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }

  function getDirectionsUrl(r: MarketplaceRestaurant): string {
    const dest = `${r.lat},${r.lng}`;
    if (hasUserPos) {
      return `https://www.google.com/maps/dir/${userLat},${userLng}/${dest}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#E7E5E4] shadow-sm" style={{ height: 460 }}>

      {/* En-tête flottant */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none">
        {/* Compteur */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm pointer-events-none">
          <MapPin className="w-4 h-4 text-[#C8553D]" />
          <span className="text-xs font-semibold text-[#1C1917]">
            {restaurantsWithCoords.length} restaurant{restaurantsWithCoords.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Bouton Ma position */}
        <button
          onClick={handleLocate}
          disabled={locating || hasUserPos}
          className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm backdrop-blur-sm transition-all ${
            hasUserPos
              ? 'bg-[#3B82F6] text-white cursor-default'
              : geoError
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-white/95 text-[#57534E] hover:text-[#C8553D] hover:bg-white'
          }`}
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5" />
          )}
          {hasUserPos ? 'Localisé' : geoError ? 'Erreur GPS' : 'Ma position'}
        </button>
      </div>

      {/* Conteneur carte Leaflet */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Légende */}
      <div className="absolute bottom-10 left-3 z-[1000] flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <span className="flex items-center gap-1.5 text-[10px] text-[#57534E]">
          <span className="w-3 h-3 rounded-full bg-[#C8553D] inline-block" />
          Ouvert
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#57534E]">
          <span className="w-3 h-3 rounded-full bg-[#D4A843] inline-block" />
          Sponsorisé
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#57534E]">
          <span className="w-3 h-3 rounded-full bg-[#A8A29E] inline-block" />
          Fermé
        </span>
        {hasUserPos && (
          <span className="flex items-center gap-1.5 text-[10px] text-[#57534E]">
            <span className="w-3 h-3 rounded-full bg-[#3B82F6] inline-block" />
            Ma position
          </span>
        )}
      </div>

      {/* Popup restaurant sélectionné */}
      {selected && (
        <div
          className="absolute bottom-14 left-3 w-72 z-[2000] bg-white rounded-xl shadow-2xl border border-[#E7E5E4] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#F5F4F2] flex items-center justify-center text-[#57534E] hover:bg-[#E7E5E4] z-10"
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
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  selected.is_open_now ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]' : 'bg-[#F5F4F2] text-[#A8A29E]'
                }`}
              >
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
                <span className="flex items-center gap-1 font-medium text-[#1C1917]">
                  <MapPin className="w-3 h-3 text-[#C8553D]" />
                  {selected.distance < 1
                    ? `${Math.round(selected.distance * 1000)} m`
                    : `${selected.distance.toFixed(1)} km`}
                </span>
              )}
            </div>

            {selected.address && (
              <p className="text-[10px] text-[#A8A29E] mt-1.5 truncate">{selected.address}</p>
            )}

            <div className="flex gap-2 mt-3">
              <Link
                href={`/${selected.slug}/menu`}
                className="flex-1 py-2 rounded-lg bg-[#C8553D] text-white text-xs font-semibold text-center hover:bg-[#A33D28] transition-colors"
              >
                Voir le menu
              </Link>
              {/* Bouton itinéraire — visible si le restaurant a des coordonnées GPS */}
              {selected.lat !== null && selected.lng !== null && (
                <a
                  href={getDirectionsUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E7E5E4] text-[#57534E] text-xs font-medium hover:border-[#C8553D]/40 hover:text-[#C8553D] transition-colors whitespace-nowrap"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Itinéraire
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aucune coordonnée disponible */}
      {restaurantsWithCoords.length === 0 && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
          <MapPin className="w-10 h-10 text-[#E7E5E4] mb-2" />
          <p className="text-sm text-[#57534E]">Coordonnées GPS non disponibles</p>
          <p className="text-xs text-[#A8A29E] mt-1">Les restaurants apparaîtront ici une fois géolocalisés</p>
        </div>
      )}
    </div>
  );
}
