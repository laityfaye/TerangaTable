'use client';

import { useState } from 'react';
import {
  X,
  TrendingUp,
  Banknote,
  CreditCard,
  Smartphone,
  Globe,
  Ticket,
  Clock,
  ShoppingBag,
  ChevronRight,
  Printer,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  StickyNote,
  Loader2,
} from 'lucide-react';
import {
  useClosePosSession,
  usePosSessionStats,
  type PosSession,
} from '@/hooks/pos/use-pos-session';
import { printZReport } from '../utils/ticket-printer';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  session: PosSession;
  onClose: () => void;
}

type Step = 'recap' | 'count' | 'done';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v) + ' F';
}

function sessionDuration(openedAt: string): string {
  const mins = Math.floor((Date.now() - new Date(openedAt).getTime()) / 60_000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ['recap', 'count', 'done'];
  return (
    <div className="flex gap-1.5">
      {steps.map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all ${
            s === step ? 'w-4 bg-terracotta' : 'w-1.5 bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SessionCloseModal({ open, session, onClose }: Props) {
  const router = useRouter();
  const [step, setStep]                   = useState<Step>('recap');
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes]                 = useState('');
  const [closedSession, setClosedSession] = useState<PosSession | null>(null);

  const { mutate: closeSession, isPending, error, reset: resetMutation } = useClosePosSession();

  // ── Live stats (fetched when modal opens) ──
  const { data: stats, isLoading: statsLoading } = usePosSessionStats(open);

  if (!open) return null;

  // ── Computed from live stats ──
  const totalOrders   = stats?.totalOrders   ?? 0;
  const totalSales    = stats?.totalSales    ?? 0;
  const salesByMethod = stats?.salesByMethod ?? {};
  const openingAmount = stats?.openingAmount ?? Number(session.openingAmount);

  const cash        = salesByMethod.cash         ?? 0;
  const mobileMoney = salesByMethod.mobile_money ?? 0;
  const card        = salesByMethod.card         ?? 0;
  const online      = salesByMethod.online       ?? 0;
  const voucher     = salesByMethod.voucher      ?? 0;

  const avgOrder     = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const duration     = sessionDuration(session.openedAt);

  // ── Cash count step computed ──
  const numClosing  = parseFloat(closingAmount) || 0;
  const theoretical = openingAmount + cash;
  const cashDiff    = numClosing - theoretical;
  const diffPositive = cashDiff >= 0;

  // ── Actions ──
  function handleConfirmClose() {
    closeSession(
      {
        closing_amount: numClosing,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      {
        onSuccess: (closed) => {
          setClosedSession(closed ?? session);
          setStep('done');
        },
      },
    );
  }

  function handlePrintZ() {
    const data = closedSession ?? session;
    const zPayload = {
      restaurantName:  'TÉRANGATABLE',
      openedBy:        `${data.openedBy.firstName} ${data.openedBy.lastName}`,
      openedAt:        data.openedAt,
      closedAt:        data.closedAt ?? new Date().toISOString(),
      durationLabel:   duration,
      totalSales:      data.totalSales || totalSales,
      totalOrders:     data.totalOrders || totalOrders,
      avgOrderValue:   avgOrder,
      openingAmount,
      salesByMethod:   Object.keys(data.salesByMethod ?? {}).length
        ? (data.salesByMethod ?? {})
        : salesByMethod,
      cashCounted:     numClosing,
      cashTheoretical: theoretical,
      cashDifference:  cashDiff,
      currencyCode:    'XOF' as const,
      locale:          'fr-SN',
    };
    if (data.closedBy) {
      (zPayload as Record<string, unknown>)['closedBy'] =
        `${data.closedBy.firstName} ${data.closedBy.lastName}`;
    }
    if (notes.trim()) {
      (zPayload as Record<string, unknown>)['notes'] = notes.trim();
    }
    printZReport(zPayload);
  }

  function handleDone() {
    router.push('/dashboard');
  }

  function handleBack() {
    resetMutation();
    setStep('recap');
  }

  // ── Step: Récapitulatif ────────────────────────────────────────────────────

  const StepRecap = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-6 pt-5 flex-1 overflow-y-auto space-y-3">

        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-terracotta" />
          </div>
        ) : (
          <>
            {/* Durée + panier moyen */}
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                <Clock size={14} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">Durée du service</p>
                  <p className="text-sm font-bold text-slate-800">{duration}</p>
                </div>
              </div>
              {avgOrder > 0 && (
                <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                  <TrendingUp size={14} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">Panier moyen</p>
                    <p className="text-sm font-bold text-slate-800">{fmt(avgOrder)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tableau récapitulatif */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">

              {/* Fond initial */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Banknote size={15} className="text-slate-400" />
                  <span className="font-medium">Fond initial</span>
                </div>
                <span className="font-mono font-semibold text-slate-700">
                  {fmt(openingAmount)}
                </span>
              </div>

              {/* Nb commandes */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <ShoppingBag size={15} className="text-slate-400" />
                  <span className="font-medium">Nombre de commandes</span>
                </div>
                <span className="font-bold text-slate-900 text-base">
                  {totalOrders}
                </span>
              </div>

              {/* Séparateur encaissements */}
              <div className="px-4 py-1.5 bg-white border-b border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Encaissements
                </p>
              </div>

              {/* Espèces */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-sm">
                  <Banknote size={15} className="text-green-500" />
                  <span className="font-medium text-slate-700">Espèces</span>
                </div>
                <span className={`font-mono font-bold text-sm ${cash > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                  {fmt(cash)}
                </span>
              </div>

              {/* Wave / Orange Money */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-sm">
                  <Smartphone size={15} className="text-blue-500" />
                  <div>
                    <span className="font-medium text-slate-700">Wave</span>
                    <span className="text-slate-400 mx-1">·</span>
                    <span className="font-medium text-slate-700">Orange Money</span>
                  </div>
                </div>
                <span className={`font-mono font-bold text-sm ${mobileMoney > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                  {fmt(mobileMoney)}
                </span>
              </div>

              {/* Carte */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-sm">
                  <CreditCard size={15} className="text-purple-500" />
                  <span className="font-medium text-slate-700">Carte bancaire</span>
                </div>
                <span className={`font-mono font-bold text-sm ${card > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                  {fmt(card)}
                </span>
              </div>

              {/* En ligne si > 0 */}
              {online > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Globe size={15} className="text-sky-500" />
                    <span className="font-medium text-slate-700">En ligne</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900">{fmt(online)}</span>
                </div>
              )}

              {/* Bons si > 0 */}
              {voucher > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Ticket size={15} className="text-amber-500" />
                    <span className="font-medium text-slate-700">Bons</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900">{fmt(voucher)}</span>
                </div>
              )}

              {/* TOTAL */}
              <div className="flex items-center justify-between px-4 py-3.5 bg-terracotta/5 border-t border-terracotta/20">
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={15} className="text-terracotta" />
                  <span className="text-sm font-bold text-slate-900">TOTAL ENCAISSÉ</span>
                </div>
                <span className="font-mono font-bold text-terracotta text-lg">
                  {fmt(totalSales)}
                </span>
              </div>

            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={() => setStep('count')}
          disabled={statsLoading}
          className="flex-1 py-3 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          Fermer la caisse
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );

  // ── Step: Comptage ─────────────────────────────────────────────────────────

  const StepCount = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-6 pt-4 flex-1 overflow-y-auto space-y-4">

        {/* Theoretical */}
        <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Fond + Espèces perçues</p>
            <p className="text-xs text-slate-600 font-medium">Théorique caisse</p>
          </div>
          <span className="font-mono font-bold text-slate-900 text-lg">{fmt(theoretical)}</span>
        </div>

        {/* Cash input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Espèces comptées en caisse
          </label>
          <input
            type="number"
            min="0"
            step="500"
            value={closingAmount}
            onChange={(e) => setClosingAmount(e.target.value)}
            placeholder={theoretical.toString()}
            className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-2xl font-mono text-center text-slate-900 placeholder:text-slate-300 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            autoFocus
          />
          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setClosingAmount(v.toString())}
                className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  closingAmount === v.toString()
                    ? 'border-terracotta text-terracotta bg-terracotta/5'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {v >= 1000 ? `${v / 1000}k` : v}
              </button>
            ))}
          </div>
        </div>

        {/* Difference */}
        {numClosing > 0 && (
          <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${
            diffPositive
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {diffPositive
                ? <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                : <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
              }
              <span className={`text-sm font-medium ${diffPositive ? 'text-green-700' : 'text-red-600'}`}>
                {diffPositive ? 'Excédent espèces' : 'Manque espèces'}
              </span>
            </div>
            <span className={`font-mono font-bold text-base ${diffPositive ? 'text-green-700' : 'text-red-600'}`}>
              {diffPositive ? '+' : ''}{fmt(cashDiff)}
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mb-1.5">
            <StickyNote size={13} />
            Notes de clôture <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Observations, incidents, remarques…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 resize-none placeholder:text-slate-300 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl text-center border border-red-100">
            {(error as Error).message}
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
        <button
          onClick={handleBack}
          className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <ChevronLeft size={15} />
          Retour
        </button>
        <button
          onClick={handleConfirmClose}
          disabled={isPending || numClosing <= 0}
          className="flex-1 py-3 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-terracotta-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? 'Fermeture en cours…' : 'Confirmer la fermeture'}
        </button>
      </div>
    </div>
  );

  // ── Step: Succès ───────────────────────────────────────────────────────────

  const StepDone = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-6 pt-6 flex-1 overflow-y-auto space-y-5">

        {/* Success badge */}
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-9 h-9 text-green-500" strokeWidth={1.8} />
          </div>
          <p className="text-lg font-bold text-slate-900">Caisse fermée</p>
          <p className="text-sm text-slate-500 mt-1">Service terminé · {duration}</p>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-2xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-slate-500">Total encaissé</span>
            <span className="font-mono font-bold text-terracotta">{fmt(totalSales)}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-slate-500">Commandes</span>
            <span className="font-bold text-slate-900">{totalOrders}</span>
          </div>
          {numClosing > 0 && (
            <>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-500">Espèces comptées</span>
                <span className="font-mono font-semibold text-slate-900">{fmt(numClosing)}</span>
              </div>
              <div className={`flex justify-between px-4 py-2.5 text-sm ${diffPositive ? 'text-green-700' : 'text-red-600'}`}>
                <span>Écart espèces</span>
                <span className="font-mono font-bold">{diffPositive ? '+' : ''}{fmt(cashDiff)}</span>
              </div>
            </>
          )}
        </div>

        {/* Print Z button */}
        <button
          onClick={handlePrintZ}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-terracotta hover:text-terracotta hover:bg-terracotta/5 transition-all"
        >
          <Printer size={16} />
          Imprimer le Ticket Z
        </button>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex-shrink-0">
        <button
          onClick={handleDone}
          className="w-full py-3.5 rounded-xl bg-terracotta text-white font-bold text-base font-heading hover:bg-terracotta-dark transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  // ── Titles ────────────────────────────────────────────────────────────────

  const TITLES: Record<Step, { title: string; sub: string }> = {
    recap: { title: 'Fermer la caisse',  sub: 'Récapitulatif du service' },
    count: { title: 'Comptage espèces',  sub: 'Saisissez le fond comptée' },
    done:  { title: 'Caisse fermée',     sub: 'Ticket Z · Fin de service' },
  };

  const { title, sub } = TITLES[step];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={step !== 'done' ? onClose : undefined}
      />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
            <div className="flex items-center gap-3">
              <StepDots step={step} />
              {step !== 'done' && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          {step === 'recap' && StepRecap}
          {step === 'count' && StepCount}
          {step === 'done'  && StepDone}

        </div>
      </div>
    </>
  );
}
