'use client';

import { Users, Clock, MapPin, Phone } from 'lucide-react';
import type { Reservation, ReservationStatus } from '@/hooks/reservations/use-reservations';

interface Props {
  reservations: Reservation[];
  onClickReservation: (id: string) => void;
  isLoading: boolean;
}

const STATUS_META: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente',   color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmée',    color: '#10B981', bg: '#D1FAE5' },
  seated:    { label: 'Installée',    color: '#3B82F6', bg: '#DBEAFE' },
  completed: { label: 'Terminée',     color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { label: 'Annulée',      color: '#EF4444', bg: '#FEE2E2' },
  no_show:   { label: 'No-show',      color: '#9333EA', bg: '#F3E8FF' },
};

export function ListView({ reservations, onClickReservation, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-slate-400 text-sm">Aucune réservation pour ces filtres</p>
      </div>
    );
  }

  // Group by date
  const groups = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const key = new Date(r.reserved_at).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([dateLabel, dayRes]) => (
        <div key={dateLabel}>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 capitalize">
            {dateLabel}
          </h3>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
            {dayRes.map((r) => {
              const meta = STATUS_META[r.status];
              return (
                <button
                  key={r.id}
                  onClick={() => onClickReservation(r.id)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4"
                  style={{ borderLeft: `3px solid ${meta.color}` }}
                >
                  {/* Time */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(r.reserved_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-slate-400">{r.duration_min} min</p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.customer_name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Users size={11} /> {r.party_size} pers.
                      </span>
                      {r.table && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={11} /> Table {r.table.number}
                          {r.table.zone && ` · ${r.table.zone.name}`}
                        </span>
                      )}
                      {r.customer_phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Phone size={11} /> {r.customer_phone}
                        </span>
                      )}
                      {r.notes && (
                        <span className="text-xs text-amber-600 truncate max-w-[160px]">
                          📝 {r.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ color: meta.color, backgroundColor: meta.bg }}
                  >
                    {meta.label}
                  </span>

                  {/* Duration indicator */}
                  <div className="flex-shrink-0 text-xs text-slate-300 flex items-center gap-1">
                    <Clock size={11} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
