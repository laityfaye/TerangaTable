'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  ChevronDown,
  ExternalLink,
  Power,
  PowerOff,
  Trash2,
  X,
  Building2,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useTenants, useToggleTenant, useDeleteTenant, usePurgeTenant, type Tenant } from '@/hooks/use-super-admin';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_TENANTS: Tenant[] = [
  {
    id: '1',
    name: 'Le Teranga',
    slug: 'le-teranga',
    region_id: 'dakar',
    region_name: 'Dakar',
    plan: 'growth',
    status: 'active',
    created_at: '2026-04-01T00:00:00Z',
    orders_total: 342,
    revenue_total: 2850000,
    users: [
      { id: 'u1', email: 'moussa@teranga.sn', first_name: 'Moussa', last_name: 'Diop' },
      { id: 'u2', email: 'manager@teranga.sn', first_name: 'Awa', last_name: 'Fall' },
    ],
    modules: ['menu', 'orders', 'reservations', 'payments', 'analytics'],
  },
  {
    id: '2',
    name: "Saveurs d'Abidjan",
    slug: 'saveurs-abidjan',
    region_id: 'abidjan',
    region_name: 'Abidjan',
    plan: 'starter',
    status: 'trial',
    created_at: '2026-04-15T00:00:00Z',
    orders_total: 58,
    revenue_total: 425000,
    users: [{ id: 'u3', email: 'kofi@saveurs.ci', first_name: 'Kofi', last_name: 'Asante' }],
    modules: ['menu', 'orders', 'delivery'],
  },
  {
    id: '3',
    name: 'Délices Casablanca',
    slug: 'delices-casablanca',
    region_id: 'casablanca',
    region_name: 'Casablanca',
    plan: 'enterprise',
    status: 'active',
    created_at: '2026-03-10T00:00:00Z',
    orders_total: 891,
    revenue_total: 7200000,
    users: [
      { id: 'u4', email: 'rachid@delices.ma', first_name: 'Rachid', last_name: 'Benali' },
      { id: 'u5', email: 'chef@delices.ma', first_name: 'Youssef', last_name: 'Amrani' },
      { id: 'u6', email: 'caisser@delices.ma', first_name: 'Nadia', last_name: 'Tazi' },
    ],
    modules: ['menu', 'orders', 'pos', 'analytics', 'customers', 'reservations', 'payments'],
  },
  {
    id: '4',
    name: 'La Médina',
    slug: 'la-medina',
    region_id: 'dakar',
    region_name: 'Dakar',
    plan: 'starter',
    status: 'active',
    created_at: '2026-02-20T00:00:00Z',
    orders_total: 156,
    revenue_total: 980000,
    users: [{ id: 'u7', email: 'ibrahima@lamedina.sn', first_name: 'Ibrahima', last_name: 'Ba' }],
    modules: ['menu', 'orders', 'customers'],
  },
  {
    id: '5',
    name: 'Chez Aminata',
    slug: 'chez-aminata',
    region_id: 'abidjan',
    region_name: 'Abidjan',
    plan: 'growth',
    status: 'suspended',
    created_at: '2026-01-05T00:00:00Z',
    orders_total: 203,
    revenue_total: 1540000,
    users: [
      { id: 'u8', email: 'aminata@chezaminata.ci', first_name: 'Aminata', last_name: 'Coulibaly' },
    ],
    modules: ['menu', 'orders', 'website'],
  },
  {
    id: '6',
    name: 'Atlas Restaurant',
    slug: 'atlas-restaurant',
    region_id: 'casablanca',
    region_name: 'Casablanca',
    plan: 'growth',
    status: 'active',
    created_at: '2026-03-28T00:00:00Z',
    orders_total: 412,
    revenue_total: 3100000,
    users: [{ id: 'u9', email: 'hassan@atlas.ma', first_name: 'Hassan', last_name: 'Idrissi' }],
    modules: ['menu', 'orders', 'reservations', 'payments', 'analytics'],
  },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const REGIONS = ['Toutes', 'Dakar', 'Thiès', 'Saint-Louis', 'Abidjan', 'Casablanca'];
const STATUS_OPTS = [
  { value: 'Tous', label: 'Tous statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'trial', label: 'Essai' },
  { value: 'suspended', label: 'Suspendus' },
];
const PLAN_OPTS = [
  { value: 'Tous', label: 'Tous plans' },
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'enterprise', label: 'Enterprise' },
];

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-slate-700/80 text-slate-300',
  growth: 'bg-violet-500/20 text-violet-300',
  enterprise: 'bg-yellow-500/20 text-yellow-300',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  trial: 'bg-blue-500/20 text-blue-400',
  suspended: 'bg-amber-500/20 text-amber-400',
  deleted: 'bg-red-500/20 text-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Actif',
  trial: 'Essai',
  suspended: 'Suspendu',
  deleted: 'Supprimé',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatNumber(n?: number) {
  if (!n) return '—';
  return new Intl.NumberFormat('fr-FR').format(n);
}

// ── Tenant drawer ──────────────────────────────────────────────────────────────

function TenantDrawer({
  tenant,
  onClose,
  onToggle,
  onDelete,
  onPurge,
  loadingToggle,
  loadingDelete,
  loadingPurge,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onToggle: (t: Tenant) => void;
  onDelete: (t: Tenant) => void;
  onPurge: (t: Tenant) => void;
  loadingToggle: boolean;
  loadingDelete: boolean;
  loadingPurge: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  if (!tenant) return null;
  const canSuspend = tenant.status === 'active' || tenant.status === 'trial';
  const canActivate = tenant.status === 'suspended';
  const canDelete = tenant.status !== 'deleted';
  const canPurge = tenant.status === 'deleted';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[tenant.status]}`}
              >
                {STATUS_LABEL[tenant.status]}
              </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${PLAN_BADGE[tenant.plan]}`}
              >
                {tenant.plan}
              </span>
            </div>
            <h3 className="font-heading font-bold text-white text-lg">{tenant.name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{tenant.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Région</p>
              <p className="text-sm text-slate-200">{tenant.region_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Créé le</p>
              <p className="text-sm text-slate-200">{formatDate(tenant.created_at)}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-violet-500/20 flex items-center justify-center">
                <Building2 size={15} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Commandes</p>
                <p className="text-sm font-semibold text-white">
                  {formatNumber(tenant.orders_total)}
                </p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-violet-500/20 flex items-center justify-center">
                <Package size={15} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">CA total</p>
                <p className="text-sm font-semibold text-white">
                  {tenant.revenue_total
                    ? `${new Intl.NumberFormat('fr-FR').format(tenant.revenue_total)} F`
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Users */}
          {tenant.users && tenant.users.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={13} className="text-slate-500" />
                <p className="text-xs text-slate-500">
                  Utilisateurs ({tenant.users.length})
                </p>
              </div>
              <div className="space-y-2">
                {tenant.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg"
                  >
                    <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-violet-300">
                        {u.first_name[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modules */}
          {tenant.modules && tenant.modules.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Modules activés</p>
              <div className="flex flex-wrap gap-2">
                {tenant.modules.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-slate-300 capitalize"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-5 border-t border-white/10 space-y-3">
          {/* Confirmation suppression */}
          {confirmDelete && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-sm text-red-300 font-medium mb-2">
                Confirmer la suppression de &quot;{tenant.name}&quot; ?
              </p>
              <p className="text-xs text-red-400/70 mb-3">
                Le tenant sera marqué comme supprimé. Cette action est irréversible.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-8 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-xs"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { onDelete(tenant); setConfirmDelete(false); }}
                  disabled={loadingDelete}
                  className="flex-1 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {loadingDelete ? 'Suppression...' : 'Confirmer'}
                </button>
              </div>
            </div>
          )}

          {confirmPurge && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300 font-medium">
                  Purger définitivement &quot;{tenant.name}&quot; ?
                </p>
              </div>
              <p className="text-xs text-red-400/80 mb-3">
                Toutes les données seront supprimées de façon permanente : utilisateurs, menus, commandes, réservations… Cette action est irréversible.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmPurge(false)}
                  className="flex-1 h-8 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-xs"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { onPurge(tenant); setConfirmPurge(false); }}
                  disabled={loadingPurge}
                  className="flex-1 h-8 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {loadingPurge ? 'Purge en cours...' : 'Purger définitivement'}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <a
              href={`https://${tenant.slug}.terangatable.com/dashboard`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors text-sm"
            >
              <ExternalLink size={14} />
              Dashboard
            </a>
            {canSuspend && (
              <button
                onClick={() => onToggle(tenant)}
                disabled={loadingToggle}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <PowerOff size={14} />
                Suspendre
              </button>
            )}
            {canActivate && (
              <button
                onClick={() => onToggle(tenant)}
                disabled={loadingToggle}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Power size={14} />
                Réactiver
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={loadingDelete || confirmDelete}
                className="flex items-center justify-center gap-2 h-10 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50"
                title="Supprimer le tenant"
              >
                <Trash2 size={14} />
              </button>
            )}
            {canPurge && (
              <button
                onClick={() => setConfirmPurge(true)}
                disabled={loadingPurge || confirmPurge}
                className="flex items-center justify-center gap-2 h-10 px-3 rounded-lg bg-red-700/20 border border-red-600/40 text-red-300 hover:bg-red-700/40 transition-colors text-sm font-medium disabled:opacity-50"
                title="Purger définitivement"
              >
                <AlertTriangle size={14} />
                Purger
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [regionFilter, setRegionFilter] = useState('Toutes');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [planFilter, setPlanFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Tenant | null>(null);

  const tenantFilters: Parameters<typeof useTenants>[0] = {};
  if (regionFilter !== 'Toutes') tenantFilters.region = regionFilter.toLowerCase();
  if (statusFilter !== 'Tous') tenantFilters.status = statusFilter;
  if (planFilter !== 'Tous') tenantFilters.plan = planFilter;
  if (search) tenantFilters.search = search;
  const { data: apiData } = useTenants(tenantFilters);

  const toggleMutation = useToggleTenant();
  const deleteMutation = useDeleteTenant();
  const purgeMutation = usePurgeTenant();

  const allTenants = apiData ?? MOCK_TENANTS;
  const tenants = allTenants.filter((t) => {
    if (regionFilter !== 'Toutes' && t.region_name !== regionFilter) return false;
    if (statusFilter !== 'Tous' && t.status !== statusFilter) return false;
    if (planFilter !== 'Tous' && t.plan !== planFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.slug.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleToggle(tenant: Tenant) {
    const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'suspended' ? 'suspendu' : 'réactivé';
    try {
      await toggleMutation.mutateAsync({ id: tenant.id, status: newStatus });
      toast.success(`Tenant ${action} avec succès.`);
      setSelected(null);
    } catch {
      toast.error("Erreur lors de la modification du statut");
    }
  }

  async function handleDelete(tenant: Tenant) {
    try {
      await deleteMutation.mutateAsync(tenant.id);
      toast.success(`Tenant "${tenant.name}" supprimé.`);
      setSelected(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handlePurge(tenant: Tenant) {
    try {
      await purgeMutation.mutateAsync(tenant.id);
      toast.success(`Tenant "${tenant.name}" purgé définitivement.`);
      setSelected(null);
    } catch {
      toast.error('Erreur lors de la purge');
    }
  }

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Tous les tenants</h1>
        <p className="mt-1 text-sm text-slate-400">{tenants.length} tenant(s) trouvé(s).</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {[
          { value: regionFilter, onChange: setRegionFilter, opts: REGIONS.map((r) => ({ value: r, label: r })) },
          { value: statusFilter, onChange: setStatusFilter, opts: STATUS_OPTS },
          { value: planFilter, onChange: setPlanFilter, opts: PLAN_OPTS },
        ].map((sel, idx) => (
          <div key={idx} className="relative">
            <select
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="appearance-none bg-slate-800 border border-white/10 rounded-lg px-3 pr-8 h-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              {sel.opts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        ))}

        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou slug..."
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-8 pr-3 h-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-white/10">
                <th className="text-left px-5 py-3 font-medium">Nom</th>
                <th className="text-left px-5 py-3 font-medium">Slug</th>
                <th className="text-left px-5 py-3 font-medium">Région</th>
                <th className="text-left px-5 py-3 font-medium">Plan</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-left px-5 py-3 font-medium">Créé le</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Aucun tenant trouvé.
                  </td>
                </tr>
              ) : (
                tenants.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                      i === tenants.length - 1 ? 'border-0' : ''
                    }`}
                    onClick={() => setSelected(t)}
                  >
                    <td className="px-5 py-3.5 text-slate-200 font-medium">{t.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{t.slug}</td>
                    <td className="px-5 py-3.5 text-slate-400">{t.region_name}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${PLAN_BADGE[t.plan]}`}
                      >
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[t.status]}`}
                      >
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                      {formatDate(t.created_at)}
                    </td>
                    <td
                      className="px-5 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://${t.slug}.terangatable.com/dashboard`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Voir dashboard"
                        >
                          <ExternalLink size={14} />
                        </a>
                        {(t.status === 'active' || t.status === 'trial') && (
                          <button
                            onClick={() => void handleToggle(t)}
                            className="p-1.5 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                            title="Suspendre"
                          >
                            <PowerOff size={14} />
                          </button>
                        )}
                        {t.status === 'suspended' && (
                          <button
                            onClick={() => void handleToggle(t)}
                            className="p-1.5 rounded text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors"
                            title="Réactiver"
                          >
                            <Power size={14} />
                          </button>
                        )}
                        {t.status !== 'deleted' && (
                          <button
                            onClick={() => { setSelected(t); }}
                            className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <TenantDrawer
        tenant={selected}
        onClose={() => setSelected(null)}
        onToggle={(t) => void handleToggle(t)}
        onDelete={(t) => void handleDelete(t)}
        onPurge={(t) => void handlePurge(t)}
        loadingToggle={toggleMutation.isPending}
        loadingDelete={deleteMutation.isPending}
        loadingPurge={purgeMutation.isPending}
      />
    </div>
  );
}
