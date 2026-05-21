'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  ChevronDown,
  ExternalLink,
  Power,
  PowerOff,
  X,
  Building2,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useTenants, useToggleTenant, useRegions, type Tenant, type Region } from '@/hooks/use-super-admin';
import { useAuthStore } from '@/stores/auth.store';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_REGIONS: Region[] = [
  { id: '1', name: 'Dakar', slug: 'dakar', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Dakar', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true },
  { id: '2', name: 'Thiès', slug: 'thies', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Thiès', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true },
  { id: '3', name: 'Saint-Louis', slug: 'saint-louis', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Saint-Louis', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true },
  { id: '4', name: 'Abidjan', slug: 'abidjan', country_code: 'CI', country_name: "Côte d'Ivoire", platform_label: 'TérangaTable Abidjan', timezone: 'Africa/Abidjan', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-CI', phone_prefix: '+225', is_active: true },
  { id: '5', name: 'Casablanca', slug: 'casablanca', country_code: 'MA', country_name: 'Maroc', platform_label: 'TérangaTable Casablanca', timezone: 'Africa/Casablanca', currency_code: 'MAD', currency_symbol: 'DH', locale: 'fr-MA', phone_prefix: '+212', is_active: true },
  { id: '6', name: 'Paris', slug: 'paris', country_code: 'FR', country_name: 'France', platform_label: 'TérangaTable Paris', timezone: 'Europe/Paris', currency_code: 'EUR', currency_symbol: '€', locale: 'fr-FR', phone_prefix: '+33', is_active: false },
];

const MOCK_TENANTS: Tenant[] = [
  { id: '1', name: 'Le Teranga', slug: 'le-teranga', region_id: 'dakar', region_name: 'Dakar', plan: 'growth', status: 'active', created_at: '2026-04-01T00:00:00Z', orders_total: 342, revenue_total: 2850000, users: [{ id: 'u1', email: 'moussa@teranga.sn', first_name: 'Moussa', last_name: 'Diop' }], modules: ['menu', 'orders', 'reservations', 'payments', 'analytics'] },
  { id: '2', name: "Saveurs d'Abidjan", slug: 'saveurs-abidjan', region_id: 'abidjan', region_name: 'Abidjan', plan: 'starter', status: 'trial', created_at: '2026-04-15T00:00:00Z', orders_total: 58, revenue_total: 425000, users: [{ id: 'u3', email: 'kofi@saveurs.ci', first_name: 'Kofi', last_name: 'Asante' }], modules: ['menu', 'orders', 'delivery'] },
  { id: '3', name: 'Délices Casablanca', slug: 'delices-casablanca', region_id: 'casablanca', region_name: 'Casablanca', plan: 'enterprise', status: 'active', created_at: '2026-03-10T00:00:00Z', orders_total: 891, revenue_total: 7200000, users: [{ id: 'u4', email: 'rachid@delices.ma', first_name: 'Rachid', last_name: 'Benali' }, { id: 'u5', email: 'chef@delices.ma', first_name: 'Youssef', last_name: 'Amrani' }], modules: ['menu', 'orders', 'pos', 'analytics', 'customers'] },
  { id: '4', name: 'La Médina', slug: 'la-medina', region_id: 'dakar', region_name: 'Dakar', plan: 'starter', status: 'active', created_at: '2026-02-20T00:00:00Z', orders_total: 156, revenue_total: 980000, users: [{ id: 'u7', email: 'ibrahima@lamedina.sn', first_name: 'Ibrahima', last_name: 'Ba' }], modules: ['menu', 'orders', 'customers'] },
  { id: '5', name: 'Chez Aminata', slug: 'chez-aminata', region_id: 'abidjan', region_name: 'Abidjan', plan: 'growth', status: 'suspended', created_at: '2026-01-05T00:00:00Z', orders_total: 203, revenue_total: 1540000, users: [{ id: 'u8', email: 'aminata@chezaminata.ci', first_name: 'Aminata', last_name: 'Coulibaly' }], modules: ['menu', 'orders', 'website'] },
  { id: '6', name: 'Atlas Restaurant', slug: 'atlas-restaurant', region_id: 'casablanca', region_name: 'Casablanca', plan: 'growth', status: 'active', created_at: '2026-03-28T00:00:00Z', orders_total: 412, revenue_total: 3100000, users: [{ id: 'u9', email: 'hassan@atlas.ma', first_name: 'Hassan', last_name: 'Idrissi' }], modules: ['menu', 'orders', 'reservations', 'payments', 'analytics'] },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: 'Tous', label: 'Tous statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'trial', label: 'Essai' },
  { value: 'suspended', label: 'Suspendus' },
];

const PLAN_BADGE: Record<string, string> = {
  starter:    'bg-slate-700/80 text-slate-300',
  growth:     'bg-violet-500/20 text-violet-300',
  enterprise: 'bg-yellow-500/20 text-yellow-300',
};

const STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-500/20 text-green-400',
  trial:     'bg-blue-500/20 text-blue-400',
  suspended: 'bg-amber-500/20 text-amber-400',
  deleted:   'bg-red-500/20 text-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Actif', trial: 'Essai', suspended: 'Suspendu', deleted: 'Supprimé',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatNumber(n?: number) {
  if (!n) return '—';
  return new Intl.NumberFormat('fr-FR').format(n);
}

// ── Tenant drawer ──────────────────────────────────────────────────────────────

function TenantDrawer({
  tenant, onClose, onToggle, loading,
}: {
  tenant: Tenant | null; onClose: () => void; onToggle: (t: Tenant) => void; loading: boolean;
}) {
  if (!tenant) return null;
  const canSuspend = tenant.status === 'active' || tenant.status === 'trial';
  const canActivate = tenant.status === 'suspended';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[tenant.status]}`}>{STATUS_LABEL[tenant.status]}</span>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${PLAN_BADGE[tenant.plan]}`}>{tenant.plan}</span>
            </div>
            <h3 className="font-heading font-bold text-white text-lg">{tenant.name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{tenant.slug}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-1"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div><p className="text-xs text-slate-500 mb-1">Région</p><p className="text-sm text-slate-200">{tenant.region_name}</p></div>
            <div><p className="text-xs text-slate-500 mb-1">Créé le</p><p className="text-sm text-slate-200">{formatDate(tenant.created_at)}</p></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-violet-500/20 flex items-center justify-center"><Building2 size={15} className="text-violet-400" /></div>
              <div><p className="text-xs text-slate-500">Commandes</p><p className="text-sm font-semibold text-white">{formatNumber(tenant.orders_total)}</p></div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-violet-500/20 flex items-center justify-center"><Package size={15} className="text-violet-400" /></div>
              <div><p className="text-xs text-slate-500">CA total</p><p className="text-sm font-semibold text-white">{tenant.revenue_total ? `${new Intl.NumberFormat('fr-FR').format(tenant.revenue_total)} F` : '—'}</p></div>
            </div>
          </div>

          {tenant.users && tenant.users.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={13} className="text-slate-500" />
                <p className="text-xs text-slate-500">Utilisateurs ({tenant.users.length})</p>
              </div>
              <div className="space-y-2">
                {tenant.users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-violet-300">{u.first_name[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tenant.modules && tenant.modules.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Modules activés</p>
              <div className="flex flex-wrap gap-2">
                {tenant.modules.map((mod) => (
                  <span key={mod} className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-slate-300 capitalize">{mod}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-white/10 flex gap-3">
          <a href={`https://${tenant.slug}.terangatable.com/dashboard`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors text-sm">
            <ExternalLink size={14} /> Voir dashboard
          </a>
          {canSuspend && (
            <button onClick={() => onToggle(tenant)} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium disabled:opacity-50">
              <PowerOff size={14} /> Suspendre
            </button>
          )}
          {canActivate && (
            <button onClick={() => onToggle(tenant)} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium disabled:opacity-50">
              <Power size={14} /> Réactiver
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RegionTenantsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const [statusFilter, setStatusFilter] = useState('Tous');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<Tenant | null>(null);

  const user = useAuthStore((s) => s.user);
  const isRegionalAdmin = user?.roles.includes('regional_admin') ?? false;

  const { data: regionsData } = useRegions();
  const region = (regionsData ?? MOCK_REGIONS).find((r) => r.slug === slug);
  const regionName = region?.name ?? slug;

  const tenantFilters: Parameters<typeof useTenants>[0] = { region: slug };
  if (statusFilter !== 'Tous') tenantFilters.status = statusFilter;
  if (search) tenantFilters.search = search;
  const { data: apiData } = useTenants(tenantFilters);

  const toggleMutation = useToggleTenant();

  const allTenants = apiData ?? MOCK_TENANTS;
  const tenants = allTenants.filter((t) => {
    if (t.region_id !== slug && t.region_name !== regionName) return false;
    if (statusFilter !== 'Tous' && t.status !== statusFilter) return false;
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
      toast.error('Erreur lors de la modification du statut');
    }
  }

  return (
    <div className="space-y-5 text-white">
      {/* Regional admin banner */}
      {isRegionalAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-violet-400 flex-shrink-0" />
          <p className="text-sm text-violet-300">
            Vous gérez uniquement les restaurants de <span className="font-semibold">{regionName}</span>.
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Tenants — {regionName}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{tenants.length} tenant(s) trouvé(s).</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-slate-800 border border-white/10 rounded-lg px-3 pr-8 h-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer">
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou slug..."
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-8 pr-3 h-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50" />
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
                <th className="text-left px-5 py-3 font-medium">Plan</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-left px-5 py-3 font-medium">Créé le</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Aucun tenant trouvé pour cette région.
                  </td>
                </tr>
              ) : (
                tenants.map((t, i) => (
                  <tr key={t.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${i === tenants.length - 1 ? 'border-0' : ''}`}
                    onClick={() => setSelected(t)}
                  >
                    <td className="px-5 py-3.5 text-slate-200 font-medium">{t.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{t.slug}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${PLAN_BADGE[t.plan]}`}>{t.plan}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{formatDate(t.created_at)}</td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <a href={`https://${t.slug}.terangatable.com/dashboard`} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Voir dashboard">
                          <ExternalLink size={14} />
                        </a>
                        {(t.status === 'active' || t.status === 'trial') && (
                          <button onClick={() => void handleToggle(t)}
                            className="p-1.5 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors" title="Suspendre">
                            <PowerOff size={14} />
                          </button>
                        )}
                        {t.status === 'suspended' && (
                          <button onClick={() => void handleToggle(t)}
                            className="p-1.5 rounded text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors" title="Réactiver">
                            <Power size={14} />
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

      <TenantDrawer tenant={selected} onClose={() => setSelected(null)} onToggle={(t) => void handleToggle(t)} loading={toggleMutation.isPending} />
    </div>
  );
}
