'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Pencil } from 'lucide-react';
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  type Plan,
  type PlanFormData,
} from '@/hooks/use-super-admin';

// ── Constants ──────────────────────────────────────────────────────────────────

const FEATURE_LABEL: Record<string, string> = {
  pos: 'Point de vente',
  reservations: 'Réservations',
  delivery: 'Livraison',
  crm: 'CRM',
  analytics_pro: 'Analytics',
  website: 'Site vitrine',
  rules_engine: 'Moteur de règles',
  custom_fields: 'Champs personnalisés',
  workflows: 'Workflows',
  kds: 'Écran cuisine',
  whatsapp: 'Assistant WhatsApp',
  reviews: 'Avis clients',
};

const FEATURE_SLUGS = Object.keys(FEATURE_LABEL);

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

// ── Plan form modal ──────────────────────────────────────────────────────────────

const EMPTY_FORM: PlanFormData = {
  name: '',
  price_monthly: 0,
  price_yearly: 0,
  max_users: 5,
  max_products: 100,
  features: Object.fromEntries(FEATURE_SLUGS.map((slug) => [slug, false])),
  is_active: true,
};

function PlanFormModal({
  plan,
  onClose,
  onSubmit,
  loading,
}: {
  plan: Plan | null;
  onClose: () => void;
  onSubmit: (data: PlanFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<PlanFormData>(EMPTY_FORM);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        max_users: plan.max_users,
        max_products: plan.max_products,
        features: { ...Object.fromEntries(FEATURE_SLUGS.map((slug) => [slug, false])), ...plan.features },
        is_active: plan.is_active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [plan]);

  const valid = form.name.trim().length > 0 && form.price_monthly >= 0 && form.price_yearly >= 0;

  const toggleFeature = (slug: string) =>
    setForm((prev) => ({ ...prev, features: { ...prev.features, [slug]: !prev.features[slug] } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-heading font-bold text-white">
            {plan ? `Modifier ${plan.name}` : 'Nouveau plan'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Nom du plan</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="ex: Growth"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Tarif mensuel</label>
              <input
                type="number"
                min={0}
                value={form.price_monthly}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price_monthly: Number(e.target.value) }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Tarif annuel</label>
              <input
                type="number"
                min={0}
                value={form.price_yearly}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price_yearly: Number(e.target.value) }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Max utilisateurs <span className="text-slate-600">(-1 = illimité)</span>
              </label>
              <input
                type="number"
                value={form.max_users}
                onChange={(e) => setForm((prev) => ({ ...prev, max_users: Number(e.target.value) }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Max produits <span className="text-slate-600">(-1 = illimité)</span>
              </label>
              <input
                type="number"
                value={form.max_products}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, max_products: Number(e.target.value) }))
                }
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Modules inclus</label>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_SLUGS.map((slug) => (
                <label
                  key={slug}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-800/60 border border-white/5 cursor-pointer hover:border-white/10 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.features[slug])}
                    onChange={() => toggleFeature(slug)}
                    className="accent-violet-600"
                  />
                  <span className="text-xs text-slate-300">{FEATURE_LABEL[slug]}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="accent-violet-600"
            />
            <span className="text-sm text-slate-300">Plan actif (visible / souscriptible)</span>
          </label>
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
            {loading ? 'Enregistrement...' : plan ? 'Enregistrer' : 'Créer le plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan card ──────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onEdit,
  onToggleActive,
  loading,
}: {
  plan: Plan;
  onEdit: () => void;
  onToggleActive: () => void;
  loading: boolean;
}) {
  const activeFeatures = Object.entries(plan.features).filter(([, enabled]) => enabled);

  return (
    <div
      className={`bg-slate-800/60 border rounded-xl p-5 flex flex-col gap-4 transition-opacity ${
        plan.is_active ? 'border-white/10' : 'border-white/5 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading font-bold text-white">{plan.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{plan.tenants_count ?? 0} tenant(s) sur ce plan</p>
        </div>
        <button
          onClick={onToggleActive}
          disabled={loading}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${
            plan.is_active ? 'bg-violet-600' : 'bg-slate-700'
          }`}
          title={plan.is_active ? 'Désactiver le plan' : 'Activer le plan'}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              plan.is_active ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white">{formatPrice(plan.price_monthly)}</span>
        <span className="text-xs text-slate-500">/ mois</span>
      </div>
      <p className="text-xs text-slate-500 -mt-3">{formatPrice(plan.price_yearly)} / an</p>

      <div className="flex items-center gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">Utilisateurs</p>
          <p className="font-semibold text-white">{plan.max_users === -1 ? 'Illimité' : plan.max_users}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Produits</p>
          <p className="font-semibold text-white">
            {plan.max_products === -1 ? 'Illimité' : plan.max_products}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {activeFeatures.map(([slug]) => (
          <span
            key={slug}
            className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 text-violet-300"
          >
            {FEATURE_LABEL[slug] ?? slug}
          </span>
        ))}
      </div>

      <button
        onClick={onEdit}
        className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors text-xs font-medium"
      >
        <Pencil size={12} />
        Modifier le tarif
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Plan | null>(null);

  const { data: apiData, isLoading, isError } = usePlans();
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();

  const plans = apiData ?? [];

  async function handleCreate(data: PlanFormData) {
    try {
      await createMutation.mutateAsync(data);
      toast.success(`Plan "${data.name}" créé.`);
      setShowForm(false);
    } catch {
      toast.error('Erreur lors de la création du plan');
    }
  }

  async function handleUpdate(data: PlanFormData) {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, ...data });
      toast.success(`Plan "${data.name}" mis à jour.`);
      setEditTarget(null);
    } catch {
      toast.error('Erreur lors de la mise à jour du plan');
    }
  }

  async function handleToggleActive(plan: Plan) {
    try {
      await updateMutation.mutateAsync({ id: plan.id, is_active: !plan.is_active });
      toast.success(plan.is_active ? `Plan "${plan.name}" désactivé.` : `Plan "${plan.name}" activé.`);
    } catch {
      toast.error('Erreur lors de la modification');
    }
  }

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Plans d&apos;abonnement</h1>
          <p className="mt-1 text-sm text-slate-400">
            {plans.length} plan(s) configuré(s). Modifiez les tarifs et modules inclus par plan.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Nouveau plan
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500 text-sm py-12">Chargement des plans…</p>
      ) : isError ? (
        <p className="text-center text-red-400 text-sm py-12">
          Impossible de charger les plans. Vérifiez vos droits d&apos;accès ou réessayez.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => setEditTarget(plan)}
              onToggleActive={() => void handleToggleActive(plan)}
              loading={updateMutation.isPending}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PlanFormModal
          plan={null}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => void handleCreate(data)}
          loading={createMutation.isPending}
        />
      )}

      {editTarget && (
        <PlanFormModal
          plan={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(data) => void handleUpdate(data)}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
