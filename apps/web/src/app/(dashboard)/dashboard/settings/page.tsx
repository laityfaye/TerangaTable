'use client';

import { useState, useCallback } from 'react';
import {
  Save,
  Loader2,
  Store,
  ShoppingCart,
  CreditCard,
  Bell,
  Users,
  Puzzle,
  Receipt,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  ExternalLink,
  LocateFixed,
} from 'lucide-react';
import Link from 'next/link';
import { useSettings, useUpdateSettings } from '@/hooks/settings/use-settings';
import { apiClient } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OpeningHourDay {
  open: string;
  close: string;
  closed: boolean;
}

type OpeningHours = Record<string, OpeningHourDay>;

const DEFAULT_HOURS: OpeningHourDay = { open: '08:00', close: '22:00', closed: false };

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

const ORDER_TYPES = [
  { key: 'dine_in', label: 'Sur place' },
  { key: 'takeaway', label: 'À emporter' },
  { key: 'delivery', label: 'Livraison' },
  { key: 'online', label: 'En ligne' },
];

interface TenantModule {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  required_plan: string;
  is_active: boolean;
}

// ── Shared UI primitives ───────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-terracotta' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F5F4F2] last:border-0">
      <span className="text-sm text-[#1C1917]">{label}</span>
      <div className="ml-4 flex-shrink-0">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-8 px-2.5 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:border-terracotta/50 focus:ring-1 focus:ring-terracotta/20 transition-colors ${className}`}
    />
  );
}

function SaveButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-terracotta text-white rounded-lg text-sm font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-60"
    >
      {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
      Enregistrer
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] p-5">{children}</div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[#1C1917] mb-4">{children}</h3>
  );
}

// ── Tab: Général ───────────────────────────────────────────────────────────────

function GeneralTab({
  grouped,
}: {
  grouped: Record<string, Record<string, unknown>>;
}) {
  const g = grouped['general'] ?? {};
  const { mutate: save, isPending } = useUpdateSettings();

  const [name, setName] = useState(String(g['restaurant_name'] ?? ''));
  const [phone, setPhone] = useState(String(g['restaurant_phone'] ?? ''));
  const [address, setAddress] = useState(String(g['restaurant_address'] ?? ''));
  const [city, setCity] = useState(String(g['restaurant_city'] ?? ''));
  const [country, setCountry] = useState(String(g['restaurant_country'] ?? ''));
  const [lat, setLat] = useState(String(g['restaurant_lat'] ?? ''));
  const [lng, setLng] = useState(String(g['restaurant_lng'] ?? ''));
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par ce navigateur.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Permission refusée. Autorisez la localisation dans les paramètres du navigateur.');
        } else {
          setGeoError('Impossible de récupérer la position.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  const [timezone, setTimezone] = useState(String(g['timezone'] ?? 'Africa/Dakar'));
  const [language, setLanguage] = useState(String(g['language'] ?? 'fr'));
  const [currency, setCurrency] = useState(String(g['currency'] ?? 'XOF'));
  const [hours, setHours] = useState<OpeningHours>(() => {
    const raw = g['opening_hours'];
    const base: OpeningHours = {};
    DAYS.forEach(({ key }) => {
      base[key] =
        raw && typeof raw === 'object' && (raw as OpeningHours)[key]
          ? (raw as OpeningHours)[key]
          : { ...DEFAULT_HOURS };
    });
    return base;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save([
      { key: 'restaurant_name', value: name, category: 'general' },
      { key: 'restaurant_phone', value: phone, category: 'general' },
      { key: 'restaurant_address', value: address, category: 'general' },
      { key: 'restaurant_city', value: city, category: 'general' },
      { key: 'restaurant_country', value: country, category: 'general' },
      { key: 'timezone', value: timezone, category: 'general' },
      { key: 'language', value: language, category: 'general' },
      { key: 'currency', value: currency, category: 'general' },
      { key: 'opening_hours', value: hours, category: 'general' },
      ...(lat ? [{ key: 'restaurant_lat', value: parseFloat(lat), category: 'general' }] : []),
      ...(lng ? [{ key: 'restaurant_lng', value: parseFloat(lng), category: 'general' }] : []),
    ]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <SectionTitle>Informations du restaurant</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nom du restaurant', value: name, set: setName },
            { label: 'Téléphone', value: phone, set: setPhone },
            { label: 'Adresse', value: address, set: setAddress },
            { label: 'Ville', value: city, set: setCity },
            { label: 'Pays', value: country, set: setCountry },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
              <Input value={value} onChange={set} className="w-full" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500">
              Coordonnées GPS <span className="text-slate-400 font-normal">(pour la carte marketplace)</span>
            </p>
            <button
              type="button"
              onClick={detectLocation}
              disabled={geoLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-terracotta hover:text-terracotta/80 disabled:opacity-50 transition-colors"
            >
              {geoLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <LocateFixed className="w-3.5 h-3.5" />
              }
              {geoLoading ? 'Localisation…' : 'Utiliser ma position'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Latitude</label>
              <Input
                value={lat}
                onChange={setLat}
                className="w-full"
                placeholder="ex: 14.7924"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Longitude</label>
              <Input
                value={lng}
                onChange={setLng}
                className="w-full"
                placeholder="ex: -16.9261"
              />
            </div>
          </div>
          {geoError && (
            <p className="text-[11px] text-red-500 mt-1.5">{geoError}</p>
          )}
          {!geoError && (
            <p className="text-[11px] text-slate-400 mt-1.5">
              Ou trouvez vos coordonnées sur{' '}
              <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">
                openstreetmap.org
              </a>
              {' '}(clic droit → &quot;Afficher l&apos;adresse&quot;)
            </p>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>Localisation</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-8 px-2.5 w-full rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:border-terracotta/50"
            >
              <option value="Africa/Dakar">Africa/Dakar (UTC+0)</option>
              <option value="Africa/Abidjan">Africa/Abidjan (UTC+0)</option>
              <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (UTC+3)</option>
              <option value="Europe/Paris">Europe/Paris (UTC+1/2)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Langue</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-8 px-2.5 w-full rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:border-terracotta/50"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="wo">Wolof</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-8 px-2.5 w-full rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:border-terracotta/50"
            >
              <option value="XOF">XOF (FCFA)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GHS">GHS (₵)</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Horaires d&apos;ouverture</SectionTitle>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-24 flex items-center gap-2">
                <Toggle
                  checked={!hours[key]?.closed}
                  onChange={(open) =>
                    setHours((prev) => ({
                      ...prev,
                      [key]: { ...(prev[key] ?? DEFAULT_HOURS), closed: !open },
                    }))
                  }
                />
                <span
                  className={`text-sm ${hours[key]?.closed ? 'text-slate-400' : 'text-[#1C1917]'}`}
                >
                  {label}
                </span>
              </div>
              {hours[key]?.closed ? (
                <span className="text-xs text-slate-400 italic ml-4">Fermé</span>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hours[key]?.open ?? '08:00'}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        [key]: { ...(prev[key] ?? DEFAULT_HOURS), open: e.target.value },
                      }))
                    }
                    className="h-7 px-2 rounded border border-[#E7E5E4] text-sm focus:outline-none focus:border-terracotta/50"
                  />
                  <span className="text-slate-400 text-xs">→</span>
                  <input
                    type="time"
                    value={hours[key]?.close ?? '22:00'}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        [key]: { ...(prev[key] ?? DEFAULT_HOURS), close: e.target.value },
                      }))
                    }
                    className="h-7 px-2 rounded border border-[#E7E5E4] text-sm focus:outline-none focus:border-terracotta/50"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} />
      </div>
    </form>
  );
}

// ── Tab: Commandes ─────────────────────────────────────────────────────────────

function OrdersTab({ grouped }: { grouped: Record<string, Record<string, unknown>> }) {
  const g = grouped['orders'] ?? {};
  const { mutate: save, isPending } = useUpdateSettings();

  const [autoAccept, setAutoAccept] = useState<boolean>(Boolean(g['auto_accept_orders'] ?? false));
  const [prepTime, setPrepTime] = useState<number>(Number(g['estimated_prep_time'] ?? 20));
  const [prefix, setPrefix] = useState<string>(String(g['order_number_prefix'] ?? ''));
  const [acceptedTypes, setAcceptedTypes] = useState<string[]>(() => {
    const raw = g['accepted_order_types'];
    if (Array.isArray(raw)) return raw as string[];
    return ['dine_in', 'takeaway'];
  });

  function toggleType(key: string) {
    setAcceptedTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save([
      { key: 'auto_accept_orders', value: autoAccept, category: 'orders' },
      { key: 'estimated_prep_time', value: prepTime, category: 'orders' },
      { key: 'order_number_prefix', value: prefix, category: 'orders' },
      { key: 'accepted_order_types', value: acceptedTypes, category: 'orders' },
    ]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <SectionTitle>Acceptation des commandes</SectionTitle>
        <FieldRow label="Auto-accepter les nouvelles commandes">
          <Toggle checked={autoAccept} onChange={setAutoAccept} />
        </FieldRow>
        <div className="py-3 border-b border-[#F5F4F2]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#1C1917]">Délai de préparation estimé</span>
            <span className="text-sm font-semibold text-terracotta">{prepTime} min</span>
          </div>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={prepTime}
            onChange={(e) => setPrepTime(Number(e.target.value))}
            className="w-full accent-terracotta"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>5 min</span>
            <span>120 min</span>
          </div>
        </div>
        <div className="py-3">
          <p className="text-sm text-[#1C1917] mb-3">Types de commandes acceptés</p>
          <div className="flex flex-wrap gap-2">
            {ORDER_TYPES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleType(key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  acceptedTypes.includes(key)
                    ? 'bg-terracotta/10 border-terracotta text-terracotta'
                    : 'border-[#E7E5E4] text-slate-500 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Numérotation des commandes</SectionTitle>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Préfixe (optionnel)
            </label>
            <Input
              value={prefix}
              onChange={setPrefix}
              placeholder="ex: PIZZA-"
              className="w-full"
            />
          </div>
          <div className="pt-5">
            <span className="text-sm text-slate-400">→ ex: {prefix || 'CMD-'}001</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} />
      </div>
    </form>
  );
}

// ── Tab: Paiements ─────────────────────────────────────────────────────────────

function PaymentsTab({ grouped }: { grouped: Record<string, Record<string, unknown>> }) {
  const g = grouped['payments'] ?? {};
  const { mutate: save, isPending } = useUpdateSettings();

  const rawMethods = (g['payment_methods'] as Record<string, boolean>) ?? {};
  const [methods, setMethods] = useState({
    cash: rawMethods['cash'] ?? true,
    wave: rawMethods['wave'] ?? false,
    orange_money: rawMethods['orange_money'] ?? false,
    card: rawMethods['card'] ?? false,
  });
  const [taxRate, setTaxRate] = useState<number>(Number(g['tax_rate'] ?? 0));
  const [taxIncluded, setTaxIncluded] = useState<boolean>(Boolean(g['tax_included'] ?? true));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save([
      { key: 'payment_methods', value: methods, category: 'payments' },
      { key: 'tax_rate', value: taxRate, category: 'payments' },
      { key: 'tax_included', value: taxIncluded, category: 'payments' },
    ]);
  }

  const METHOD_LABELS = [
    { key: 'cash' as const, label: 'Espèces', icon: '💵' },
    { key: 'wave' as const, label: 'Wave', icon: '🌊' },
    { key: 'orange_money' as const, label: 'Orange Money', icon: '🟠' },
    { key: 'card' as const, label: 'Carte bancaire', icon: '💳' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <SectionTitle>Méthodes de paiement acceptées</SectionTitle>
        <div className="space-y-1">
          {METHOD_LABELS.map(({ key, label, icon }) => (
            <FieldRow key={key} label={`${icon} ${label}`}>
              <Toggle
                checked={methods[key]}
                onChange={(v) => setMethods((m) => ({ ...m, [key]: v }))}
              />
            </FieldRow>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>TVA</SectionTitle>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#1C1917]">Taux de TVA</span>
              <span className="text-sm font-semibold text-terracotta">{taxRate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={0.5}
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-full accent-terracotta"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0%</span>
              <span>25%</span>
            </div>
          </div>
          <FieldRow label="TVA incluse dans les prix">
            <Toggle checked={taxIncluded} onChange={setTaxIncluded} />
          </FieldRow>
          {!taxIncluded && taxRate > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              La TVA de {taxRate}% sera ajoutée au total au moment du paiement.
            </p>
          )}
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} />
      </div>
    </form>
  );
}

// ── Tab: Notifications ─────────────────────────────────────────────────────────

function NotificationsTab({ grouped }: { grouped: Record<string, Record<string, unknown>> }) {
  const g = grouped['notifications'] ?? {};
  const { mutate: save, isPending } = useUpdateSettings();

  const [orderSound, setOrderSound] = useState<boolean>(Boolean(g['new_order_sound'] ?? true));
  const [alertMinutes, setAlertMinutes] = useState<number>(
    Number(g['pending_order_alert_minutes'] ?? 15),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save([
      { key: 'new_order_sound', value: orderSound, category: 'notifications' },
      { key: 'pending_order_alert_minutes', value: alertMinutes, category: 'notifications' },
    ]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <SectionTitle>Alertes commandes</SectionTitle>
        <FieldRow label="Son pour nouvelle commande">
          <div className="flex items-center gap-2">
            {orderSound ? (
              <Volume2 size={15} className="text-terracotta" />
            ) : (
              <VolumeX size={15} className="text-slate-400" />
            )}
            <Toggle checked={orderSound} onChange={setOrderSound} />
          </div>
        </FieldRow>
        <div className="py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#1C1917]">
              Alerte si commande en attente depuis plus de
            </span>
            <span className="text-sm font-semibold text-terracotta">{alertMinutes} min</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={alertMinutes}
            onChange={(e) => setAlertMinutes(Number(e.target.value))}
            className="w-full accent-terracotta"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>5 min</span>
            <span>60 min</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} />
      </div>
    </form>
  );
}

// ── Tab: Modules ───────────────────────────────────────────────────────────────

function ModulesTab() {
  const qc = useQueryClient();
  const { data: modules, isLoading } = useQuery<TenantModule[]>({
    queryKey: ['settings', 'modules'],
    queryFn: async () => {
      const { data } = await apiClient.get<TenantModule[]>('/settings/modules');
      return data;
    },
  });

  const { mutate: activate, isPending: activating } = useMutation({
    mutationFn: (moduleId: string) =>
      apiClient.post(`/settings/modules/${moduleId}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'modules'] }),
  });

  const { mutate: deactivate, isPending: deactivating } = useMutation({
    mutationFn: (moduleId: string) =>
      apiClient.post(`/settings/modules/${moduleId}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'modules'] }),
  });

  const isBusy = activating || deactivating;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!modules?.length) {
    return (
      <Card>
        <div className="text-center py-10 text-slate-400">
          <Puzzle size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucun module disponible</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {modules.map((mod) => (
        <div
          key={mod.id}
          className={`bg-white rounded-xl border p-4 flex flex-col gap-3 ${
            mod.is_active ? 'border-terracotta/30' : 'border-[#E7E5E4]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {mod.is_active ? (
                <CheckCircle size={18} className="text-terracotta flex-shrink-0" />
              ) : (
                <XCircle size={18} className="text-slate-300 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">{mod.name}</p>
                {mod.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 capitalize">
              Plan requis: {mod.required_plan}
            </span>
            {mod.is_active ? (
              <button
                type="button"
                onClick={() => deactivate(mod.id)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E7E5E4] text-slate-600 hover:bg-[#F5F4F2] transition-colors disabled:opacity-50"
              >
                Désactiver
              </button>
            ) : (
              <button
                type="button"
                onClick={() => activate(mod.id)}
                disabled={isBusy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-terracotta text-white hover:bg-terracotta/90 transition-colors disabled:opacity-50"
              >
                Activer
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Facturation ───────────────────────────────────────────────────────────

function BillingTab() {
  return (
    <Card>
      <div className="flex flex-col items-center py-10 text-slate-400 gap-3">
        <Receipt size={32} className="opacity-30" />
        <p className="text-sm font-medium text-[#1C1917]">Gestion de la facturation</p>
        <p className="text-xs text-center max-w-xs">
          L&apos;espace de facturation sera disponible prochainement. Contactez-nous pour toute
          question sur votre abonnement.
        </p>
        <a
          href="mailto:support@terangatable.com"
          className="mt-2 text-xs text-terracotta hover:underline"
        >
          support@terangatable.com
        </a>
      </div>
    </Card>
  );
}

// ── Tab definitions ────────────────────────────────────────────────────────────

const TABS = [
  { key: 'general', label: 'Général', icon: <Store size={15} /> },
  { key: 'orders', label: 'Commandes', icon: <ShoppingCart size={15} /> },
  { key: 'payments', label: 'Paiements', icon: <CreditCard size={15} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { key: 'team', label: 'Équipe', icon: <Users size={15} /> },
  { key: 'modules', label: 'Modules', icon: <Puzzle size={15} /> },
  { key: 'billing', label: 'Facturation', icon: <Receipt size={15} /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const { data, isLoading } = useSettings();

  const grouped = data?.grouped ?? {};

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab grouped={grouped} />;
      case 'orders':
        return <OrdersTab grouped={grouped} />;
      case 'payments':
        return <PaymentsTab grouped={grouped} />;
      case 'notifications':
        return <NotificationsTab grouped={grouped} />;
      case 'team':
        return (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1C1917]">Gestion de l&apos;équipe</p>
                <p className="text-xs text-slate-500 mt-1">
                  Invitez des membres, gérez les rôles et les accès.
                </p>
              </div>
              <Link
                href="/dashboard/settings/team"
                className="flex items-center gap-1.5 px-4 py-2 bg-terracotta text-white rounded-lg text-sm font-medium hover:bg-terracotta/90 transition-colors"
              >
                Gérer l&apos;équipe
                <ExternalLink size={13} />
              </Link>
            </div>
          </Card>
        );
      case 'modules':
        return <ModulesTab />;
      case 'billing':
        return <BillingTab />;
    }
  }, [activeTab, grouped]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-heading font-bold text-[#1C1917]">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configurez votre restaurant</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto pb-px border-b border-[#E7E5E4]">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-slate-500 hover:text-[#1C1917]'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        renderTab()
      )}
    </div>
  );
}
