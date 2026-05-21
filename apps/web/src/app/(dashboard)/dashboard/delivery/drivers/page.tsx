'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Users,
  Truck,
  Phone,
  ChevronLeft,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  useDeliveryDrivers,
  useDeliveryZones,
  useCreateDriver,
  useUpdateDriver,
  useToggleDriverAvailability,
  useDeleteDriver,
  type DeliveryDriver,
  type CreateDriverPayload,
} from '@/hooks/delivery/use-delivery';

// ── Driver modal ───────────────────────────────────────────────────────────────

interface DriverModalProps {
  initial?: DeliveryDriver | null;
  zones: { id: string; name: string }[];
  onClose: () => void;
  onSave: (payload: CreateDriverPayload & { id?: string }) => Promise<void>;
  saving: boolean;
}

function DriverModal({ initial, zones, onClose, onSave, saving }: DriverModalProps) {
  const [userId, setUserId] = useState(initial?.user_id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [zoneId, setZoneId] = useState(initial?.zone?.id ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...(initial ? { id: initial.id } : {}),
      user_id: userId,
      name,
      phone: phone || undefined,
      zone_id: zoneId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? 'Modifier le livreur' : 'Nouveau livreur'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {!initial && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ID utilisateur (UUID) *
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="uuid de l'utilisateur…"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                L'utilisateur doit exister dans le système.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom complet *</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prénom Nom"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+221 77 000 00 00"
              type="tel"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Zone assignée</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
            >
              <option value="">— Aucune zone —</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

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
              disabled={saving || !name.trim() || (!initial && !userId.trim())}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter le livreur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Availability switch ────────────────────────────────────────────────────────

function AvailabilitySwitch({
  driverId,
  isAvailable,
}: {
  driverId: string;
  isAvailable: boolean;
}) {
  const toggle = useToggleDriverAvailability();

  return (
    <button
      onClick={() => toggle.mutate(driverId)}
      disabled={toggle.isPending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        isAvailable ? 'bg-green-500' : 'bg-gray-200'
      } ${toggle.isPending ? 'opacity-50' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          isAvailable ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ── Driver row ─────────────────────────────────────────────────────────────────

function DriverRow({
  driver,
  onEdit,
  onDelete,
}: {
  driver: DeliveryDriver;
  onEdit: (d: DeliveryDriver) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
            {driver.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">{driver.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {driver.phone ? (
          <a
            href={`tel:${driver.phone}`}
            className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
          >
            <Phone size={13} className="text-gray-400" />
            {driver.phone}
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {driver.zone ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
            {driver.zone.name}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">Non assigné</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <AvailabilitySwitch driverId={driver.id} isAvailable={driver.is_available} />
          <span className={`text-xs ${driver.is_available ? 'text-green-600' : 'text-gray-400'}`}>
            {driver.is_available ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Truck size={13} className="text-gray-400" />
          <span className="text-sm text-gray-700">{driver.deliveries_today}</span>
          <span className="text-xs text-gray-400">aujourd'hui</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(driver)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(driver.id)}
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

export default function DeliveryDriversPage() {
  const { data: drivers = [], isLoading } = useDeliveryDrivers();
  const { data: zones = [] } = useDeliveryZones();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<DeliveryDriver | null>(null);

  const availableCount = drivers.filter((d) => d.is_available).length;

  const openCreate = () => {
    setEditing(null);
    setModal('create');
  };

  const openEdit = (driver: DeliveryDriver) => {
    setEditing(driver);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
  };

  const handleSave = async (payload: CreateDriverPayload & { id?: string }) => {
    if (modal === 'edit' && editing) {
      await updateDriver.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createDriver.mutateAsync(payload as CreateDriverPayload);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce livreur ?')) return;
    await deleteDriver.mutateAsync(id);
  };

  const saving = createDriver.isPending || updateDriver.isPending;

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
            <div className="p-2 rounded-xl bg-green-100">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Livreurs</h1>
              <p className="text-sm text-gray-500">
                {availableCount} disponible{availableCount !== 1 ? 's' : ''} sur {drivers.length}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Nouveau livreur
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users size={36} className="text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500">Aucun livreur enregistré</p>
            <button onClick={openCreate} className="text-sm text-indigo-600 hover:underline">
              Ajouter le premier livreur
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="px-4 py-2.5">Livreur</th>
                <th className="px-4 py-2.5">Téléphone</th>
                <th className="px-4 py-2.5">Zone assignée</th>
                <th className="px-4 py-2.5">Disponible</th>
                <th className="px-4 py-2.5">Livraisons</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d) => (
                <DriverRow
                  key={d.id}
                  driver={d}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <DriverModal
          initial={editing}
          zones={zones}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
