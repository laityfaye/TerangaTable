'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus, Save, Edit3, X, ChevronDown } from 'lucide-react';
import {
  useZones,
  useTables,
  useUpdateTable,
  useCreateTable,
  useDeleteTable,
  useCreateZone,
  type Table,
  type TableShape,
} from '@/hooks/reservations/use-tables';
import { useReservations } from '@/hooks/reservations/use-reservations';
import { ReservationModal } from '../_components/reservation-modal';
import { ReservationDrawerPanel } from '../_components/reservation-drawer';

// ── Types ─────────────────────────────────────────────────────────────────────

type TableStatus = 'free' | 'reserved_soon' | 'occupied' | 'inactive';

interface DragState {
  tableId: string;
  startX: number;
  startY: number;
  origPosX: number;
  origPosY: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTableStatus(table: Table, reservations: ReturnType<typeof useReservations>['data']): TableStatus {
  if (!table.is_active) return 'inactive';
  const now = Date.now();
  const hourMs = 60 * 60_000;

  const tableRes = (reservations?.data ?? []).filter(
    (r) => r.table_id === table.id && r.status !== 'cancelled' && r.status !== 'no_show',
  );

  for (const r of tableRes) {
    const start = new Date(r.reserved_at).getTime();
    const end = start + r.duration_min * 60_000;
    if (now >= start && now <= end) return 'occupied';
    if (start > now && start <= now + hourMs) return 'reserved_soon';
  }
  return 'free';
}

const STATUS_CONFIG: Record<TableStatus, { color: string; bg: string; label: string; emoji: string }> = {
  free:          { color: '#10B981', bg: '#D1FAE5', label: 'Libre',              emoji: '🟢' },
  reserved_soon: { color: '#F59E0B', bg: '#FEF3C7', label: 'Réservée (< 1h)',    emoji: '🟡' },
  occupied:      { color: '#EF4444', bg: '#FEE2E2', label: 'Occupée',            emoji: '🔴' },
  inactive:      { color: '#6B7280', bg: '#F3F4F6', label: 'Hors service',       emoji: '⚫' },
};

const SHAPE_DEFAULTS: Record<TableShape, { w: number; h: number }> = {
  round:  { w: 64, h: 64 },
  square: { w: 70, h: 70 },
  rect:   { w: 96, h: 64 },
};

// ── Table Shape SVG ───────────────────────────────────────────────────────────

function TableSvg({
  table,
  status,
  editMode,
  onDragStart,
  onClick,
  onDoubleClick,
}: {
  table: Table;
  status: TableStatus;
  editMode: boolean;
  onDragStart: (e: React.MouseEvent, t: Table) => void;
  onClick: (t: Table) => void;
  onDoubleClick: (t: Table) => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const dim = SHAPE_DEFAULTS[table.shape];

  return (
    <div
      className={`absolute select-none flex flex-col items-center justify-center text-center ${editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      style={{
        left: table.pos_x,
        top: table.pos_y,
        width: dim.w,
        height: dim.h,
        userSelect: 'none',
      }}
      onMouseDown={editMode ? (e) => onDragStart(e, table) : undefined}
      onClick={() => !editMode && onClick(table)}
      onDoubleClick={() => !editMode && onDoubleClick(table)}
    >
      {table.shape === 'round' ? (
        <div
          className="w-full h-full rounded-full border-2 flex flex-col items-center justify-center shadow-sm transition-colors"
          style={{ borderColor: cfg.color, backgroundColor: cfg.bg }}
        >
          <span className="text-xs font-bold" style={{ color: cfg.color }}>T{table.number}</span>
          <span className="text-[9px] opacity-70" style={{ color: cfg.color }}>{table.capacity}p</span>
        </div>
      ) : table.shape === 'square' ? (
        <div
          className="w-full h-full rounded-lg border-2 flex flex-col items-center justify-center shadow-sm transition-colors"
          style={{ borderColor: cfg.color, backgroundColor: cfg.bg }}
        >
          <span className="text-xs font-bold" style={{ color: cfg.color }}>T{table.number}</span>
          <span className="text-[9px] opacity-70" style={{ color: cfg.color }}>{table.capacity}p</span>
        </div>
      ) : (
        <div
          className="w-full h-full rounded-md border-2 flex flex-col items-center justify-center shadow-sm transition-colors"
          style={{ borderColor: cfg.color, backgroundColor: cfg.bg }}
        >
          <span className="text-xs font-bold" style={{ color: cfg.color }}>T{table.number}</span>
          <span className="text-[9px] opacity-70" style={{ color: cfg.color }}>{table.capacity}p</span>
        </div>
      )}
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function TableTooltip({ table, status }: { table: Table; status: TableStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg z-30 pointer-events-none">
      <p className="font-semibold">Table {table.number} · {table.capacity} pers.</p>
      <p style={{ color: cfg.color }}>{cfg.emoji} {cfg.label}</p>
      {table.zone && <p className="opacity-60">{table.zone.name}</p>}
    </div>
  );
}

// ── Add Table Modal ───────────────────────────────────────────────────────────

function AddTableModal({
  zoneId,
  onClose,
}: {
  zoneId: string | null;
  onClose: () => void;
}) {
  const { mutateAsync: createTable, isPending } = useCreateTable();
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [shape, setShape] = useState<TableShape>('round');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createTable({
      number,
      capacity,
      shape,
      zone_id: zoneId ?? undefined,
      pos_x: 80,
      pos_y: 80,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Ajouter une table</h3>
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Numéro</label>
            <input
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="ex: 12"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Capacité</label>
            <input
              type="number"
              min={1}
              max={30}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Forme</label>
            <div className="flex gap-2">
              {(['round', 'square', 'rect'] as TableShape[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShape(s)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    shape === s ? 'border-terracotta bg-terracotta/5 text-terracotta' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {s === 'round' ? 'Ronde' : s === 'square' ? 'Carrée' : 'Rect.'}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-terracotta text-white text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Ajout…' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FloorPlanPage() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newReservationTableId, setNewReservationTableId] = useState<string | null>(null);
  const [drawerReservationId, setDrawerReservationId] = useState<string | null>(null);

  const { data: zones = [] } = useZones();
  const { data: tables = [] } = useTables(selectedZoneId ?? undefined);
  const { data: reservationsData } = useReservations({ limit: 200 });
  const { mutate: updateTable } = useUpdateTable();
  const { mutate: deleteTable } = useDeleteTable();
  const { mutateAsync: createZone } = useCreateZone();

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Track pending positions for batch save
  const [pendingPositions, setPendingPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [newZoneName, setNewZoneName] = useState('');
  const [addingZone, setAddingZone] = useState(false);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    dragRef.current = {
      tableId: table.id,
      startX: e.clientX,
      startY: e.clientY,
      origPosX: positionsRef.current[table.id]?.x ?? table.pos_x,
      origPosY: positionsRef.current[table.id]?.y ?? table.pos_y,
    };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      const newX = Math.max(0, dragRef.current.origPosX + dx);
      const newY = Math.max(0, dragRef.current.origPosY + dy);

      positionsRef.current[dragRef.current.tableId] = { x: newX, y: newY };
      setPendingPositions((prev) => ({
        ...prev,
        [dragRef.current!.tableId]: { x: newX, y: newY },
      }));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // ── Save positions ─────────────────────────────────────────────────────────

  function savePositions() {
    for (const [tableId, pos] of Object.entries(pendingPositions)) {
      updateTable({ id: tableId, pos_x: Math.round(pos.x), pos_y: Math.round(pos.y) });
    }
    setPendingPositions({});
    setEditMode(false);
  }

  // ── Add zone ───────────────────────────────────────────────────────────────

  async function handleAddZone(e: React.FormEvent) {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    await createZone({ name: newZoneName.trim() });
    setNewZoneName('');
    setAddingZone(false);
  }

  // ── Computed table positions ───────────────────────────────────────────────

  function getTablePos(table: Table) {
    return pendingPositions[table.id] ?? { x: table.pos_x, y: table.pos_y };
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Plan de salle</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vue en temps réel · {tables.length} tables</p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => { setEditMode(false); setPendingPositions({}); }}
                className="px-3 h-9 flex items-center gap-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
              >
                <X size={15} /> Annuler
              </button>
              <button
                onClick={() => setShowAddTable(true)}
                className="px-3 h-9 flex items-center gap-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
              >
                <Plus size={15} /> Table
              </button>
              <button
                onClick={savePositions}
                className="px-4 h-9 flex items-center gap-1.5 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark"
              >
                <Save size={15} /> Enregistrer
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-3 h-9 flex items-center gap-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
            >
              <Edit3 size={15} /> Éditer le plan
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Zone selector sidebar */}
        <div className="w-44 flex-shrink-0 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">Zones</p>
          <button
            onClick={() => setSelectedZoneId(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedZoneId === null
                ? 'bg-terracotta/10 text-terracotta font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Toutes les zones
          </button>
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZoneId(z.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedZoneId === z.id
                  ? 'bg-terracotta/10 text-terracotta font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {z.name}
              <span className="ml-1.5 text-[10px] text-slate-400">({z.table_count})</span>
            </button>
          ))}

          {editMode && (
            addingZone ? (
              <form onSubmit={handleAddZone} className="flex flex-col gap-1">
                <input
                  autoFocus
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Nom de zone"
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-terracotta"
                />
                <div className="flex gap-1">
                  <button type="submit" className="flex-1 py-1 rounded-md bg-terracotta text-white text-xs font-medium">OK</button>
                  <button type="button" onClick={() => setAddingZone(false)} className="py-1 px-2 rounded-md border border-slate-200 text-xs text-slate-500">✕</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingZone(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-100 border border-dashed border-slate-200 flex items-center gap-1"
              >
                <Plus size={12} /> Nouvelle zone
              </button>
            )
          )}

          {/* Legend */}
          <div className="mt-4 space-y-1.5 px-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Légende</p>
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden relative">
          {/* Grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Tables */}
          <div
            ref={canvasRef}
            className="absolute inset-0"
            style={{ minWidth: 800, minHeight: 600 }}
          >
            {tables.map((table) => {
              const pos = getTablePos(table);
              const status = getTableStatus(table, reservationsData ?? undefined);
              const tableWithPos = { ...table, pos_x: pos.x, pos_y: pos.y };

              return (
                <div
                  key={table.id}
                  onMouseEnter={() => setHoveredTableId(table.id)}
                  onMouseLeave={() => setHoveredTableId(null)}
                  className="relative"
                >
                  {hoveredTableId === table.id && !editMode && (
                    <div style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: 20, pointerEvents: 'none' }}>
                      <div className="relative">
                        <TableTooltip table={table} status={status} />
                      </div>
                    </div>
                  )}
                  <TableSvg
                    table={tableWithPos}
                    status={status}
                    editMode={editMode}
                    onDragStart={handleDragStart}
                    onClick={(t) => {
                      // Show next reservation for this table if any
                      const nextRes = reservationsData?.data.find(
                        (r) => r.table_id === t.id && r.status !== 'cancelled' && r.status !== 'no_show',
                      );
                      if (nextRes) setDrawerReservationId(nextRes.id);
                    }}
                    onDoubleClick={(t) => setNewReservationTableId(t.id)}
                  />
                  {editMode && (
                    <button
                      onClick={() => deleteTable(table.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 z-10"
                      style={{ left: pos.x + SHAPE_DEFAULTS[table.shape].w - 8, top: pos.y - 8 }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Aucune table dans cette zone</p>
                {editMode && (
                  <p className="text-xs text-slate-300 mt-1">Cliquez sur &quot;+ Table&quot; pour en ajouter</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddTable && (
        <AddTableModal
          zoneId={selectedZoneId}
          onClose={() => setShowAddTable(false)}
        />
      )}

      {newReservationTableId && (
        <ReservationModal
          open={!!newReservationTableId}
          onClose={() => setNewReservationTableId(null)}
          prefillTableId={newReservationTableId}
        />
      )}

      <ReservationDrawerPanel
        reservationId={drawerReservationId}
        onClose={() => setDrawerReservationId(null)}
      />
    </div>
  );
}
