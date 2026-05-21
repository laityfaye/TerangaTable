'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, List, Wifi, WifiOff, Search, ChevronDown } from 'lucide-react';
import { useReservations, type ReservationStatus } from '@/hooks/reservations/use-reservations';
import { useReservationsWs } from '@/hooks/reservations/use-reservations-ws';
import { CalendarView } from './_components/calendar-view';
import { ListView } from './_components/list-view';
import { ReservationModal } from './_components/reservation-modal';
import { ReservationDrawerPanel } from './_components/reservation-drawer';

type ViewMode = 'calendar' | 'list';

const STATUS_OPTIONS: { value: ReservationStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'seated', label: 'Installées' },
  { value: 'completed', label: 'Terminées' },
  { value: 'cancelled', label: 'Annulées' },
  { value: 'no_show', label: 'No-show' },
];

export default function ReservationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [drawerReservationId, setDrawerReservationId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('');

  const { connected } = useReservationsWs();

  // Fetch all reservations for the calendar (wide range)
  const { data: allData, isLoading } = useReservations({
    limit: 500,
    ...(statusFilter && { status: statusFilter }),
    ...(search && { search }),
  });
  const reservations = allData?.data ?? [];

  function handleClickSlot(datetime: string) {
    setPrefillDate(datetime);
    setModalOpen(true);
  }

  function handleNewReservation() {
    setPrefillDate(undefined);
    setModalOpen(true);
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Réservations</h1>
          <p className="text-sm text-slate-500 font-body mt-0.5">
            {allData?.meta.total ?? 0} réservation{(allData?.meta.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* WS indicator */}
          <span
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium ${
              connected ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'En direct' : 'Hors ligne'}
          </span>

          {/* Floor plan */}
          <Link
            href="/dashboard/reservations/floor-plan"
            className="px-3 h-9 flex items-center gap-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            <LayoutGrid size={15} />
            Plan de salle
          </Link>

          {/* View toggle */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vue Calendrier"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vue Liste"
            >
              <List size={15} />
            </button>
          </div>

          {/* New reservation */}
          <button
            onClick={handleNewReservation}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors"
          >
            <Plus size={16} />
            Nouvelle réservation
          </button>
        </div>
      </div>

      {/* Filters (list view only) */}
      {viewMode === 'list' && (
        <div className="flex gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nom, téléphone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | '')}
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta bg-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Views */}
      <div className="flex-1 min-h-0">
        {viewMode === 'calendar' ? (
          <CalendarView
            reservations={reservations}
            onClickReservation={setDrawerReservationId}
            onClickSlot={handleClickSlot}
          />
        ) : (
          <div className="overflow-y-auto h-full pr-1">
            <ListView
              reservations={reservations}
              onClickReservation={setDrawerReservationId}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* New reservation modal */}
      <ReservationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prefillDate={prefillDate}
      />

      {/* Detail drawer */}
      <ReservationDrawerPanel
        reservationId={drawerReservationId}
        onClose={() => setDrawerReservationId(null)}
      />
    </div>
  );
}
