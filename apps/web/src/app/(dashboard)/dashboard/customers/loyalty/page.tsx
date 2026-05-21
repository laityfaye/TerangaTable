'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gift, Plus, Trash2, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLoyaltySettings, useUpdateLoyaltySettings, type LoyaltyReward } from '@/hooks/crm/use-customers';

// ── Reward row ─────────────────────────────────────────────────────────────────

const REWARD_TYPES = [
  { value: 'discount', label: 'Réduction' },
  { value: 'gift', label: 'Cadeau' },
  { value: 'upgrade', label: 'Upgrade' },
] as const;

function RewardRow({
  reward,
  onUpdate,
  onRemove,
}: {
  reward: LoyaltyReward;
  onUpdate: (r: LoyaltyReward) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="w-24 flex-shrink-0">
        <input
          type="number"
          min={1}
          value={reward.points_required}
          onChange={(e) => onUpdate({ ...reward, points_required: parseInt(e.target.value) || 1 })}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta text-center"
        />
        <p className="text-[10px] text-slate-400 text-center mt-0.5">points</p>
      </div>

      <div className="flex-1">
        <input
          value={reward.description}
          onChange={(e) => onUpdate({ ...reward, description: e.target.value })}
          placeholder="Description de la récompense"
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        />
      </div>

      <select
        value={reward.type}
        onChange={(e) => onUpdate({ ...reward, type: e.target.value as LoyaltyReward['type'] })}
        className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none bg-white text-slate-700"
      >
        {REWARD_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <button
        onClick={onRemove}
        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LoyaltyConfigPage() {
  const { data: settings, isLoading } = useLoyaltySettings();
  const { mutate: updateSettings, isPending: saving } = useUpdateLoyaltySettings();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    enabled: false,
    points_per_amount: 1000,
    redemption_points: 100,
    redemption_value: 500,
    expiry_days: 0,
    vip_threshold_type: 'percent' as 'percent' | 'amount',
    vip_threshold_value: 10,
    rewards: [] as LoyaltyReward[],
  });

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        points_per_amount: settings.points_per_amount,
        redemption_points: settings.redemption_points,
        redemption_value: settings.redemption_value,
        expiry_days: settings.expiry_days,
        vip_threshold_type: settings.vip_threshold_type,
        vip_threshold_value: settings.vip_threshold_value,
        rewards: settings.rewards ?? [],
      });
    }
  }, [settings]);

  function handleSave() {
    updateSettings(
      {
        ...form,
        rewards: form.rewards,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  }

  function addReward() {
    setForm((f) => ({
      ...f,
      rewards: [...f.rewards, { points_required: 100, description: '', type: 'discount' }],
    }));
  }

  function updateReward(idx: number, reward: LoyaltyReward) {
    setForm((f) => {
      const rewards = [...f.rewards];
      rewards[idx] = reward;
      return { ...f, rewards };
    });
  }

  function removeReward(idx: number) {
    setForm((f) => ({ ...f, rewards: f.rewards.filter((_, i) => i !== idx) }));
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded-xl w-48 animate-pulse" />
        <div className="bg-white rounded-2xl h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft size={15} />
          Retour aux clients
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Gift size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Programme fidélité</h1>
            <p className="text-sm text-slate-500">Configurez les règles de points et récompenses</p>
          </div>
        </div>
      </div>

      {/* Toggle activation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">Programme de fidélité</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {form.enabled
                ? 'Les clients gagnent des points à chaque achat'
                : 'Activez pour commencer à récompenser vos clients'}
            </p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
            className="transition-colors"
          >
            {form.enabled ? (
              <ToggleRight size={40} className="text-terracotta" />
            ) : (
              <ToggleLeft size={40} className="text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Points rules */}
      <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 transition-opacity ${!form.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="font-semibold text-slate-900">Règles des points</h2>

        {/* Earn rate */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Points gagnés</label>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>1 point par</span>
            <input
              type="number"
              min={1}
              value={form.points_per_amount}
              onChange={(e) => setForm((f) => ({ ...f, points_per_amount: parseInt(e.target.value) || 1 }))}
              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta font-semibold"
            />
            <span>XOF dépensé</span>
          </div>
        </div>

        {/* Redemption rate */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Valeur d&apos;un point</label>
          <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
            <input
              type="number"
              min={1}
              value={form.redemption_points}
              onChange={(e) => setForm((f) => ({ ...f, redemption_points: parseInt(e.target.value) || 1 }))}
              className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta font-semibold"
            />
            <span>points =</span>
            <input
              type="number"
              min={1}
              value={form.redemption_value}
              onChange={(e) => setForm((f) => ({ ...f, redemption_value: parseInt(e.target.value) || 1 }))}
              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta font-semibold"
            />
            <span>XOF de réduction</span>
          </div>
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Expiration des points</label>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="number"
              min={0}
              value={form.expiry_days}
              onChange={(e) => setForm((f) => ({ ...f, expiry_days: parseInt(e.target.value) || 0 }))}
              className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta font-semibold"
            />
            <span>jours</span>
            {form.expiry_days === 0 && (
              <span className="text-slate-400 text-xs">(0 = jamais)</span>
            )}
          </div>
        </div>

        {/* VIP threshold */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Seuil VIP</label>
          <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
            <span>Top</span>
            <input
              type="number"
              min={1}
              max={100}
              value={form.vip_threshold_value}
              onChange={(e) => setForm((f) => ({ ...f, vip_threshold_value: parseInt(e.target.value) || 10 }))}
              className="w-16 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta font-semibold"
            />
            <select
              value={form.vip_threshold_type}
              onChange={(e) => setForm((f) => ({ ...f, vip_threshold_type: e.target.value as 'percent' | 'amount' }))}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none bg-white text-slate-700"
            >
              <option value="percent">% des clients (par dépense)</option>
              <option value="amount">XOF dépensé minimum</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 transition-opacity ${!form.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Récompenses</h2>
          <button
            onClick={addReward}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Plus size={14} />
            Ajouter une récompense
          </button>
        </div>

        {form.rewards.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <Gift size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Aucune récompense définie</p>
            <button
              onClick={addReward}
              className="mt-2 text-xs text-terracotta hover:text-terracotta-dark underline"
            >
              Ajouter la première récompense
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {form.rewards.map((reward, idx) => (
              <RewardRow
                key={idx}
                reward={reward}
                onUpdate={(r) => updateReward(idx, r)}
                onRemove={() => removeReward(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
            saved
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-terracotta text-white hover:bg-terracotta-dark'
          }`}
        >
          {saved ? (
            <><Check size={16} /> Configuration sauvegardée</>
          ) : saving ? (
            'Sauvegarde…'
          ) : (
            'Sauvegarder la configuration'
          )}
        </button>
      </div>
    </div>
  );
}
