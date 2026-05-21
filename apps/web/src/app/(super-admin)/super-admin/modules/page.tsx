'use client';

import { toast } from 'sonner';
import { useModules, useToggleModule, type PlatformModule } from '@/hooks/use-super-admin';

// ── Mock data (aligned with seed) ─────────────────────────────────────────────

const MOCK_MODULES: PlatformModule[] = [
  {
    id: '1',
    name: 'Menu & Carte',
    slug: 'menu',
    description: 'Gestion des catégories, plats, options et photos. Multi-langues disponible.',
    required_plan: 'starter',
    is_active: true,
    active_tenants_count: 83,
  },
  {
    id: '2',
    name: 'Commandes',
    slug: 'orders',
    description: 'Prise de commande sur place, emporté et en ligne. Tickets cuisine.',
    required_plan: 'starter',
    is_active: true,
    active_tenants_count: 81,
  },
  {
    id: '3',
    name: 'Paiements',
    slug: 'payments',
    description: 'Wave, Orange Money, carte bancaire, espèces. Réconciliation automatique.',
    required_plan: 'starter',
    is_active: true,
    active_tenants_count: 78,
  },
  {
    id: '4',
    name: 'Caisse (POS)',
    slug: 'pos',
    description: 'Interface caisse tactile, tickets de caisse, clôture de caisse.',
    required_plan: 'growth',
    is_active: true,
    active_tenants_count: 42,
  },
  {
    id: '5',
    name: 'Réservations',
    slug: 'reservations',
    description: 'Gestion des tables, réservations en ligne, confirmation par SMS.',
    required_plan: 'growth',
    is_active: true,
    active_tenants_count: 38,
  },
  {
    id: '6',
    name: 'Analytics',
    slug: 'analytics',
    description: "Tableaux de bord CA, commandes, tendances, heures de pointe, produits phares.",
    required_plan: 'growth',
    is_active: true,
    active_tenants_count: 35,
  },
  {
    id: '7',
    name: 'Site Vitrine',
    slug: 'website',
    description: 'Site web personnalisable avec menu en ligne, commande directe et SEO.',
    required_plan: 'growth',
    is_active: true,
    active_tenants_count: 29,
  },
  {
    id: '8',
    name: 'Livraison',
    slug: 'delivery',
    description: 'Gestion des livreurs, zones, tarifs, suivi en temps réel.',
    required_plan: 'growth',
    is_active: true,
    active_tenants_count: 24,
  },
  {
    id: '9',
    name: 'CRM Clients',
    slug: 'customers',
    description: 'Fidélité, historique commandes, segmentation, campagnes SMS/email.',
    required_plan: 'enterprise',
    is_active: true,
    active_tenants_count: 11,
  },
  {
    id: '10',
    name: 'Multi-langues',
    slug: 'multilang',
    description: 'Interface et menu en français, anglais, arabe et wolof.',
    required_plan: 'enterprise',
    is_active: false,
    active_tenants_count: 0,
  },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, string> = {
  starter: 'bg-slate-700/80 text-slate-300',
  growth: 'bg-violet-500/20 text-violet-300',
  enterprise: 'bg-yellow-500/20 text-yellow-300',
};

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

// ── Module row ─────────────────────────────────────────────────────────────────

function ModuleRow({
  module,
  onToggle,
  loading,
}: {
  module: PlatformModule;
  onToggle: (m: PlatformModule) => void;
  loading: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 border-b border-white/5 transition-opacity last:border-0 ${
        module.is_active ? '' : 'opacity-50'
      }`}
    >
      {/* Toggle */}
      <button
        onClick={() => onToggle(module)}
        disabled={loading}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
          module.is_active ? 'bg-violet-600' : 'bg-slate-700'
        }`}
        title={module.is_active ? 'Désactiver' : 'Activer'}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            module.is_active ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-200">{module.name}</p>
          <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
            {module.slug}
          </span>
          <span
            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${PLAN_BADGE[module.required_plan]}`}
          >
            {PLAN_LABEL[module.required_plan]}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
      </div>

      {/* Tenants actifs */}
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-white">{module.active_tenants_count ?? 0}</p>
        <p className="text-xs text-slate-500">tenants actifs</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ModulesPage() {
  const { data: apiData } = useModules();
  const toggleMutation = useToggleModule();

  const modules = apiData ?? MOCK_MODULES;
  const activeCount = modules.filter((m) => m.is_active).length;

  async function handleToggle(module: PlatformModule) {
    const action = module.is_active ? 'désactivé' : 'activé';
    try {
      await toggleMutation.mutateAsync({ id: module.id, is_active: !module.is_active });
      toast.success(`Module "${module.name}" ${action} sur toute la plateforme.`);
    } catch {
      toast.error('Erreur lors de la modification');
    }
  }

  const byPlan = (['starter', 'growth', 'enterprise'] as const).map((plan) => ({
    plan,
    modules: modules.filter((m) => m.required_plan === plan),
  }));

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Modules plateforme</h1>
          <p className="mt-1 text-sm text-slate-400">
            {activeCount} / {modules.length} modules actifs sur la plateforme.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {byPlan.map(({ plan, modules: planMods }) => (
          <div
            key={plan}
            className="bg-slate-800/60 border border-white/10 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-violet-400">
                {planMods.filter((m) => m.is_active).length}/{planMods.length}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Plan</p>
              <p className="text-sm font-semibold text-white capitalize">{PLAN_LABEL[plan]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Module list grouped by plan */}
      {byPlan.map(({ plan, modules: planMods }) => (
        <div key={plan} className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${PLAN_BADGE[plan]}`}
            >
              {PLAN_LABEL[plan]}
            </span>
            <span className="text-xs text-slate-500">
              — requis à partir de ce plan
            </span>
          </div>
          {planMods.map((mod) => (
            <ModuleRow
              key={mod.id}
              module={mod}
              onToggle={(m) => void handleToggle(m)}
              loading={toggleMutation.isPending}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
