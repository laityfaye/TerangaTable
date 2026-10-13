'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Truck, MapPin, CheckCircle2, XCircle, Loader2, Phone, User } from 'lucide-react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';

interface DeliveryOffer {
  state: 'open' | 'accepted' | 'taken' | 'cancelled';
  restaurant_name: string;
  order_number: string;
  total: string;
  address: string | null;
  notes: string | null;
  items: { name: string; quantity: number }[];
  customer: { name: string; phone: string | null } | null;
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? fallback;
}

function DeliveryOfferContent() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const token = useSearchParams().get('token') ?? '';

  const [offer, setOffer] = useState<DeliveryOffer | null>(null);
  const [loadError, setLoadError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(
      `${API_URL}/public/delivery-offers/${deliveryId}?token=${encodeURIComponent(token)}`,
    );
    if (!res.ok) throw new Error(await readError(res, 'Impossible de charger la livraison'));
    const body = (await res.json()) as { data: DeliveryOffer };
    setOffer(body.data);
  }, [deliveryId, token]);

  useEffect(() => {
    if (!token) return;
    load().catch((err: Error) => setLoadError(err.message));
  }, [token, load]);

  async function handleAccept() {
    setAccepting(true);
    setAcceptError('');
    try {
      const res = await fetch(`${API_URL}/public/delivery-offers/${deliveryId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        setAcceptError(await readError(res, 'Impossible d\'accepter la livraison'));
        // Un autre livreur a pu la prendre entre-temps : on rafraîchit l'état
        await load().catch(() => undefined);
        return;
      }
      const body = (await res.json()) as { data: DeliveryOffer };
      setOffer(body.data);
    } finally {
      setAccepting(false);
    }
  }

  if (!token || loadError) {
    return (
      <Shell>
        <p className="text-slate-500 text-sm text-center">
          {loadError || 'Lien invalide — utilisez le lien reçu par email.'}
        </p>
      </Shell>
    );
  }

  if (!offer) {
    return (
      <Shell>
        <Loader2 size={24} className="animate-spin text-slate-400 mx-auto" />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-100">
            <Truck size={22} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{offer.restaurant_name}</p>
            <h1 className="font-heading text-xl font-bold text-[#1C1917]">
              Livraison {offer.order_number}
            </h1>
          </div>
        </div>

        {offer.address && (
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <span>{offer.address}</span>
          </div>
        )}

        {offer.items.length > 0 && (
          <ul className="text-sm text-slate-600 space-y-1 border-t border-[#E7E5E4] pt-4">
            {offer.items.map((item, i) => (
              <li key={i}>
                {item.quantity} × {item.name}
              </li>
            ))}
          </ul>
        )}

        {offer.notes && <p className="text-xs text-slate-500 italic">{offer.notes}</p>}

        {offer.state === 'open' && (
          <>
            {acceptError && <p className="text-xs text-red-500 text-center">{acceptError}</p>}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full h-12 rounded-md bg-terracotta text-white font-semibold text-sm hover:bg-terracotta-dark active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Validation…
                </>
              ) : (
                'Accepter cette livraison'
              )}
            </button>
            <p className="text-xs text-slate-400 text-center">
              La livraison revient au premier livreur qui l&apos;accepte.
            </p>
          </>
        )}

        {offer.state === 'accepted' && (
          <div className="rounded-xl bg-green-50 p-4 space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle2 size={18} />
              Livraison attribuée — elle est pour vous.
            </p>
            {offer.customer && (
              <div className="text-sm text-slate-700 space-y-1">
                <p className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  {offer.customer.name}
                </p>
                {offer.customer.phone && (
                  <a href={`tel:${offer.customer.phone}`} className="flex items-center gap-2 text-terracotta">
                    <Phone size={14} />
                    {offer.customer.phone}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {(offer.state === 'taken' || offer.state === 'cancelled') && (
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <XCircle size={18} className="text-slate-400" />
              {offer.state === 'taken'
                ? 'Cette livraison a déjà été acceptée par un autre livreur.'
                : 'Cette commande a été annulée.'}
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF8]">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export default function DeliveryOfferPage() {
  return (
    <Suspense>
      <DeliveryOfferContent />
    </Suspense>
  );
}
