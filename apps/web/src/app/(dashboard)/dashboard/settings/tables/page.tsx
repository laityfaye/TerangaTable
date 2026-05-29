'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Pencil, Check, X, LayoutGrid, Circle, Square, RectangleHorizontal, QrCode, Download, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  useTables,
  useZones,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  useCreateZone,
  useDeleteZone,
  type TableShape,
  type Table,
  type Zone,
} from '@/hooks/reservations/use-tables';

// ── Helpers ────────────────────────────────────────────────────────────────────

const SHAPES: { value: TableShape; label: string; icon: React.ReactNode }[] = [
  { value: 'round', label: 'Ronde', icon: <Circle size={14} /> },
  { value: 'square', label: 'Carrée', icon: <Square size={14} /> },
  { value: 'rect', label: 'Rectangulaire', icon: <RectangleHorizontal size={14} /> },
];

function shapeLabel(s: TableShape) {
  return SHAPES.find((sh) => sh.value === s)?.label ?? s;
}

/** Construit l'URL du menu QR pour une table donnée */
function buildQrUrl(slug: string, tableNumber: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000');
  return `${base}/${slug}/menu?table=${encodeURIComponent(tableNumber)}`;
}

// ── QR Code Modal ──────────────────────────────────────────────────────────────

function QrModal({
  table,
  slug,
  onClose,
}: {
  table: Table;
  slug: string;
  onClose: () => void;
}) {
  const qrUrl   = buildQrUrl(slug, table.number);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fermer avec Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /** Télécharge le QR code en PNG */
  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-table-${table.number}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  /** Ouvre une fenêtre d'impression avec le QR code */
  const handlePrint = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code — Table ${table.number}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, sans-serif;
              background: #fff;
            }
            .card {
              border: 2px solid #e5e5e5;
              border-radius: 16px;
              padding: 32px 40px;
              text-align: center;
              box-shadow: 0 4px 24px rgba(0,0,0,.08);
            }
            h1 { margin: 0 0 4px; font-size: 28px; font-weight: 800; color: #1c1917; }
            p  { margin: 0 0 24px; font-size: 14px; color: #78716c; }
            img { display: block; width: 240px; height: 240px; }
            small { display: block; margin-top: 16px; font-size: 11px; color: #a8a29e; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Table ${table.number}</h1>
            <p>Scannez pour commander</p>
            <img src="${dataUrl}" alt="QR Code table ${table.number}" />
            <small>${qrUrl}</small>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-terracotta" />
            <span className="font-semibold text-slate-800">QR Code — Table {table.number}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center px-8 py-8 gap-4">
          {/* Canvas QR */}
          <div
            ref={canvasRef}
            className="p-4 rounded-2xl bg-white shadow-inner border border-slate-100"
          >
            <QRCodeCanvas
              value={qrUrl}
              size={200}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: '',
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
          </div>

          {/* URL */}
          <p className="text-[11px] text-slate-400 text-center break-all px-2">{qrUrl}</p>

          {/* Instruction */}
          <p className="text-xs text-slate-500 text-center">
            Placez ce QR code sur la table. Les clients le scannent pour accéder au menu et commander directement.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download size={14} />
            Télécharger PNG
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta/90 transition-colors"
          >
            <Printer size={14} />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline add-table form ──────────────────────────────────────────────────────

function AddTableForm({
  zoneId,
  onClose,
}: {
  zoneId?: string;
  onClose: () => void;
}) {
  const { mutate, isPending } = useCreateTable();
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [shape, setShape] = useState<TableShape>('square');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!number.trim()) return;
    mutate(
      { number: number.trim(), capacity, shape, ...(zoneId ? { zone_id: zoneId } : {}) },
      { onSuccess: onClose },
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Numéro / nom</label>
          <input
            autoFocus
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Ex : 12, Terrasse A…"
            className="w-full h-8 px-2.5 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Capacité (couverts)</label>
          <input
            type="number"
            min={1}
            max={99}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full h-8 px-2.5 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 block mb-1">Forme</label>
        <div className="flex gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setShape(s.value)}
              className={`flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium border transition-all ${
                shape === s.value
                  ? 'border-terracotta bg-terracotta/5 text-terracotta'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending || !number.trim()}
          className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-terracotta text-white text-xs font-semibold disabled:opacity-50 hover:bg-terracotta/90 transition-colors"
        >
          <Check size={13} />
          Ajouter
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 transition-colors"
        >
          <X size={13} />
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Inline edit-table form ─────────────────────────────────────────────────────

function EditTableRow({
  table,
  zones,
  onClose,
}: {
  table: Table;
  zones: Zone[];
  onClose: () => void;
}) {
  const { mutate, isPending } = useUpdateTable();
  const [number, setNumber] = useState(table.number);
  const [capacity, setCapacity] = useState(table.capacity);
  const [shape, setShape] = useState<TableShape>(table.shape);
  const [zoneId, setZoneId] = useState(table.zone?.id ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      { id: table.id, number: number.trim(), capacity, shape, ...(zoneId ? { zone_id: zoneId } : {}) },
      { onSuccess: onClose },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 py-2 px-3 bg-amber-50 rounded-lg border border-amber-200">
      <input
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        className="w-24 h-7 px-2 text-sm rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-terracotta/40"
      />
      <input
        type="number"
        min={1}
        max={99}
        value={capacity}
        onChange={(e) => setCapacity(Number(e.target.value))}
        className="w-16 h-7 px-2 text-sm rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-terracotta/40"
      />
      <select
        value={shape}
        onChange={(e) => setShape(e.target.value as TableShape)}
        className="h-7 px-1.5 text-sm rounded border border-slate-200 bg-white focus:outline-none"
      >
        {SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select
        value={zoneId}
        onChange={(e) => setZoneId(e.target.value)}
        className="h-7 px-1.5 text-sm rounded border border-slate-200 bg-white focus:outline-none"
      >
        <option value="">— Sans zone —</option>
        {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="h-7 px-2.5 rounded bg-terracotta text-white text-xs font-semibold hover:bg-terracotta/90 disabled:opacity-50 transition-colors"
      >
        <Check size={13} />
      </button>
      <button type="button" onClick={onClose} className="h-7 px-2.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
        <X size={13} />
      </button>
    </form>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────────

function TableRow({
  table,
  zones,
  slug,
}: {
  table: Table;
  zones: Zone[];
  slug: string;
}) {
  const [editing, setEditing] = useState(false);
  const [showQr, setShowQr]   = useState(false);
  const { mutate: deleteTable, isPending: deleting } = useDeleteTable();
  const { mutate: updateTable } = useUpdateTable();

  if (editing) {
    return <EditTableRow table={table} zones={zones} onClose={() => setEditing(false)} />;
  }

  return (
    <>
      <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-colors ${table.is_active ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-800 w-20 truncate">Table {table.number}</span>
          <span className="text-xs text-slate-400">{table.capacity} cvts</span>
          <span className="text-xs text-slate-400">{shapeLabel(table.shape)}</span>
          {table.zone && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{table.zone.name}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => updateTable({ id: table.id, is_active: !table.is_active })}
            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
              table.is_active
                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {table.is_active ? 'Active' : 'Inactive'}
          </button>
          {/* Bouton QR code */}
          <button
            onClick={() => setShowQr(true)}
            title="Générer le QR code"
            className="p-1.5 rounded-md text-slate-400 hover:bg-violet-50 hover:text-violet-500 transition-colors"
          >
            <QrCode size={13} />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => { if (confirm(`Supprimer la table ${table.number} ?`)) deleteTable(table.id); }}
            disabled={deleting}
            className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Modal QR */}
      {showQr && (
        <QrModal table={table} slug={slug} onClose={() => setShowQr(false)} />
      )}
    </>
  );
}

// ── Zone section ───────────────────────────────────────────────────────────────

function ZoneSection({
  zone,
  tables,
  allZones,
  slug,
}: {
  zone: Zone | null;
  tables: Table[];
  allZones: Zone[];
  slug: string;
}) {
  const [adding, setAdding] = useState(false);
  const { mutate: deleteZone, isPending: deletingZone } = useDeleteZone();

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-terracotta" />
          <h2 className="text-sm font-semibold text-slate-700">
            {zone ? zone.name : 'Sans zone'}
          </h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
            {tables.length} table{tables.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {zone && (
            <button
              onClick={() => { if (confirm(`Supprimer la zone "${zone.name}" ?`)) deleteZone(zone.id); }}
              disabled={deletingZone}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs text-terracotta hover:text-terracotta/80 font-medium transition-colors"
          >
            <Plus size={13} />
            Ajouter une table
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {tables.length === 0 && !adding && (
          <p className="text-xs text-slate-400 text-center py-4">Aucune table dans cette zone</p>
        )}
        {tables.map((t) => (
          <TableRow key={t.id} table={t} zones={allZones} slug={slug} />
        ))}
      </div>

      {adding && (
        <AddTableForm {...(zone?.id ? { zoneId: zone.id } : {})} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}

// ── Slug resolver ─────────────────────────────────────────────────────────────
// Lit le slug du tenant depuis l'API auth/me ou depuis les cookies de session.
// Si indisponible on laisse vide — l'URL reste fonctionnelle en relatif.

function useTenantSlug(): string {
  const [slug, setSlug] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: unknown) => {
        const s = d?.data?.tenant?.slug ?? d?.tenant?.slug ?? '';
        if (s) setSlug(s);
      })
      .catch(() => {/* ignore */});
  }, []);

  return slug;
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TablesSettingsPage() {
  const { data: tables = [], isLoading: loadingTables } = useTables();
  const { data: zones = [], isLoading: loadingZones } = useZones();
  const { mutate: createZone, isPending: creatingZone } = useCreateZone();
  const slug = useTenantSlug();

  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneName, setZoneName] = useState('');

  function submitZone(e: React.FormEvent) {
    e.preventDefault();
    if (!zoneName.trim()) return;
    createZone({ name: zoneName.trim() }, {
      onSuccess: () => {
        setZoneName('');
        setShowZoneForm(false);
      },
    });
  }

  const isLoading = loadingTables || loadingZones;

  // Group tables by zone
  const tablesByZone = new Map<string | null, Table[]>();
  tablesByZone.set(null, []);
  for (const zone of zones) tablesByZone.set(zone.id, []);
  for (const table of tables) {
    const key = table.zone?.id ?? null;
    if (!tablesByZone.has(key)) tablesByZone.set(key, []);
    tablesByZone.get(key)!.push(table);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Tables</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configurez les tables de votre salle pour les commandes sur place
          </p>
        </div>
        <button
          onClick={() => setShowZoneForm((v) => !v)}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-200 text-sm text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          <Plus size={15} />
          Nouvelle zone
        </button>
      </div>

      {/* Info QR */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 border border-violet-100">
        <QrCode size={18} className="text-violet-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-violet-800">Commandes par QR code</p>
          <p className="text-xs text-violet-600 mt-0.5">
            Chaque table a son propre QR code. Cliquez sur <QrCode size={11} className="inline mx-0.5" /> pour générer, télécharger ou imprimer le QR code à poser sur la table. Les clients scannent et commandent directement depuis leur téléphone.
          </p>
        </div>
      </div>

      {/* New zone form */}
      {showZoneForm && (
        <form onSubmit={submitZone} className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-sm flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-500 block mb-1">Nom de la zone</label>
            <input
              autoFocus
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="Ex : Salle principale, Terrasse, Bar…"
              className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
          <button
            type="submit"
            disabled={creatingZone || !zoneName.trim()}
            className="h-9 px-4 rounded-lg bg-terracotta text-white text-sm font-semibold disabled:opacity-50 hover:bg-terracotta/90 transition-colors"
          >
            Créer
          </button>
          <button
            type="button"
            onClick={() => setShowZoneForm(false)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
        </form>
      )}

      {/* Zone sections */}
      {zones.map((zone) => (
        <ZoneSection
          key={zone.id}
          zone={zone}
          tables={tablesByZone.get(zone.id) ?? []}
          allZones={zones}
          slug={slug}
        />
      ))}

      {/* Tables without zone */}
      {(tablesByZone.get(null)?.length ?? 0) > 0 || zones.length === 0 ? (
        <ZoneSection
          zone={null}
          tables={tablesByZone.get(null) ?? []}
          allZones={zones}
          slug={slug}
        />
      ) : null}

      {/* Empty state */}
      {tables.length === 0 && zones.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-10 shadow-sm text-center">
          <LayoutGrid size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">Aucune table configurée</p>
          <p className="text-sm text-slate-400 mt-1">
            Créez d&apos;abord une zone (Salle, Terrasse…) puis ajoutez vos tables
          </p>
        </div>
      )}
    </div>
  );
}
