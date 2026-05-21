'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { useOpenPosSession } from '@/hooks/pos/use-pos-session';

interface Props {
  open:     boolean;
  onSuccess: () => void;
}

export function SessionOpenModal({ open, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const { mutate: openSession, isPending, error } = useOpenPosSession();

  if (!open) return null;

  const numAmount = parseFloat(amount) || 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    openSession({ opening_amount: numAmount }, { onSuccess });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-slate-100">
            <div className="w-14 h-14 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-7 h-7 text-terracotta" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">Ouvrir la caisse</h2>
            <p className="text-sm text-slate-500 mt-1">
              Saisissez le fond de caisse initial en espèces
            </p>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fond de caisse (FCFA)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-2xl font-mono text-slate-900 text-center placeholder:text-slate-300 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1.5 text-center">
                Montant en espèces présent au début du service
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center">
                {(error as Error).message}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[5000, 10000, 25000, 50000, 75000, 100000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v.toString())}
                  className="py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-terracotta hover:text-terracotta hover:bg-terracotta/5 transition-colors"
                >
                  {(v / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-14 bg-terracotta text-white rounded-xl font-bold text-base font-heading hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isPending ? 'Ouverture…' : 'Ouvrir la caisse'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
