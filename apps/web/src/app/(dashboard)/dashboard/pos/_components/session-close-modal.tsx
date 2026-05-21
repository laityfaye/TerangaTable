'use client';

import { useState } from 'react';
import { X, TrendingUp, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { useClosePosSession, type PosSession } from '@/hooks/pos/use-pos-session';
import { useRouter } from 'next/navigation';

interface Props {
  open:    boolean;
  session: PosSession;
  onClose: () => void;
}

function fmt(v: number) {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v) + ' F';
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  cash:         <Banknote size={14} />,
  card:         <CreditCard size={14} />,
  mobile_money: <Smartphone size={14} />,
};

const METHOD_LABELS: Record<string, string> = {
  cash:         'Espèces',
  card:         'Carte',
  mobile_money: 'Mobile Money',
  online:       'Online',
  voucher:      'Bon',
};

export function SessionCloseModal({ open, session, onClose }: Props) {
  const router = useRouter();
  const [closingAmount, setClosingAmount] = useState('');
  const { mutate: closeSession, isPending, error } = useClosePosSession();

  if (!open) return null;

  const numClosing    = parseFloat(closingAmount) || 0;
  const cashSales     = session.salesByMethod?.cash ?? 0;
  const theoretical   = parseFloat(session.openingAmount.toString()) + cashSales;
  const cashDiff      = numClosing - theoretical;
  const diffPositive  = cashDiff >= 0;

  function handleClose(e: React.FormEvent) {
    e.preventDefault();
    closeSession(
      { closing_amount: numClosing },
      {
        onSuccess: () => {
          router.push('/dashboard');
        },
      },
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">Fermer la caisse</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ticket Z — Récapitulatif du service</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Recap */}
          <div className="px-6 py-4 space-y-3">
            {/* Totals row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <TrendingUp size={16} className="text-terracotta mx-auto mb-1" />
                <p className="text-xs text-slate-500">Total ventes</p>
                <p className="font-mono font-bold text-slate-900 text-sm">{fmt(session.totalSales)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-terracotta">{session.totalOrders}</p>
                <p className="text-xs text-slate-500">Commandes</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Fond initial</p>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {fmt(parseFloat(session.openingAmount.toString()))}
                </p>
              </div>
            </div>

            {/* By method */}
            {Object.keys(session.salesByMethod ?? {}).length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Ventes par méthode
                </div>
                {Object.entries(session.salesByMethod ?? {}).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {METHOD_ICONS[method] ?? null}
                      <span>{METHOD_LABELS[method] ?? method}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 text-sm">
                      {fmt(amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Cash count */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Espèces comptées
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder={theoretical.toString()}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-mono text-center text-slate-900 placeholder:text-slate-300 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              />
              <p className="text-xs text-slate-400 mt-1">
                Théorique : {fmt(theoretical)} (fond + espèces perçues)
              </p>
            </div>

            {/* Diff */}
            {numClosing > 0 && (
              <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
                diffPositive
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <span className={`text-sm font-medium ${diffPositive ? 'text-green-700' : 'text-red-600'}`}>
                  Écart espèces
                </span>
                <span className={`font-mono font-bold ${diffPositive ? 'text-green-700' : 'text-red-600'}`}>
                  {diffPositive ? '+' : ''}{fmt(cashDiff)}
                </span>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center">
                {(error as Error).message}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <form onSubmit={handleClose} className="flex-1">
              <button
                type="submit"
                disabled={isPending || numClosing <= 0}
                className="w-full py-3 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-terracotta-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'Fermeture…' : 'Confirmer la fermeture'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
