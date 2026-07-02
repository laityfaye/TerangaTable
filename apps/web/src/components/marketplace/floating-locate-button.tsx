'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LocateFixed, Loader2, CheckCircle, X } from 'lucide-react';

interface Props {
  /** Slug de la ville courante — si fourni, met à jour les params de filtre */
  citySlug?: string;
  /** Liste des villes avec coords — si fourni (sans citySlug), redirige vers la ville la plus proche */
  cities?: Array<{ slug: string; lat: number; lng: number }>;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function FloatingLocateButton({ citySlug, cities }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleLocate() {
    if (status === 'locating' || status === 'success') return;
    if (!navigator.geolocation) {
      setErrorMsg('Non supporté par ce navigateur');
      setStatus('error');
      return;
    }

    setStatus('locating');
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        if (citySlug) {
          const params = new URLSearchParams(searchParams.toString());
          params.set('lat', String(lat));
          params.set('lng', String(lng));
          params.set('sort', 'distance');
          params.delete('page');
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        } else if (cities && cities.length > 0) {
          const nearest = cities.reduce<{ slug: string; dist: number }>(
            (best, c) => {
              const d = haversineKm(lat, lng, c.lat, c.lng);
              return d < best.dist ? { slug: c.slug, dist: d } : best;
            },
            { slug: cities[0].slug, dist: Infinity },
          );
          router.push(`/decouvrir/${nearest.slug}?lat=${lat}&lng=${lng}&sort=distance`);
        }

        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      },
      (err) => {
        const msg =
          err.code === 1
            ? 'Autorisez la localisation dans votre navigateur'
            : err.code === 2
            ? 'Position indisponible — vérifiez votre GPS'
            : 'Délai dépassé — réessayez';
        setErrorMsg(msg);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 30000 },
    );
  }

  return (
    <div className="fixed bottom-6 right-5 z-[3000] flex flex-col items-end gap-2 pointer-events-none">
      {/* Bulle d'erreur */}
      {status === 'error' && errorMsg && (
        <div className="pointer-events-auto flex items-start gap-2 bg-white border border-red-200 rounded-2xl px-3 py-2.5 shadow-xl max-w-[210px]">
          <p className="text-[11px] text-red-600 leading-snug flex-1">{errorMsg}</p>
          <button
            onClick={() => setStatus('idle')}
            className="shrink-0 text-red-400 hover:text-red-600 mt-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Label contextuel au survol */}
      {status === 'idle' && (
        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-white bg-[#1C1917]/80 rounded-lg px-2.5 py-1 shadow-md select-none">
          Ma position
        </span>
      )}

      {/* Bouton principal */}
      <button
        onClick={handleLocate}
        disabled={status === 'locating'}
        aria-label="Activer ma position GPS"
        title="Restaurants près de moi"
        className={`pointer-events-auto group relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          status === 'success'
            ? 'bg-[#2D6A4F] text-white scale-90'
            : status === 'error'
            ? 'bg-red-500 text-white'
            : status === 'locating'
            ? 'bg-[#3B82F6] text-white animate-pulse'
            : 'bg-[#C8553D] text-white hover:bg-[#A33D28] hover:scale-110 active:scale-95'
        }`}
      >
        {/* Halo pulsé pendant la localisation */}
        {status === 'locating' && (
          <span className="absolute inset-0 rounded-full bg-[#3B82F6]/40 animate-ping" />
        )}

        {status === 'locating' ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle className="w-6 h-6" />
        ) : (
          <LocateFixed className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
