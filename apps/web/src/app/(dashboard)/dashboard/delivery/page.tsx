'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Phone,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react';
import {
  useDeliveryKpis,
  useActiveDeliveries,
  useUpdateDeliveryStatus,
  type DeliveryRecord,
} from '@/hooks/delivery/use-delivery';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-100' },
  assigned: { label: 'Assignée', color: 'text-blue-700', bg: 'bg-blue-100' },
  picked_up: { label: 'Récupérée', color: 'text-purple-700', bg: 'bg-purple-100' },
  en_route: { label: 'En route', color: 'text-orange-700', bg: 'bg-orange-100' },
  delivered: { label: 'Livrée', color: 'text-green-700', bg: 'bg-green-100' },
  failed: { label: 'Échec', color: 'text-red-700', bg: 'bg-red-100' },
};

const STATUS_NEXT: Record<string, string | null> = {
  pending: 'assigned',
  assigned: 'picked_up',
  picked_up: 'en_route',
  en_route: 'delivered',
  delivered: null,
  failed: null,
};

const STATUS_NEXT_LABELS: Record<string, string> = {
  assigned: 'Assignée',
  picked_up: 'Récupérée',
  en_route: 'En route',
  delivered: 'Livrée',
};

// ── Mock map dot ───────────────────────────────────────────────────────────────

function MapDot({
  status,
  label,
  x,
  y,
}: {
  status: string;
  label: string;
  x: number;
  y: number;
}) {
  const color =
    status === 'en_route'
      ? 'bg-orange-400'
      : status === 'delivered'
        ? 'bg-green-500'
        : status === 'failed'
          ? 'bg-red-500'
          : 'bg-amber-400';

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-100%)' }}
    >
      <div
        className={`w-3 h-3 rounded-full ${color} ring-2 ring-white shadow-md animate-pulse`}
      />
      <span className="mt-0.5 text-[10px] font-medium text-gray-700 bg-white/80 px-1 rounded shadow-sm whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_LABELS[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-100' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// ── Delivery row ───────────────────────────────────────────────────────────────

function DeliveryRow({
  delivery,
  onAdvance,
}: {
  delivery: DeliveryRecord;
  onAdvance: (id: string, status: string) => void;
}) {
  const nextStatus = STATUS_NEXT[delivery.status];
  const address = delivery.order?.delivery_address as
    | { street?: string; city?: string }
    | null
    | undefined;
  const customer = delivery.order?.customer;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {delivery.order?.order_number ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {customer ? (
          <div className="flex items-center gap-1.5">
            <User size={13} className="text-gray-400" />
            {customer.firstName} {customer.lastName}
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                <Phone size={12} />
              </a>
            )}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {address ? (
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            <span className="truncate max-w-[200px]">
              {[address.street, address.city].filter(Boolean).join(', ') || '—'}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {delivery.agent ? (
          <div className="flex items-center gap-1.5">
            <Truck size={13} className="text-gray-400" />
            {delivery.agent.name}
          </div>
        ) : (
          <span className="text-amber-600 text-xs font-medium">Non assigné</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={delivery.status} />
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {delivery.assigned_at
          ? new Date(delivery.assigned_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—'}
      </td>
      <td className="px-4 py-3">
        {nextStatus && (
          <button
            onClick={() => onAdvance(delivery.id, nextStatus)}
            className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors"
          >
            → {STATUS_NEXT_LABELS[nextStatus]}
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Mock map ───────────────────────────────────────────────────────────────────

function MockMap({ deliveries }: { deliveries: DeliveryRecord[] }) {
  const seeded = deliveries.slice(0, 8).map((d, i) => ({
    ...d,
    x: 15 + ((i * 31 + 7) % 70),
    y: 10 + ((i * 17 + 13) % 70),
  }));

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-xl overflow-hidden border border-gray-200">
      {/* Faux fond carte */}
      <div className="absolute inset-0 opacity-20">
        {[20, 40, 60, 80].map((v) => (
          <div key={v} className="absolute w-full border-t border-gray-400" style={{ top: `${v}%` }} />
        ))}
        {[20, 40, 60, 80].map((v) => (
          <div key={v} className="absolute h-full border-l border-gray-400" style={{ left: `${v}%` }} />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-gray-300 text-xs font-medium tracking-widest uppercase">
          Carte mock MVP
        </span>
      </div>
      {seeded.map((d) => (
        <MapDot
          key={d.id}
          status={d.status}
          label={d.order?.order_number ?? d.id.slice(0, 6)}
          x={d.x}
          y={d.y}
        />
      ))}
      {/* Légende */}
      <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-3 py-2 text-[10px] space-y-1 shadow">
        {[
          { color: 'bg-amber-400', label: 'En attente / Assignée' },
          { color: 'bg-orange-400', label: 'En route' },
          { color: 'bg-green-500', label: 'Livrée' },
          { color: 'bg-red-500', label: 'Échec' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
  const { data: kpis } = useDeliveryKpis();
  const { data: deliveries = [], isLoading, refetch } = useActiveDeliveries();
  const updateStatus = useUpdateDeliveryStatus();
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const handleAdvance = async (id: string, status: string) => {
    setAdvancingId(id);
    try {
      await updateStatus.mutateAsync({ id, status });
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-100">
            <Truck size={22} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Livraisons</h1>
            <p className="text-sm text-gray-500">Tableau de bord temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/delivery/zones"
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings size={15} />
            Zones
          </Link>
          <Link
            href="/dashboard/delivery/drivers"
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Users size={15} />
            Livreurs
          </Link>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw size={14} />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Truck} label="En cours" value={kpis?.active} color="bg-indigo-500" />
        <KpiCard icon={Clock} label="En attente d'assignation" value={kpis?.pending} color="bg-amber-500" />
        <KpiCard icon={CheckCircle2} label="Livrées aujourd'hui" value={kpis?.delivered_today} color="bg-green-500" />
        <KpiCard icon={XCircle} label="Échecs aujourd'hui" value={kpis?.failed_today} color="bg-red-500" />
      </div>

      {/* Map + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Carte */}
        <div className="xl:col-span-2 h-72 xl:h-auto min-h-[280px]">
          <MockMap deliveries={deliveries} />
        </div>

        {/* Table */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Livraisons actives
              {deliveries.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({deliveries.length})
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>
          ) : deliveries.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 size={32} className="text-green-400 mx-auto" />
              <p className="text-sm text-gray-500">Aucune livraison en cours</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                    <th className="px-4 py-2.5">Commande</th>
                    <th className="px-4 py-2.5">Client</th>
                    <th className="px-4 py-2.5">Adresse</th>
                    <th className="px-4 py-2.5">Livreur</th>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5">Heure</th>
                    <th className="px-4 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveries.map((d) => (
                    <DeliveryRow
                      key={d.id}
                      delivery={d}
                      onAdvance={advancingId ? () => {} : handleAdvance}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
