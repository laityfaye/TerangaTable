'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  FlaskConical,
  Zap,
  Package,
  RefreshCw,
  CreditCard,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  useRules,
  useCreateRule,
  useDeleteRule,
  useToggleRule,
  type Rule,
  type EventTrigger,
} from '@/hooks/rules/use-rules';

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_META: Record<
  EventTrigger,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  'order.created': {
    label: 'Commande créée',
    icon: <Package size={11} />,
    color: '#1D4ED8',
    bg: '#DBEAFE',
  },
  'order.state_changed': {
    label: 'Statut commande changé',
    icon: <RefreshCw size={11} />,
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  'payment.received': {
    label: 'Paiement reçu',
    icon: <CreditCard size={11} />,
    color: '#15803D',
    bg: '#DCFCE7',
  },
  'product.unavailable': {
    label: 'Produit indisponible',
    icon: <AlertCircle size={11} />,
    color: '#B45309',
    bg: '#FEF3C7',
  },
};

const ACTION_LABELS: Record<string, string> = {
  notify_role: 'Notifier rôle',
  notify_user: 'Notifier utilisateur',
  update_field: 'Modifier champ',
  set_tag: 'Ajouter tag',
  apply_discount: 'Appliquer remise',
  change_status: 'Changer statut',
  send_webhook: 'Envoyer webhook',
  block_action: 'Bloquer action',
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: '=', neq: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤',
  contains: 'contient', starts_with: 'commence par',
  in: 'parmi', not_in: 'pas parmi',
  is_null: 'est vide', is_not_null: 'n\'est pas vide',
  between: 'entre', time_between: 'entre (heure)',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function ruleSummary(rule: Rule): string {
  const cond = rule.conditions[0];
  const act = rule.actions[0];
  if (!cond && !act) return 'Aucune condition ni action';

  const condStr = cond
    ? `${cond.field} ${OPERATOR_LABELS[cond.operator] ?? cond.operator} ${cond.value ?? ''}`
    : '…';
  const actStr = act ? (ACTION_LABELS[act.type] ?? act.type) : '…';
  const extra = rule.conditions.length > 1
    ? ` (+${rule.conditions.length - 1})`
    : '';

  return `SI ${condStr}${extra} → ${actStr}`;
}

// ── EventBadge ────────────────────────────────────────────────────────────────

function EventBadge({ trigger }: { trigger: EventTrigger }) {
  const meta = EVENT_META[trigger] ?? {
    label: trigger,
    icon: <Zap size={11} />,
    color: '#64748B',
    bg: '#F1F5F9',
  };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

// ── New rule modal ────────────────────────────────────────────────────────────

function NewRuleModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { mutate: create, isPending } = useCreateRule();
  const [name, setName] = useState('Nouvelle règle');
  const [trigger, setTrigger] = useState<EventTrigger>('order.created');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create(
      {
        name,
        event_trigger: trigger,
        conditions: [],
        condition_logic: 'AND',
        actions: [],
        is_active: false,
        priority: 0,
      },
      {
        onSuccess: (rule) => {
          router.push(`/dashboard/settings/rules/${rule.id}/edit`);
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Nouvelle règle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Déclencheur
            </label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as EventTrigger)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(Object.keys(EVENT_META) as EventTrigger[]).map((t) => (
                <option key={t} value={t}>
                  {EVENT_META[t].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Créer et configurer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Rule card ─────────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  onDuplicate,
  onDelete,
}: {
  rule: Rule;
  onDuplicate: (r: Rule) => void;
  onDelete: (id: string) => void;
}) {
  const { mutate: toggle, isPending: toggling } = useToggleRule();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-900 text-sm truncate">
              {rule.name}
            </span>
            <EventBadge trigger={rule.eventTrigger} />
          </div>
          <p className="text-xs text-slate-500 truncate">{ruleSummary(rule)}</p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => toggle(rule.id)}
          disabled={toggling}
          className="flex-shrink-0 text-slate-400 hover:text-indigo-600 transition disabled:opacity-50"
          title={rule.isActive ? 'Désactiver' : 'Activer'}
        >
          {toggling ? (
            <Loader2 size={20} className="animate-spin" />
          ) : rule.isActive ? (
            <ToggleRight size={22} className="text-indigo-600" />
          ) : (
            <ToggleLeft size={22} />
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3 text-[11px] text-slate-400">
        <span>
          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
        </span>
        <span>·</span>
        <span>
          {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
        </span>
        <span>·</span>
        <span
          className={`font-medium ${rule.isActive ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          {rule.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-slate-100 pt-2">
        <Link
          href={`/dashboard/settings/rules/${rule.id}/edit`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          <Pencil size={12} />
          Modifier
        </Link>
        <button
          onClick={() => onDuplicate(rule)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          <Copy size={12} />
          Dupliquer
        </button>
        <Link
          href={`/dashboard/settings/rules/${rule.id}/edit`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-violet-600 hover:bg-violet-50 rounded-lg transition"
        >
          <FlaskConical size={12} />
          Tester
        </Link>
        <button
          onClick={() => onDelete(rule.id)}
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 size={12} />
          Supprimer
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RulesPage() {
  const [showNew, setShowNew] = useState(false);
  const [filterTrigger, setFilterTrigger] = useState<string>('');

  const { data, isLoading } = useRules(
    filterTrigger ? { event_trigger: filterTrigger } : undefined,
  );
  const { mutate: createRule } = useCreateRule();
  const { mutate: deleteRule } = useDeleteRule();

  const rules = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  function handleDuplicate(rule: Rule) {
    createRule({
      name: `${rule.name} (copie)`,
      event_trigger: rule.eventTrigger,
      conditions: rule.conditions,
      condition_logic: rule.conditionLogic,
      actions: rule.actions,
      is_active: false,
      priority: rule.priority,
    });
  }

  function handleDelete(id: string) {
    if (window.confirm('Supprimer cette règle ?')) {
      deleteRule(id);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Règles Métier</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total} règle{total !== 1 ? 's' : ''} configurée{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          Nouvelle règle
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFilterTrigger('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
            !filterTrigger
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Toutes
        </button>
        {(Object.keys(EVENT_META) as EventTrigger[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilterTrigger(filterTrigger === t ? '' : t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              filterTrigger === t
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {EVENT_META[t].label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-slate-400" size={28} />
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Zap size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Aucune règle configurée</p>
          <p className="text-sm text-slate-400 mt-1">
            Créez votre première règle métier pour automatiser vos processus.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={15} />
            Nouvelle règle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showNew && <NewRuleModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
