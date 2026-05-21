'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FlaskConical,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Webhook,
  Bell,
  Tag,
  Percent,
  RefreshCw,
  Ban,
  UserRound,
  Settings2,
} from 'lucide-react';
import {
  useRule,
  useUpdateRule,
  useTestRule,
  type RuleCondition,
  type RuleAction,
  type ConditionLogic,
  type EventTrigger,
  type TestRuleResult,
} from '@/hooks/rules/use-rules';

// ── Schema definitions ─────────────────────────────────────────────────────────

const EVENT_TRIGGERS: Array<{ value: EventTrigger; label: string; emoji: string }> = [
  { value: 'order.created', label: 'Commande créée', emoji: '📦' },
  { value: 'order.state_changed', label: 'Statut commande changé', emoji: '🔄' },
  { value: 'payment.received', label: 'Paiement reçu', emoji: '💳' },
  { value: 'product.unavailable', label: 'Produit indisponible', emoji: '❌' },
];

interface FieldDef {
  key: string;
  label: string;
  type: 'number' | 'string' | 'enum';
  enumValues?: string[];
}

const EVENT_FIELDS: Record<EventTrigger, FieldDef[]> = {
  'order.created': [
    { key: 'order.total', label: 'Total commande', type: 'number' },
    { key: 'order.type', label: 'Type commande', type: 'enum', enumValues: ['dine_in', 'takeaway', 'delivery', 'online'] },
    { key: 'order.items_count', label: 'Nombre articles', type: 'number' },
  ],
  'order.state_changed': [
    { key: 'order.total', label: 'Total commande', type: 'number' },
    { key: 'order.type', label: 'Type commande', type: 'enum', enumValues: ['dine_in', 'takeaway', 'delivery', 'online'] },
    { key: 'order.status', label: 'Statut', type: 'string' },
  ],
  'payment.received': [
    { key: 'payment.amount', label: 'Montant paiement', type: 'number' },
    { key: 'payment.method', label: 'Méthode de paiement', type: 'enum', enumValues: ['cash', 'card', 'mobile_money', 'wave', 'orange_money'] },
  ],
  'product.unavailable': [
    { key: 'product.id', label: 'ID produit', type: 'string' },
    { key: 'product.name', label: 'Nom produit', type: 'string' },
  ],
};

const OPERATORS_BY_TYPE: Record<
  'number' | 'string' | 'enum',
  Array<{ value: string; label: string; hasValue: boolean; isBetween?: boolean }>
> = {
  number: [
    { value: 'eq', label: 'Est égal à', hasValue: true },
    { value: 'neq', label: 'Est différent de', hasValue: true },
    { value: 'gt', label: 'Supérieur à', hasValue: true },
    { value: 'gte', label: 'Supérieur ou égal à', hasValue: true },
    { value: 'lt', label: 'Inférieur à', hasValue: true },
    { value: 'lte', label: 'Inférieur ou égal à', hasValue: true },
    { value: 'between', label: 'Entre', hasValue: true, isBetween: true },
    { value: 'is_null', label: 'Est vide', hasValue: false },
    { value: 'is_not_null', label: "N'est pas vide", hasValue: false },
  ],
  string: [
    { value: 'eq', label: 'Est égal à', hasValue: true },
    { value: 'neq', label: 'Est différent de', hasValue: true },
    { value: 'contains', label: 'Contient', hasValue: true },
    { value: 'starts_with', label: 'Commence par', hasValue: true },
    { value: 'is_null', label: 'Est vide', hasValue: false },
    { value: 'is_not_null', label: "N'est pas vide", hasValue: false },
  ],
  enum: [
    { value: 'eq', label: 'Est', hasValue: true },
    { value: 'neq', label: "N'est pas", hasValue: true },
    { value: 'in', label: 'Est parmi', hasValue: true },
    { value: 'not_in', label: "N'est pas parmi", hasValue: true },
  ],
};

