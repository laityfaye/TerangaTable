'use client';

import { useState } from 'react';
import { X, Phone, Mail, Users, Clock, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReservation, useCancelReservation, useUpdateReservation, type ReservationStatus } from '@/hooks/reservations/use-reservations';
import { ReservationModal } from './reservation-modal';

interface Props {
  reservationId: string;
  onClose: () => void;
}

const STATUS_META: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente',   color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmée',    color: '#10B981', bg: '#D1FAE5' },
  seated:    { label: 'Installée',    color: '#3B82F6', bg: '#DBEAFE' },
  completed: { label: 'Terminée',     color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { label: 'Annulée',      color: '#EF4444', bg: '#FEE2E2' },
  no_show:   { label: 'No-show',      color: '#9333EA', bg: '#F3E8FF' },
};

const SOURCE_LABELS: Record<string, string> = {
  phone: 'Téléphone',
  website: 'Site web',
  walk_in: 'Sur place',
  api: 'API',
};

const QUICK_STATUSES: ReservationStatus[] = ['confirmed', 'seated', 'completed', 'no_show'];

export function ReservationDrawer({ reservationId, onClose }: Props) {
  const { data: r, isLoading } = useReservation(reservationId);
  const { mutate: cancel, isPending: cancelling } = useCancelReservation();
  const { mutate: updateStatus } = useUpdateReservation();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading || !r) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  const meta = STATUS_META[r.status] ?? STATUS_META.pending;
  const reservedDate = new Date(r.reserved_at);
  const endDate = new Date(reservedDate.getTime() + r.duration_min * 60_000);

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10"
          style={{ borderTop: `4px solid ${meta.color}` }}
        >
          <div>
            <p className="font-bold text-slate-900 text-lg">{r.customer_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ color: meta.color, backgroundColor: meta.bg }}
              >
                {meta.label}
              </span>
              <span className="text-xs text-slate-400">{SOURCE_LABELS[r.source] ?? r.source}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5 flex-1">
          {/* Date & heure */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Calendar size={11} /> Créneau
            </h3>
            <p className="text-sm font-medium text-slate-800">
              {reservedDate.toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock size={12} />
              {reservedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {' → '}
              {endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              <span className="text-slate-400">({r.duration_min} min)</span>
            </p>
          </section>

          {/* Couverts + table */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Users size={11} /> Couverts
              </h3>
              <p className="text-sm font-medium text-slate-800">{r.party_size} personnes</p>
            </div>
            {r.table && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <MapPin size={11} /> Table
                </h3>
                <p className="text-sm font-medium text-slate-800">
                  Table {r.table.number}
                  {r.table.zone && <span className="text-slate-400 ml-1">· {r.table.zone.name}</span>}
                </p>
              </div>
            )}
          </section>

          {/* Contact */}
          {(r.customer_phone || r.customer_email) && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Contact
              </h3>
              {r.customer_phone && (
                <a
                  href={`tel:${r.customer_phone}`}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-terracotta"
                >
                  <Phone size={13} className="text-slate-400" />
                  {r.customer_phone}
                </a>
              )}
              {r.customer_email && (
                <a
                  href={`mailto:${r.customer_email}`}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-terracotta mt-1"
                >
                  <Mail size={13} className="text-slate-400" />
                  {r.customer_email}
                </a>
              )}
            </section>
          )}

          {/* Notes */}
          {r.notes && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Notes
              </h3>
              <p className="text-sm text-slate-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                {r.notes}
              </p>
            </section>
          )}

          {/* Quick status transitions */}
          {r.status !== 'cancelled' && r.status !== 'completed' && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Changer le statut
              </h3>
              <div className="flex flex-wrap gap-2">
                {QUICK_STATUSES.filter((s) => s !== r.status).map((s) => {
                  const sm = STATUS_META[s];
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus({ id: r.id, status: s })}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                      style={{ borderColor: sm.color + '60', color: sm.color, backgroundColor: sm.bg }}
                    >
                      → {sm.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Actions footer */}
        {r.status !== 'cancelled' && r.status !== 'completed' && (
          <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white space-y-2">
            <button
              onClick={() => setShowEdit(true)}
              className="w-full py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Modifier
            </button>
            {confirmCancel ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Retour
                </button>
                <button
                  disabled={cancelling}
                  onClick={() => cancel(r.id, { onSuccess: onClose })}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {cancelling ? 'En cours…' : 'Confirmer'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full py-2 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50"
              >
                Annuler la réservation
              </button>
            )}
          </div>
        )}
      </div>

      {showEdit && (
        <ReservationModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          editReservation={r}
        />
      )}
    </>
  );
}

export function ReservationDrawerPanel({
  reservationId,
  onClose,
}: {
  reservationId: string | null;
  onClose: () => void;
}) {
  return (
    <>
      {reservationId && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}
      <motion.aside
        initial={false}
        animate={{ x: reservationId ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        {reservationId && (
          <ReservationDrawer reservationId={reservationId} onClose={onClose} />
        )}
      </motion.aside>
    </>
  );
}
