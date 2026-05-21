'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Reservation, ReservationStatus } from '@/hooks/reservations/use-reservations';

interface Props {
  reservations: Reservation[];
  onClickReservation: (id: string) => void;
  onClickSlot: (datetime: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending:   '#F59E0B',
  confirmed: '#10B981',
  seated:    '#3B82F6',
  completed: '#6B7280',
  cancelled: '#EF4444',
  no_show:   '#9333EA',
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ── Day Cell (Month view) ─────────────────────────────────────────────────────

function MonthDayCell({
  date,
  reservations,
  isToday,
  isCurrentMonth,
  onClickReservation,
  onClickSlot,
}: {
  date: Date;
  reservations: Reservation[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onClickReservation: (id: string) => void;
  onClickSlot: (dt: string) => void;
}) {
  const visible = reservations.slice(0, 3);
  const extra = reservations.length - visible.length;

  return (
    <div
      className={`min-h-[90px] border-b border-r border-slate-100 p-1.5 cursor-pointer hover:bg-slate-50/60 transition-colors ${
        !isCurrentMonth ? 'bg-slate-50/40' : ''
      }`}
      onClick={() => {
        const dt = new Date(date);
        dt.setHours(12, 0, 0, 0);
        onClickSlot(dt.toISOString());
      }}
    >
      <span
        className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${
          isToday
            ? 'bg-terracotta text-white'
            : isCurrentMonth
            ? 'text-slate-700'
            : 'text-slate-300'
        }`}
      >
        {date.getDate()}
      </span>
      <div className="space-y-0.5">
        {visible.map((r) => (
          <button
            key={r.id}
            onClick={(e) => { e.stopPropagation(); onClickReservation(r.id); }}
            className="w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate"
            style={{ backgroundColor: STATUS_COLORS[r.status] + '20', color: STATUS_COLORS[r.status] }}
          >
            {formatTime(r.reserved_at)} {r.customer_name.split(' ')[0]}
          </button>
        ))}
        {extra > 0 && (
          <p className="text-[10px] text-slate-400 pl-1">+{extra} autre{extra > 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({
  weekStart,
  reservations,
  onClickReservation,
  onClickSlot,
}: {
  weekStart: Date;
  reservations: Reservation[];
  onClickReservation: (id: string) => void;
  onClickSlot: (dt: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {days.map((d) => (
          <div key={d.toISOString()} className="py-2 text-center">
            <p className="text-xs text-slate-400">
              {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
            </p>
            <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium mt-0.5 ${
              isSameDay(d, today) ? 'bg-terracotta text-white' : 'text-slate-700'
            }`}>
              {d.getDate()}
            </span>
          </div>
        ))}
      </div>
      {/* Day columns */}
      <div className="grid grid-cols-7 flex-1 overflow-y-auto">
        {days.map((d) => {
          const dayRes = reservations.filter((r) => isSameDay(new Date(r.reserved_at), d));
          return (
            <div
              key={d.toISOString()}
              className="border-r border-slate-100 p-2 space-y-1 min-h-[200px] cursor-pointer hover:bg-slate-50/40"
              onClick={() => {
                const dt = new Date(d);
                dt.setHours(12, 0, 0, 0);
                onClickSlot(dt.toISOString());
              }}
            >
              {dayRes.map((r) => (
                <button
                  key={r.id}
                  onClick={(e) => { e.stopPropagation(); onClickReservation(r.id); }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded-lg font-medium truncate"
                  style={{ backgroundColor: STATUS_COLORS[r.status] + '20', color: STATUS_COLORS[r.status], borderLeft: `3px solid ${STATUS_COLORS[r.status]}` }}
                >
                  {formatTime(r.reserved_at)}<br />
                  <span className="font-normal opacity-80">{r.customer_name} · {r.party_size}p</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────

function DayView({
  date,
  reservations,
  onClickReservation,
  onClickSlot,
}: {
  date: Date;
  reservations: Reservation[];
  onClickReservation: (id: string) => void;
  onClickSlot: (dt: string) => void;
}) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 07h–22h

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {hours.map((h) => {
        const slotRes = reservations.filter((r) => {
          const rh = new Date(r.reserved_at).getHours();
          return rh === h;
        });
        return (
          <div
            key={h}
            className="flex border-b border-slate-100 min-h-[56px] cursor-pointer hover:bg-slate-50/40"
            onClick={() => {
              const dt = new Date(date);
              dt.setHours(h, 0, 0, 0);
              onClickSlot(dt.toISOString());
            }}
          >
            <div className="w-14 flex-shrink-0 text-right pr-3 pt-1.5">
              <span className="text-xs text-slate-400">{pad(h)}:00</span>
            </div>
            <div className="flex-1 px-2 py-1 space-y-1">
              {slotRes.map((r) => (
                <button
                  key={r.id}
                  onClick={(e) => { e.stopPropagation(); onClickReservation(r.id); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: STATUS_COLORS[r.status] + '15', borderLeft: `3px solid ${STATUS_COLORS[r.status]}`, color: STATUS_COLORS[r.status] }}
                >
                  {formatTime(r.reserved_at)} — {r.customer_name} · {r.party_size} pers.
                  {r.table && <span className="ml-2 text-xs opacity-70">Table {r.table.number}</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function pad(n: number) { return String(n).padStart(2, '0'); }

// ── Main CalendarView ─────────────────────────────────────────────────────────

export function CalendarView({ reservations, onClickReservation, onClickSlot }: Props) {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();

  // Navigation
  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  }

  // Title
  const title = useMemo(() => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      return `${ws.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${we.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [view, currentDate]);

  // Month grid
  const monthGrid = useMemo(() => {
    if (view !== 'month') return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
    const days: Date[] = [];
    for (let i = -startOffset; i < 42 - startOffset; i++) {
      days.push(new Date(year, month, 1 + i));
    }
    return days;
  }, [view, currentDate]);

  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);

  function reservationsForDay(d: Date) {
    return reservations.filter((r) => isSameDay(new Date(r.reserved_at), d));
  }

  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Aujourd&apos;hui
          </button>
          <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-800 ml-1 capitalize">{title}</span>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                view === v ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
            </button>
          ))}
        </div>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div className="flex flex-col flex-1 overflow-auto">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1">
            {monthGrid.map((d) => (
              <MonthDayCell
                key={d.toISOString()}
                date={d}
                reservations={reservationsForDay(d)}
                isToday={isSameDay(d, today)}
                isCurrentMonth={d.getMonth() === currentDate.getMonth()}
                onClickReservation={onClickReservation}
                onClickSlot={onClickSlot}
              />
            ))}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <WeekView
          weekStart={weekStart}
          reservations={reservations}
          onClickReservation={onClickReservation}
          onClickSlot={onClickSlot}
        />
      )}

      {/* Day view */}
      {view === 'day' && (
        <DayView
          date={currentDate}
          reservations={reservationsForDay(currentDate)}
          onClickReservation={onClickReservation}
          onClickSlot={onClickSlot}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 flex-shrink-0 flex-wrap">
        {(Object.entries(STATUS_COLORS) as [ReservationStatus, string][])
          .filter(([s]) => s !== 'completed' && s !== 'no_show')
          .map(([s, c]) => (
            <span key={s} className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c }} />
              {s === 'pending' ? 'En attente' : s === 'confirmed' ? 'Confirmée' : s === 'seated' ? 'Installée' : s === 'cancelled' ? 'Annulée' : s}
            </span>
          ))}
      </div>
    </div>
  );
}