const ACTION_TYPES: Array<{ value: string; label: string; icon: React.ReactNode }> = [
  { value: 'notify_role', label: 'Notifier un rôle', icon: <Bell size={14} /> },
  { value: 'notify_user', label: 'Notifier un utilisateur', icon: <UserRound size={14} /> },
  { value: 'apply_discount', label: 'Appliquer une remise', icon: <Percent size={14} /> },
  { value: 'set_tag', label: 'Ajouter un tag', icon: <Tag size={14} /> },
  { value: 'change_status', label: 'Changer le statut', icon: <RefreshCw size={14} /> },
  { value: 'update_field', label: 'Modifier un champ', icon: <Settings2 size={14} /> },
  { value: 'send_webhook', label: 'Envoyer un webhook', icon: <Webhook size={14} /> },
  { value: 'block_action', label: "Bloquer l'action", icon: <Ban size={14} /> },
];

const ROLES = ['owner', 'manager', 'server', 'cashier', 'kitchen_staff'];
const CHANNELS = ['in_app', 'email', 'sms'];

const DEFAULT_PAYLOADS: Record<EventTrigger, Record<string, unknown>> = {
  'order.created': {
    tenantId: 'tenant-uuid',
    orderId: 'order-uuid',
    order: { total: 75000, type: 'delivery', items_count: 3 },
  },
  'order.state_changed': {
    tenantId: 'tenant-uuid',
    orderId: 'order-uuid',
    order: { total: 45000, type: 'dine_in', status: 'ready' },
  },
  'payment.received': {
    tenantId: 'tenant-uuid',
    paymentId: 'payment-uuid',
    payment: { amount: 50000, method: 'wave' },
  },
  'product.unavailable': {
    tenantId: 'tenant-uuid',
    product: { id: 'product-uuid', name: 'Thiéboudiène' },
  },
};

// ── Condition row ─────────────────────────────────────────────────────────────

