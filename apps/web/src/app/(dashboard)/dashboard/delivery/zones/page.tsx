'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  MapPin,
  Trash2,
  Pencil,
  ChevronLeft,
  Circle,
  Hexagon,
} from 'lucide-react';
import {
  useDeliveryZones,
  useCreateZone,
  useUpdateZone,
  useDeleteZone,
  type DeliveryZone,
  type CreateZonePayload,
} from '@/hooks/delivery/use-delivery';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatXAF(v: number) {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v) + ' F';
}

// ── Zone Modal ─────────────────────────────────────────────────────────────────

interface ZoneModalProps {
  initial?: DeliveryZone | null;
  onClose: () => void;
  onSave: (payload: CreateZonePayload) => Promise<void>;
  saving: boolean;
}

function ZoneModal({ initial, onClose, onSave, saving }: ZoneModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<'radius' | 'polygon'>(initial?.type ?? 'radius');
  const [radiusKm, setRadiusKm] = useState(String(initial?.radius_km ?? ''));
  const [minOrder, setMinOrder] = useState(String(initial?.min_order ?? '0'));
  const [deliveryFee, setDeliveryFee] = useState(String(initial?.delivery_fee ?? '0'));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateZonePayload = {
      name,
      type,
      min_order: parseFloat(minOrder) || 0,
      delivery_fee: parseFloat(deliveryFee) || 0,
      is_active: isActive,
    };
    if (type === 'radius' && radiusKm) {
      payload.radius_km = parseFloat(radiusKm);
    }
    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la zone *</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Centre-ville, Zone Nord…"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Type de zone *</label>
            <div className="grid grid-cols-2 gap-2">
              {(['radius', 'polygon'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    type === t
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t === 'radius' ? <Circle size={15} /> : <Hexagon size={15} />}
                  {t === 'radius' ? 'Rayon (km)' : 'Polygone'}
                </button>
              ))}
            </div>
          </div>

          {type === 'radius' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                placeholder="ex: 5"
              />
            </div>
          )}

          {type === 'polygon' && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Le périmètre GeoJSON peut être défini via l&apos;API ou une intégration cartographique.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Frais de livraison (F)
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Commande minimum (F)
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-gray-700">Zone active</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer la zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Zone row ───────────────────────────────────────────────────────────────────

function ZoneRow({
  zone,
  onEdit,
  onDelete,
}: {
  zone: DeliveryZone;
  onEdit: (z: DeliveryZone) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {zone.type === 'radius' ? (
            <Circle size={14} className="text-indigo-400" />
          ) : (
            <Hexagon size={14} className="text-purple-400" />
          )}
          <span className="text-sm font-medium text-gray-900">{zone.name}</span>
          {!zone.is_active && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Inactive
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
        {zone.type === 'radius' ? `Rayon${zone.radius_km != null ? ` — ${zone.radius_km} km` : ''}` : 'Polygone'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{formatXAF(zone.delivery_fee)}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{formatXAF(zone.min_order)}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{zone.agents_count} livreur{zone.agents_count !== 1 ? 's' : ''}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(zone)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(zone.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DeliveryZonesPage() {
  const { data: zones = [], isLoading } = useDeliveryZones();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModal('create');
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditing(zone);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
  };

  const handleSave = async (payload: CreateZonePayload) => {
    if (modal === 'edit' && editing) {
      await updateZone.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createZone.mutateAsync(payload);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return;
    await deleteZone.mutateAsync(id);
  };

  const saving = createZone.isPending || updateZone.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/delivery"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100">
              <MapPin size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Zones de livraison</h1>
              <p className="text-sm text-gray-500">{zones.length} zone{zones.length !== 1 ? 's' : ''} configurée{zones.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Nouvelle zone
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : zones.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MapPin size={36} className="text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500">Aucune zone configurée</p>
            <button
              onClick={openCreate}
              className="text-sm text-indigo-600 hover:underline"
            >
              Créer la première zone
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="px-4 py-2.5">Nom</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Frais</th>
                <th className="px-4 py-2.5">Minimum</th>
                <th className="px-4 py-2.5">Livreurs</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {zones.map((z) => (
                <ZoneRow
                  key={z.id}
                  zone={z}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ZoneModal
          initial={editing}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
