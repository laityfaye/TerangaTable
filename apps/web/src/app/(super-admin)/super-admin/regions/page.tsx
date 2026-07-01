'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, UserCheck, UserCog, UserMinus, ExternalLink } from 'lucide-react';
import { useRegions, useToggleRegion, useCreateRegion, useAssignAdmin, useAdmins, type Region } from '@/hooks/use-super-admin';

// ── Mock data (seed data from REGIONS.md) ─────────────────────────────────────

const MOCK_REGIONS: Region[] = [
  {
    id: '1',
    name: 'Dakar',
    slug: 'dakar',
    country_code: 'SN',
    country_name: 'Sénégal',
    platform_label: 'TérangaTable Dakar',
    timezone: 'Africa/Dakar',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    locale: 'fr-SN',
    phone_prefix: '+221',
    is_active: true,
    tenants_count: 34,
    pending_requests_count: 4,
    regional_admin: null,
  },
  {
    id: '2',
    name: 'Thiès',
    slug: 'thies',
    country_code: 'SN',
    country_name: 'Sénégal',
    platform_label: 'TérangaTable Thiès',
    timezone: 'Africa/Dakar',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    locale: 'fr-SN',
    phone_prefix: '+221',
    is_active: true,
    tenants_count: 12,
    pending_requests_count: 1,
    regional_admin: null,
  },
  {
    id: '3',
    name: 'Saint-Louis',
    slug: 'saint-louis',
    country_code: 'SN',
    country_name: 'Sénégal',
    platform_label: 'TérangaTable Saint-Louis',
    timezone: 'Africa/Dakar',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    locale: 'fr-SN',
    phone_prefix: '+221',
    is_active: true,
    tenants_count: 8,
    pending_requests_count: 0,
    regional_admin: null,
  },
  {
    id: '4',
    name: 'Abidjan',
    slug: 'abidjan',
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    platform_label: "TérangaTable Abidjan",
    timezone: 'Africa/Abidjan',
    currency_code: 'XOF',
    currency_symbol: 'F CFA',
    locale: 'fr-CI',
    phone_prefix: '+225',
    is_active: true,
    tenants_count: 18,
    pending_requests_count: 2,
    regional_admin: null,
  },
  {
    id: '5',
    name: 'Casablanca',
    slug: 'casablanca',
    country_code: 'MA',
    country_name: 'Maroc',
    platform_label: 'TérangaTable Casablanca',
    timezone: 'Africa/Casablanca',
    currency_code: 'MAD',
    currency_symbol: 'DH',
    locale: 'fr-MA',
    phone_prefix: '+212',
    is_active: true,
    tenants_count: 11,
    pending_requests_count: 1,
    regional_admin: null,
  },
  {
    id: '6',
    name: 'Paris',
    slug: 'paris',
    country_code: 'FR',
    country_name: 'France',
    platform_label: 'TérangaTable Paris',
    timezone: 'Europe/Paris',
    currency_code: 'EUR',
    currency_symbol: '€',
    locale: 'fr-FR',
    phone_prefix: '+33',
    is_active: false,
    tenants_count: 0,
    pending_requests_count: 0,
    regional_admin: null,
  },
];

const FLAG: Record<string, string> = {
  SN: '🇸🇳',
  CI: '🇨🇮',
  MA: '🇲🇦',
  FR: '🇫🇷',
};

// ── Create region modal ────────────────────────────────────────────────────────

type RegionFormData = {
  name: string;
  slug: string;
  country_code: string;
  country_name: string;
  platform_label: string;
  timezone: string;
  currency_code: string;
  currency_symbol: string;
  locale: string;
  phone_prefix: string;
};

const EMPTY_FORM: RegionFormData = {
  name: '',
  slug: '',
  country_code: '',
  country_name: '',
  platform_label: '',
  timezone: '',
  currency_code: '',
  currency_symbol: '',
  locale: '',
  phone_prefix: '',
};

function CreateRegionModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (data: RegionFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<RegionFormData>(EMPTY_FORM);

  const set = (k: keyof RegionFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      platform_label: name ? `TérangaTable ${name}` : '',
    }));
  };

  const valid =
    form.name && form.slug && form.country_code && form.currency_code && form.timezone;

  const fields: { key: keyof RegionFormData; label: string; placeholder: string }[] = [
    { key: 'name', label: 'Nom', placeholder: 'ex: Lagos' },
    { key: 'slug', label: 'Slug', placeholder: 'ex: lagos' },
    { key: 'country_code', label: 'Code pays (ISO)', placeholder: 'ex: NG' },
    { key: 'country_name', label: 'Nom du pays', placeholder: 'ex: Nigeria' },
    { key: 'platform_label', label: 'Label plateforme', placeholder: 'ex: TérangaTable Lagos' },
    { key: 'timezone', label: 'Fuseau horaire', placeholder: 'ex: Africa/Lagos' },
    { key: 'currency_code', label: 'Code devise', placeholder: 'ex: NGN' },
    { key: 'currency_symbol', label: 'Symbole devise', placeholder: 'ex: ₦' },
    { key: 'locale', label: 'Locale', placeholder: 'ex: fr-NG' },
    { key: 'phone_prefix', label: 'Indicatif', placeholder: 'ex: +234' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-heading font-bold text-white">Nouvelle région</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ key, label, placeholder }) => (
              <div key={key} className={key === 'name' ? 'col-span-2' : ''}>
                <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={key === 'name' ? handleNameChange : set(key)}
                  placeholder={placeholder}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-5 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => valid && onSubmit(form)}
            disabled={!valid || loading}
            className="flex-1 h-10 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer la région'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign admin modal ────────────────────────────────────────────────────────

function AssignAdminModal({
  region,
  onClose,
  onAssign,
  loading,
}: {
  region: Region;
  onClose: () => void;
  onAssign: (userId: string | null) => void;
  loading: boolean;
}) {
  const { data: admins = [] } = useAdmins();
  const [selected, setSelected] = useState<string | null>(region.regional_admin?.id ?? null);

  const platformAdmins = admins.filter((a) => a.is_active);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-white">Admin régional</h3>
            <p className="text-xs text-slate-500 mt-0.5">{region.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-72 overflow-y-auto space-y-1.5">
          {/* Option retirer l'admin */}
          <label
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              selected === null ? 'bg-slate-700/80 border border-white/20' : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <input
              type="radio"
              name="admin-select"
              className="sr-only"
              checked={selected === null}
              onChange={() => setSelected(null)}
            />
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <UserMinus size={14} className="text-slate-400" />
            </div>
            <span className="text-sm text-slate-400 italic">Aucun admin (retirer)</span>
          </label>

          {platformAdmins.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-4">Aucun admin plateforme disponible.</p>
          )}

          {platformAdmins.map((a) => (
            <label
              key={a.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                selected === a.id ? 'bg-violet-500/20 border border-violet-500/40' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <input
                type="radio"
                name="admin-select"
                className="sr-only"
                checked={selected === a.id}
                onChange={() => setSelected(a.id)}
              />
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-violet-300">
                {a.first_name[0]}{a.last_name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-200 font-medium">
                  {a.first_name} {a.last_name}
                </p>
                <p className="text-xs text-slate-500 truncate">{a.email}</p>
              </div>
              {a.region_name && (
                <span className="ml-auto text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded flex-shrink-0">
                  {a.region_name}
                </span>
              )}
            </label>
          ))}
        </div>

        <div className="px-6 py-5 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => onAssign(selected)}
            disabled={loading}
            className="flex-1 h-10 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Region card ────────────────────────────────────────────────────────────────

function RegionCard({
  region,
  onToggle,
  onAssign,
  loading,
}: {
  region: Region;
  onToggle: (r: Region) => void;
  onAssign: (r: Region) => void;
  loading: boolean;
}) {
  return (
    <div
      className={`bg-slate-800/60 border rounded-xl p-5 flex flex-col gap-4 transition-opacity ${
        region.is_active ? 'border-white/10' : 'border-white/5 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{FLAG[region.country_code] ?? '🌍'}</span>
          <div>
            <h3 className="font-heading font-bold text-white">{region.name}</h3>
            <p className="text-xs text-slate-500">{region.country_name}</p>
          </div>
        </div>
        {/* Toggle switch */}
        <button
          onClick={() => onToggle(region)}
          disabled={loading}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${
            region.is_active ? 'bg-violet-600' : 'bg-slate-700'
          }`}
          title={region.is_active ? 'Désactiver les inscriptions' : 'Activer les inscriptions'}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              region.is_active ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">Tenants</p>
          <p className="font-semibold text-white">{region.tenants_count ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">En attente</p>
          <p className="font-semibold text-white">
            {region.pending_requests_count ?? 0}
            {(region.pending_requests_count ?? 0) > 0 && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 align-middle" />
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Devise</p>
          <p className="font-semibold text-white">
            {region.currency_symbol} ({region.currency_code})
          </p>
        </div>
      </div>

      {/* Admin régional */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <UserCheck size={13} className="text-slate-500 flex-shrink-0" />
          {region.regional_admin ? (
            <p className="text-sm text-slate-300 truncate">
              {region.regional_admin.first_name} {region.regional_admin.last_name}
            </p>
          ) : (
            <p className="text-sm text-slate-500 italic">Aucun admin régional</p>
          )}
        </div>
        <button
          onClick={() => onAssign(region)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors flex-shrink-0"
          title="Assigner un admin régional"
        >
          <UserCog size={12} />
          {region.regional_admin ? 'Changer' : 'Assigner'}
        </button>
      </div>

      {/* Footer : status + lien public */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
            region.is_active
              ? 'bg-green-500/20 text-green-400'
              : 'bg-slate-700 text-slate-400'
          }`}
        >
          {region.is_active ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
        </span>
        <a
          href={`https://terangatable.cloud/decouvrir/${region.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-green-400 transition-colors"
          title="Voir la page de découverte"
        >
          <ExternalLink size={11} />
          Voir la page
        </a>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RegionsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Region | null>(null);

  const { data: apiData } = useRegions();
  const toggleMutation = useToggleRegion();
  const createMutation = useCreateRegion();
  const assignMutation = useAssignAdmin();

  const regions = apiData ?? MOCK_REGIONS;

  async function handleToggle(region: Region) {
    try {
      await toggleMutation.mutateAsync({ id: region.id, is_active: !region.is_active });
      toast.success(
        region.is_active
          ? `Inscriptions fermées pour ${region.name}.`
          : `Inscriptions ouvertes pour ${region.name}.`,
      );
    } catch {
      toast.error('Erreur lors de la modification');
    }
  }

  async function handleCreate(data: RegionFormData) {
    try {
      await createMutation.mutateAsync({ ...data, is_active: true });
      toast.success(`Région ${data.name} créée.`);
      setShowCreate(false);
    } catch {
      toast.error('Erreur lors de la création');
    }
  }

  async function handleAssign(userId: string | null) {
    if (!assignTarget) return;
    try {
      await assignMutation.mutateAsync({ regionId: assignTarget.id, userId });
      toast.success(
        userId
          ? `Admin assigné à ${assignTarget.name}.`
          : `Admin retiré de ${assignTarget.name}.`,
      );
      setAssignTarget(null);
    } catch {
      toast.error("Erreur lors de l'assignation");
    }
  }

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Régions</h1>
          <p className="mt-1 text-sm text-slate-400">
            {regions.length} région(s) configurée(s).
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Nouvelle région
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {regions.map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            onToggle={(r) => void handleToggle(r)}
            onAssign={(r) => setAssignTarget(r)}
            loading={toggleMutation.isPending}
          />
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateRegionModal
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => void handleCreate(data)}
          loading={createMutation.isPending}
        />
      )}

      {/* Assign admin modal */}
      {assignTarget && (
        <AssignAdminModal
          region={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssign={(userId) => void handleAssign(userId)}
          loading={assignMutation.isPending}
        />
      )}
    </div>
  );
}
