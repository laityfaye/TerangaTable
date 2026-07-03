'use client';

import { useEffect, useState } from 'react';
import { Save, Clock, Calendar, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useZones, useTables, useDeleteTable, useDeleteZone } from '@/hooks/reservations/use-tables';
import { useSettings, useUpdateSettings } from '@/hooks/settings/use-settings';

// ── Slider component ──────────────────────────────────────────────────────────

function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  const display = formatValue ? formatValue(value) : `${value}${unit ?? ''}`;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-terracotta">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-terracotta"
      />
      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
        <span>{formatValue ? formatValue(min) : `${min}${unit ?? ''}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${unit ?? ''}`}</span>
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)} className="flex-shrink-0">
      {enabled
        ? <ToggleRight size={28} className="text-terracotta" />
        : <ToggleLeft size={28} className="text-slate-300" />}
    </button>
  );
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReservationsSettingsPage() {
  const { data: settingsData, isLoading: loadingSettings } = useSettings();
  const { mutate: saveSettings, isPending: saving } = useUpdateSettings();

  // Reservation rules state
  const [defaultDuration, setDefaultDuration] = useState(90);
  const [openHour, setOpenHour] = useState(11);
  const [closeHour, setCloseHour] = useState(23);
  const [slotStep, setSlotStep] = useState(30);
  const [minAdvanceHours, setMinAdvanceHours] = useState(2);
  const [freeCancelHours, setFreeCancelHours] = useState(24);
  const [maxCapacityPct, setMaxCapacityPct] = useState(80);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const g = settingsData?.grouped['reservations'];
    if (!g) return;
    if (typeof g['default_duration_minutes'] === 'number') setDefaultDuration(g['default_duration_minutes']);
    if (typeof g['open_hour'] === 'number') setOpenHour(g['open_hour']);
    if (typeof g['close_hour'] === 'number') setCloseHour(g['close_hour']);
    if (typeof g['slot_step_minutes'] === 'number') setSlotStep(g['slot_step_minutes']);
    if (typeof g['min_advance_hours'] === 'number') setMinAdvanceHours(g['min_advance_hours']);
    if (typeof g['free_cancel_hours'] === 'number') setFreeCancelHours(g['free_cancel_hours']);
    if (typeof g['max_capacity_pct'] === 'number') setMaxCapacityPct(g['max_capacity_pct']);
    if (typeof g['auto_confirm'] === 'boolean') setAutoConfirm(g['auto_confirm']);
  }, [settingsData]);

  const { data: zones = [] } = useZones();
  const { data: tables = [] } = useTables();
  const { mutate: deleteTable } = useDeleteTable();
  const { mutate: deleteZone } = useDeleteZone();

  function handleSave() {
    saveSettings(
      [
        { key: 'default_duration_minutes', value: defaultDuration, category: 'reservations' },
        { key: 'open_hour', value: openHour, category: 'reservations' },
        { key: 'close_hour', value: closeHour, category: 'reservations' },
        { key: 'slot_step_minutes', value: slotStep, category: 'reservations' },
        { key: 'min_advance_hours', value: minAdvanceHours, category: 'reservations' },
        { key: 'free_cancel_hours', value: freeCancelHours, category: 'reservations' },
        { key: 'max_capacity_pct', value: maxCapacityPct, category: 'reservations' },
        { key: 'auto_confirm', value: autoConfirm, category: 'reservations' },
      ],
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Paramètres réservations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Règles et configuration du module</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loadingSettings}
          className={`flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-terracotta text-white hover:bg-terracotta-dark'
          }`}
        >
          <Save size={15} />
          {saved ? 'Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Section: Durée et créneaux */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Clock size={16} className="text-terracotta" />
          Durée &amp; Créneaux
        </h2>

        <LabeledSlider
          label="Durée par défaut"
          value={defaultDuration}
          min={30}
          max={240}
          step={15}
          onChange={setDefaultDuration}
          formatValue={formatDuration}
        />

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Heure d&apos;ouverture</label>
            <select
              value={openHour}
              onChange={(e) => setOpenHour(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta"
            >
              {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Heure de fermeture</label>
            <select
              value={closeHour}
              onChange={(e) => setCloseHour(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-terracotta"
            >
              {Array.from({ length: 12 }, (_, i) => i + 16).map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Pas entre créneaux : <strong className="text-terracotta">{slotStep} min</strong>
          </label>
          <div className="flex gap-2">
            {[15, 30, 60].map((s) => (
              <button
                key={s}
                onClick={() => setSlotStep(s)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  slotStep === s
                    ? 'border-terracotta bg-terracotta/5 text-terracotta'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {s} min
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Délais */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Calendar size={16} className="text-terracotta" />
          Délais &amp; Annulations
        </h2>

        <LabeledSlider
          label="Délai minimum avant réservation"
          value={minAdvanceHours}
          min={0}
          max={48}
          step={1}
          unit="h"
          onChange={setMinAdvanceHours}
          formatValue={(v) => v === 0 ? 'Aucun' : `${v}h`}
        />

        <LabeledSlider
          label="Délai annulation gratuite"
          value={freeCancelHours}
          min={0}
          max={72}
          step={1}
          unit="h"
          onChange={setFreeCancelHours}
          formatValue={(v) => v === 0 ? 'Aucun' : `${v}h avant`}
        />
      </section>

      {/* Section: Capacité */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-terracotta" />
          Capacité &amp; Confirmation
        </h2>

        <LabeledSlider
          label="Capacité max par créneau (% des tables)"
          value={maxCapacityPct}
          min={10}
          max={100}
          step={5}
          unit="%"
          onChange={setMaxCapacityPct}
        />

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-slate-700">Confirmation automatique</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Les réservations passent automatiquement en &quot;Confirmée&quot; à la création
            </p>
          </div>
          <Toggle enabled={autoConfirm} onChange={setAutoConfirm} />
        </div>
      </section>

      {/* Section: Gestion zones & tables */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Zones &amp; Tables</h2>
        <p className="text-xs text-slate-400">
          Pour déplacer les tables, utilisez le{' '}
          <a href="/dashboard/reservations/floor-plan" className="text-terracotta underline">plan de salle</a>.
        </p>

        {zones.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune zone configurée.</p>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => {
              const zoneTables = tables.filter((t) => t.zone?.id === zone.id);
              return (
                <div key={zone.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{zone.name}</p>
                      <p className="text-xs text-slate-400">{zoneTables.length} table{zoneTables.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => deleteZone(zone.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                  {zoneTables.length > 0 && (
                    <div className="divide-y divide-slate-50">
                      {zoneTables.map((t) => (
                        <div key={t.id} className="flex items-center justify-between px-4 py-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">Table {t.number}</span>
                            <span className="text-xs text-slate-400">{t.capacity} pers. · {t.shape}</span>
                            {!t.is_active && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                Inactif
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTable(t.id)}
                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
