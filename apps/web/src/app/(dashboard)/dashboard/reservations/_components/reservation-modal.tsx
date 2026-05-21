'use client';

import { useState, useEffect } from 'react';
import { X, Search, Clock, Users, CalendarDays } from 'lucide-react';
import { useCreateReservation, useUpdateReservation, type Reservation } from '@/hooks/reservations/use-reservations';
import { useTableAvailability } from '@/hooks/reservations/use-tables';

interface Props {
  open: boolean;
  onClose: () => void;
  prefillDate?: string;   // ISO datetime
  prefillTableId?: string;
  editReservation?: Reservation | null;
}

const SOURCES = [
  { value: 'phone', label: 'Téléphone' },
  { value: 'website', label: 'Site web' },
  { value: 'walk_in', label: 'Sur place' },
  { value: 'api', label: 'API' },
] as const;

function pad(n: number) { return String(n).padStart(2, '0'); }

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ReservationModal({ open, onClose, prefillDate, prefillTableId, editReservation }: Props) {
  const isEdit = !!editReservation;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [reservedAt, setReservedAt] = useState('');
  const [durationMin, setDurationMin] = useState(90);
  const [tableId, setTableId] = useState<string>('');
  const [source, setSource] = useState<'phone' | 'website' | 'walk_in' | 'api'>('phone');
  const [notes, setNotes] = useState('');

  const { mutateAsync: create, isPending: creating } = useCreateReservation();
  const { mutateAsync: update, isPending: updating } = useUpdateReservation();

  // Availability query: fetch when we have a datetime and party_size
  const availQuery = reservedAt && partySize > 0
    ? { date: new Date(reservedAt).toISOString(), party_size: partySize, duration_min: durationMin }
    : null;
  const { data: availableTables = [] } = useTableAvailability(availQuery);

  // Prefill from edit or prefill props
  useEffect(() => {
    if (!open) return;
    if (editReservation) {
      setCustomerName(editReservation.customer_name);
      setCustomerPhone(editReservation.customer_phone ?? '');
      setCustomerEmail(editReservation.customer_email ?? '');
      setPartySize(editReservation.party_size);
      setReservedAt(toLocalDatetimeValue(editReservation.reserved_at));
      setDurationMin(editReservation.duration_min);
      setTableId(editReservation.table_id ?? '');
      setSource(editReservation.source);
      setNotes(editReservation.notes ?? '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setPartySize(2);
      setReservedAt(prefillDate ? toLocalDatetimeValue(prefillDate) : '');
      setDurationMin(90);
      setTableId(prefillTableId ?? '');
      setSource('phone');
      setNotes('');
    }
  }, [open, editReservation, prefillDate, prefillTableId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isoReservedAt = new Date(reservedAt).toISOString();

    if (isEdit) {
      await update({
        id: editReservation!.id,
        table_id: tableId || undefined,
        reserved_at: isoReservedAt,
        duration_min: durationMin,
        party_size: partySize,
        notes: notes || undefined,
      });
    } else {
      await create({
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        customer_email: customerEmail || undefined,
        party_size: partySize,
        table_id: tableId || undefined,
        reserved_at: isoReservedAt,
        duration_min: durationMin,
        source,
        notes: notes || undefined,
      });
    }
    onClose();
  }

  if (!open) return null;

  const isPending = creating || updating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? 'Modifier la réservation' : 'Nouvelle réservation'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Client */}
          {!isEdit && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Client
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nom du client"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
                <input
                  type="email"
                  placeholder="Email (optionnel)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
              </div>
            </div>
          )}

          {/* Date + Couverts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <CalendarDays size={12} /> Date &amp; Heure
              </label>
              <input
                type="datetime-local"
                value={reservedAt}
                onChange={(e) => setReservedAt(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Users size={12} /> Couverts
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              />
            </div>
          </div>

          {/* Durée */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Clock size={12} /> Durée estimée : {durationMin} min
            </label>
            <input
              type="range"
              min={30}
              max={240}
              step={15}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="w-full accent-terracotta"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>30 min</span><span>4 h</span>
            </div>
          </div>

          {/* Table suggérée */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Table {reservedAt ? '(selon disponibilité)' : ''}
            </label>
            {availableTables.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTableId('')}
                  className={`py-2 px-3 rounded-lg border text-sm text-center transition-colors ${
                    !tableId
                      ? 'border-terracotta bg-terracotta/5 text-terracotta font-medium'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  Aucune
                </button>
                {availableTables.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTableId(t.available ? t.id : tableId)}
                    disabled={!t.available}
                    className={`py-2 px-3 rounded-lg border text-sm text-center transition-colors ${
                      tableId === t.id
                        ? 'border-terracotta bg-terracotta/5 text-terracotta font-medium'
                        : t.available
                        ? 'border-slate-200 text-slate-700 hover:border-slate-300'
                        : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed line-through'
                    }`}
                  >
                    T{t.number}
                    <span className="block text-[10px] text-slate-400">{t.capacity} pers.</span>
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              >
                <option value="">Renseigner une date pour voir les disponibilités</option>
              </select>
            )}
          </div>

          {/* Source */}
          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Source
              </label>
              <div className="flex gap-2 flex-wrap">
                {SOURCES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSource(s.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      source === s.value
                        ? 'border-terracotta bg-terracotta/5 text-terracotta font-medium'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Notes spéciales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Allergie, anniversaire, chaise bébé…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-terracotta-dark transition-colors disabled:opacity-50"
          >
            {isPending
              ? 'En cours…'
              : isEdit
              ? 'Enregistrer les modifications'
              : 'Confirmer la réservation'}
          </button>
        </form>
      </div>
    </div>
  );
}