function ConditionRow({
  condition,
  eventTrigger,
  onChange,
  onRemove,
}: {
  condition: RuleCondition;
  eventTrigger: EventTrigger;
  onChange: (c: RuleCondition) => void;
  onRemove: () => void;
}) {
  const fields = EVENT_FIELDS[eventTrigger] ?? [];
  const fieldDef = fields.find((f) => f.key === condition.field);
  const fieldType = fieldDef?.type ?? 'string';
  const operators = OPERATORS_BY_TYPE[fieldType] ?? OPERATORS_BY_TYPE.string;
  const operatorDef = operators.find((o) => o.value === condition.operator);

  function handleFieldChange(field: string) {
    const newDef = fields.find((f) => f.key === field);
    const newType = newDef?.type ?? 'string';
    const defaultOp = OPERATORS_BY_TYPE[newType][0]?.value ?? 'eq';
    onChange({ field, operator: defaultOp, value: undefined });
  }

  function handleValueChange(raw: string) {
    let val: unknown = raw;
    if (fieldType === 'number') val = raw === '' ? undefined : Number(raw);
    onChange({ ...condition, value: val });
  }

  function handleBetweenChange(idx: 0 | 1, raw: string) {
    const arr = Array.isArray(condition.value) ? [...(condition.value as number[])] : [0, 0];
    arr[idx] = raw === '' ? 0 : Number(raw);
    onChange({ ...condition, value: arr });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Field */}
      <select
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[160px]"
      >
        <option value="">— Champ —</option>
        {fields.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value, value: undefined })}
        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[160px]"
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value(s) */}
      {operatorDef?.hasValue && (
        <>
          {operatorDef.isBetween ? (
            <>
              <input
                type="number"
                placeholder="Min"
                value={Array.isArray(condition.value) ? String((condition.value as number[])[0] ?? '') : ''}
                onChange={(e) => handleBetweenChange(0, e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="text-slate-400 text-sm">et</span>
              <input
                type="number"
                placeholder="Max"
                value={Array.isArray(condition.value) ? String((condition.value as number[])[1] ?? '') : ''}
                onChange={(e) => handleBetweenChange(1, e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </>
          ) : fieldDef?.type === 'enum' && fieldDef.enumValues ? (
            <select
              value={String(condition.value ?? '')}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[130px]"
            >
              <option value="">— Valeur —</option>
              {fieldDef.enumValues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          ) : fieldType === 'number' ? (
            <input
              type="number"
              placeholder="Valeur"
              value={condition.value !== undefined ? String(condition.value) : ''}
              onChange={(e) => handleValueChange(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          ) : (
            <input
              type="text"
              placeholder="Valeur"
              value={condition.value !== undefined ? String(condition.value) : ''}
              onChange={(e) => handleValueChange(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
        </>
      )}

      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 transition p-1"
        title="Supprimer cette condition"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Action card ───────────────────────────────────────────────────────────────

function ActionCard({
  action,
  onChange,
  onRemove,
}: {
  action: RuleAction;
  onChange: (a: RuleAction) => void;
  onRemove: () => void;
}) {
  const typeDef = ACTION_TYPES.find((t) => t.value === action.type);

  function set(key: string, value: unknown) {
    onChange({ ...action, [key]: value });
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
      {/* Type selector */}
      <div className="flex items-center justify-between gap-2">
        <select
          value={action.type}
          onChange={(e) => onChange({ type: e.target.value })}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {ACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="text-slate-500">{typeDef?.icon}</div>
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Type-specific fields */}
      {action.type === 'notify_role' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Rôle</label>
            <select
              value={String(action['role'] ?? '')}
              onChange={(e) => set('role', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— Rôle —</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Canal</label>
            <select
              value={String(action['channel'] ?? '')}
              onChange={(e) => set('channel', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— Canal —</option>
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Message</label>
            <input
              type="text"
              placeholder="ex: Grande commande reçue ({{order.total}} F)"
              value={String(action['message'] ?? '')}
              onChange={(e) => set('message', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      )}

      {action.type === 'notify_user' && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">ID utilisateur</label>
            <input
              type="text"
              placeholder="UUID ou {{order.agentId}}"
              value={String(action['userId'] ?? '')}
              onChange={(e) => set('userId', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Message</label>
            <input
              type="text"
              placeholder="ex: Votre commande {{orderId}} est prête"
              value={String(action['message'] ?? '')}
              onChange={(e) => set('message', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      )}

      {action.type === 'apply_discount' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Type</label>
            <select
              value={String(action['discount_type'] ?? 'percentage')}
              onChange={(e) => set('discount_type', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="percentage">Pourcentage (%)</option>
              <option value="fixed">Montant fixe</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Valeur</label>
            <input
              type="number"
              placeholder={action['discount_type'] === 'percentage' ? '10' : '5000'}
              value={action['discount_value'] !== undefined ? String(action['discount_value']) : ''}
              onChange={(e) => set('discount_value', e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      )}

      {action.type === 'set_tag' && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tag</label>
          <input
            type="text"
            placeholder="ex: vip, large-order, priority"
            value={String(action['tag'] ?? '')}
            onChange={(e) => set('tag', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      )}

      {action.type === 'change_status' && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Statut cible</label>
          <input
            type="text"
            placeholder="ex: ready, cancelled, paid"
            value={String(action['target_status'] ?? '')}
            onChange={(e) => set('target_status', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      )}

      {action.type === 'update_field' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Entité</label>
            <select
              value={String(action['entity'] ?? 'order')}
              onChange={(e) => set('entity', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="order">order</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Champ</label>
            <input
              type="text"
              placeholder="ex: notes, delivery_address"
              value={String(action['field'] ?? '')}
              onChange={(e) => set('field', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Valeur</label>
            <input
              type="text"
              placeholder="ex: urgent"
              value={String(action['value'] ?? '')}
              onChange={(e) => set('value', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      )}

      {action.type === 'send_webhook' && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">URL</label>
              <input
                type="url"
                placeholder="https://example.com/webhook"
                value={String(action['url'] ?? '')}
                onChange={(e) => set('url', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Méthode</label>
              <select
                value={String(action['method'] ?? 'POST')}
                onChange={(e) => set('method', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Corps JSON (supporte {'{{field}}'})</label>
            <textarea
              rows={3}
              placeholder={'{"orderId": "{{orderId}}", "total": {{order.total}}}'}
              value={String(action['body'] ?? '')}
              onChange={(e) => set('body', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
        </div>
      )}

      {action.type === 'block_action' && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Message d'erreur</label>
          <input
            type="text"
            placeholder="ex: Commande bloquée — montant insuffisant"
            value={String(action['message'] ?? '')}
            onChange={(e) => set('message', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      )}
    </div>
  );
}

// ── Test modal ─────────────────────────────────────────────────────────────────

function TestModal({
  ruleId,
  eventTrigger,
  onClose,
}: {
  ruleId: string;
  eventTrigger: EventTrigger;
  onClose: () => void;
}) {
  const defaultPayload = DEFAULT_PAYLOADS[eventTrigger] ?? {};
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultPayload, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [result, setResult] = useState<TestRuleResult | null>(null);

  const { mutate: testRule, isPending } = useTestRule();

  function handleTest() {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      setJsonError('');
      testRule(
        { id: ruleId, payload: parsed },
        {
          onSuccess: (r) => setResult(r),
          onError: () => setJsonError('Erreur lors du test — vérifiez le payload'),
        },
      );
    } catch {
      setJsonError('JSON invalide');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FlaskConical size={18} className="text-violet-500" />
            Tester la règle
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Payload de test (JSON)
          </label>
          <textarea
            rows={10}
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setJsonError(''); setResult(null); }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
          />
          {jsonError && <p className="text-red-500 text-xs mt-1">{jsonError}</p>}
        </div>

        <button
          onClick={handleTest}
          disabled={isPending}
          className="w-full py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition mb-4"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
          Lancer le test
        </button>

        {result && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              {result.matched ? (
                <>
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <span className="font-semibold text-emerald-700">Règle déclenchée</span>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-slate-400" />
                  <span className="font-semibold text-slate-500">Conditions non remplies</span>
                </>
              )}
              <span className="ml-auto text-xs text-slate-400 uppercase tracking-wide">
                {result.condition_logic}
              </span>
            </div>

            <div className="space-y-1.5">
              {result.conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.result ? (
                    <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={13} className="text-red-400 flex-shrink-0" />
                  )}
                  <span className="font-mono text-xs text-slate-600">
                    {c.field} <span className="text-slate-400">{c.operator}</span>{' '}
                    {c.value !== undefined ? (
                      <span className="text-indigo-600">{JSON.stringify(c.value)}</span>
                    ) : null}
                  </span>
                  <span
                    className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      c.result
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {c.result ? '✓ vrai' : '✗ faux'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Editor page ────────────────────────────────────────────────────────────────

export default function RuleEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: rule, isLoading } = useRule(id);
  const { mutate: save, isPending: saving } = useUpdateRule();

  const [name, setName] = useState('');
  const [eventTrigger, setEventTrigger] = useState<EventTrigger>('order.created');
  const [conditionLogic, setConditionLogic] = useState<ConditionLogic>('AND');
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [saved, setSaved] = useState(false);

  // Populate form when rule loads
  useEffect(() => {
    if (!rule) return;
    setName(rule.name);
    setEventTrigger(rule.eventTrigger);
    setConditionLogic(rule.conditionLogic);
    setConditions(rule.conditions);
    setActions(rule.actions);
    setIsActive(rule.isActive);
  }, [rule]);

  function handleSave() {
    save(
      {
        id,
        name,
        event_trigger: eventTrigger,
        condition_logic: conditionLogic,
        conditions,
        actions,
        is_active: isActive,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  }

  // Conditions helpers
  function addCondition() {
    const fields = EVENT_FIELDS[eventTrigger] ?? [];
    const firstField = fields[0]?.key ?? '';
    const firstFieldType = fields[0]?.type ?? 'string';
    const firstOp = OPERATORS_BY_TYPE[firstFieldType][0]?.value ?? 'eq';
    setConditions([...conditions, { field: firstField, operator: firstOp, value: undefined }]);
  }

  function updateCondition(idx: number, c: RuleCondition) {
    setConditions(conditions.map((x, i) => (i === idx ? c : x)));
  }

  function removeCondition(idx: number) {
    setConditions(conditions.filter((_, i) => i !== idx));
  }

  // Actions helpers
  function addAction() {
    setActions([...actions, { type: 'notify_role', role: '', channel: 'in_app', message: '' }]);
  }

  function updateAction(idx: number, a: RuleAction) {
    setActions(actions.map((x, i) => (i === idx ? a : x)));
  }

  function removeAction(idx: number) {
    setActions(actions.filter((_, i) => i !== idx));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500">Règle introuvable.</p>
        <button
          onClick={() => router.push('/dashboard/settings/rules')}
          className="mt-3 text-indigo-600 text-sm hover:underline"
        >
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/settings/rules')}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold text-slate-900 bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none px-1 transition w-80"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Active toggle */}
          <button
            onClick={() => setIsActive(!isActive)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {isActive ? '● Active' : '○ Inactive'}
          </button>

          <button
            onClick={() => setShowTest(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition"
          >
            <FlaskConical size={14} />
            Tester
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={14} className="text-emerald-300" />
            ) : (
              <Save size={14} />
            )}
            {saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section: Déclencheur */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Déclencheur
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {EVENT_TRIGGERS.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setEventTrigger(t.value);
                  setConditions([]);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition text-left ${
                  eventTrigger === t.value
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Section: Conditions */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Conditions
            </h2>
            {/* AND/OR toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
              <button
                onClick={() => setConditionLogic('AND')}
                className={`px-3 py-1.5 transition ${
                  conditionLogic === 'AND'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                ET (toutes)
              </button>
              <button
                onClick={() => setConditionLogic('OR')}
                className={`px-3 py-1.5 transition ${
                  conditionLogic === 'OR'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                OU (une parmi)
              </button>
            </div>
          </div>

          {conditions.length === 0 && (
            <p className="text-sm text-slate-400 py-2">
              Aucune condition — la règle se déclenchera à chaque événement.
            </p>
          )}

          <div className="space-y-2 mb-3">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 w-6 text-center flex-shrink-0">
                    {conditionLogic}
                  </span>
                )}
                {i === 0 && <span className="w-6 flex-shrink-0" />}
                <div className="flex-1">
                  <ConditionRow
                    condition={c}
                    eventTrigger={eventTrigger}
                    onChange={(updated) => updateCondition(i, updated)}
                    onRemove={() => removeCondition(i)}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addCondition}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 transition"
          >
            <Plus size={14} />
            Ajouter une condition
          </button>
        </section>

        {/* Section: Actions */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Actions
          </h2>

          {actions.length === 0 && (
            <p className="text-sm text-slate-400 py-2">Aucune action configurée.</p>
          )}

          <div className="space-y-3 mb-3">
            {actions.map((a, i) => (
              <ActionCard
                key={i}
                action={a}
                onChange={(updated) => updateAction(i, updated)}
                onRemove={() => removeAction(i)}
              />
            ))}
          </div>

          <button
            onClick={addAction}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 transition"
          >
            <Plus size={14} />
            Ajouter une action
          </button>
        </section>

        {/* Save footer */}
        <div className="flex justify-end pt-2 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saved ? 'Enregistré ✓' : 'Enregistrer la règle'}
          </button>
        </div>
      </div>

      {showTest && (
        <TestModal
          ruleId={id}
          eventTrigger={eventTrigger}
          onClose={() => setShowTest(false)}
        />
      )}
    </div>
  );
}
