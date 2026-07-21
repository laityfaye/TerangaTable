'use client';

import { toast } from 'sonner';
import { useModules, useToggleModule, usePlans, type PlatformModule } from '@/hooks/use-super-admin';

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
          {module.included_in_plans.length > 0 ? (
            module.included_in_plans.map((planName) => (
              <span
                key={planName}
                className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 text-violet-300"
              >
                {planName}
              </span>
            ))
          ) : (
            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-400">
              Aucun plan
            </span>
          )}
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
  const { data: apiData, isLoading, isError } = useModules();
  const { data: plans } = usePlans();
  const toggleMutation = useToggleModule();

  const modules = apiData ?? [];
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

  // Résumé par plan — calculé dynamiquement depuis Plan.features (via included_in_plans),
  // pas depuis un groupement figé starter/growth/enterprise : un plan peut être créé,
  // renommé ou supprimé librement depuis la page Plans.
  const byPlan = (plans ?? []).map((plan) => ({
    plan,
    count: modules.filter((m) => m.included_in_plans.includes(plan.name)).length,
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

      {isLoading ? (
        <p className="text-center text-slate-500 text-sm py-12">Chargement des modules…</p>
      ) : isError ? (
        <p className="text-center text-red-400 text-sm py-12">
          Impossible de charger les modules. Vérifiez vos droits d&apos;accès ou réessayez.
        </p>
      ) : (
        <>
          {/* Summary cards — un par plan configuré */}
          {byPlan.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {byPlan.map(({ plan, count }) => (
                <div
                  key={plan.id}
                  className="flex-1 min-w-[160px] bg-slate-800/60 border border-white/10 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-violet-400">
                      {count}/{modules.length}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Plan</p>
                    <p className="text-sm font-semibold text-white">{plan.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Liste des modules */}
          <div className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
            {modules.map((mod) => (
              <ModuleRow
                key={mod.id}
                module={mod}
                onToggle={(m) => void handleToggle(m)}
                loading={toggleMutation.isPending}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
