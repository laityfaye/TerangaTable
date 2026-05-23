'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Printer, ChevronLeft } from 'lucide-react';
import { useCreatePayment, type PaymentMethod } from '@/hooks/payments/use-payments';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PaymentSuccess {
  method:      PaymentMethod;
  methodLabel: string;
  amountPaid:  number;
  change:      number;
}

interface PaymentModalProps {
  open:          boolean;
  onClose:       () => void;
  orderId:       string;
  orderTotal:    number;
  alreadyPaid:   number;
  currencyCode:  string;
  locale:        string;
  onSuccess?:    (payment: PaymentSuccess) => void;
}

type Step = 'method' | 'amount' | 'confirm';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, locale: string, currencyCode: string) {
  return new Intl.NumberFormat(locale, {
    style:    'currency',
    currency: currencyCode,
    maximumFractionDigits: currencyCode === 'XOF' ? 0 : 2,
  }).format(amount);
}

const METHOD_CONFIG: Record<PaymentMethod, { icon: string; label: string; color: string }> = {
  cash:         { icon: '💵', label: 'Espèces',      color: '#22C55E' },
  mobile_money: { icon: '📱', label: 'Wave',         color: '#3B82F6' },
  card:         { icon: '💳', label: 'Carte',        color: '#8B5CF6' },
  online:       { icon: '🌐', label: 'Online',       color: '#0EA5E9' },
  voucher:      { icon: '🎟️', label: 'Bon / Voucher', color: '#F59E0B' },
};

// Orange Money treated as mobile_money variant — use a separate UI card
const DISPLAYED_METHODS: Array<{ method: PaymentMethod; icon: string; label: string }> = [
  { method: 'cash',         icon: '💵', label: 'Espèces' },
  { method: 'mobile_money', icon: '📱', label: 'Wave' },
  { method: 'mobile_money', icon: '🟠', label: 'Orange Money' },
  { method: 'card',         icon: '💳', label: 'Carte' },
];

// ── Step 1 — Method ────────────────────────────────────────────────────────────

function StepMethod({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (method: PaymentMethod, label: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">Choisissez le mode de paiement</p>
      <div className="grid grid-cols-2 gap-3">
        {DISPLAYED_METHODS.map(({ method, icon, label }) => {
          const isActive = selected === `${method}:${label}`;
          const config   = METHOD_CONFIG[method];
          return (
            <button
              key={`${method}:${label}`}
              onClick={() => onSelect(method, label)}
              className={`flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-[var(--brand)] bg-[var(--brand)]/5 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              style={isActive ? { '--brand': config.color } as React.CSSProperties : undefined}
            >
              <span className="text-3xl">{icon}</span>
              <span
                className={`text-sm font-semibold ${
                  isActive ? 'text-slate-900' : 'text-slate-600'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2 — Amount ────────────────────────────────────────────────────────────

function StepAmount({
  method,
  methodLabel,
  remaining,
  locale,
  currencyCode,
  amount,
  reference,
  onChange,
}: {
  method:       PaymentMethod;
  methodLabel:  string;
  remaining:    number;
  locale:       string;
  currencyCode: string;
  amount:       string;
  reference:    string;
  onChange:     (field: 'amount' | 'reference', value: string) => void;
}) {
  const numAmount  = parseFloat(amount) || 0;
  const isCash     = method === 'cash';
  const change     = isCash ? numAmount - remaining : 0;
  const changePos  = change >= 0;

  const isMobile   = method === 'mobile_money';

  return (
    <div className="space-y-4">
      {/* Due */}
      <div className="bg-slate-50 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Montant dû</p>
        <p className="text-3xl font-bold text-slate-900 font-mono">
          {formatCurrency(remaining, locale, currencyCode)}
        </p>
        <p className="text-xs text-slate-400 mt-1">{methodLabel}</p>
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          {isCash ? 'Montant reçu' : 'Montant payé'}
        </label>
        <input
          type="number"
          min="0.01"
          step="1"
          value={amount}
          onChange={(e) => onChange('amount', e.target.value)}
          placeholder={remaining.toString()}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg font-mono text-slate-900 placeholder:text-slate-300 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
      </div>

      {/* Change (cash only) */}
      {isCash && numAmount > 0 && (
        <div
          className={`rounded-lg px-4 py-3 flex items-center justify-between ${
            changePos ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <span className={`text-sm font-medium ${changePos ? 'text-green-700' : 'text-red-600'}`}>
            {changePos ? 'Rendu monnaie' : 'Insuffisant'}
          </span>
          <span className={`font-mono font-bold ${changePos ? 'text-green-700' : 'text-red-600'}`}>
            {changePos ? '+' : ''}{formatCurrency(change, locale, currencyCode)}
          </span>
        </div>
      )}

      {/* Reference (mobile money) */}
      {isMobile && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Référence transaction <span className="text-slate-400">(optionnel)</span>
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => onChange('reference', e.target.value)}
            placeholder="Ex: TXN-12345"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>
      )}
    </div>
  );
}

// ── Step 3 — Confirm ───────────────────────────────────────────────────────────

function StepConfirm({
  method,
  methodLabel,
  amount,
  change,
  locale,
  currencyCode,
  onPrint,
}: {
  method:       PaymentMethod;
  methodLabel:  string;
  amount:       number;
  change:       number;
  locale:       string;
  currencyCode: string;
  onPrint:      () => void;
}) {
  const config = METHOD_CONFIG[method];

  return (
    <div className="text-center space-y-5">
      <div className="flex flex-col items-center gap-2">
        <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={1.5} />
        <h3 className="text-xl font-bold text-slate-900">Paiement enregistré</h3>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Mode</span>
          <span className="font-medium text-slate-800">
            {config.icon} {methodLabel}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Montant</span>
          <span className="font-mono font-semibold text-slate-900">
            {formatCurrency(amount, locale, currencyCode)}
          </span>
        </div>
        {method === 'cash' && change > 0 && (
          <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
            <span className="text-slate-500">Rendu</span>
            <span className="font-mono font-semibold text-green-600">
              {formatCurrency(change, locale, currencyCode)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onPrint}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Printer size={16} />
        Imprimer le reçu
      </button>
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export function PaymentModal({
  open,
  onClose,
  orderId,
  orderTotal,
  alreadyPaid,
  currencyCode,
  locale,
  onSuccess,
}: PaymentModalProps) {
  const remaining = parseFloat((orderTotal - alreadyPaid).toFixed(2));

  const [step, setStep]               = useState<Step>('method');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [methodLabel, setMethodLabel] = useState('');
  const [amount, setAmount]           = useState(remaining.toString());
  const [reference, setReference]     = useState('');
  const [confirmedAmount, setConfirmedAmount] = useState(0);

  const { mutate: createPayment, isPending } = useCreatePayment();

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('method');
      setSelectedKey(null);
      setSelectedMethod(null);
      setMethodLabel('');
      setAmount(remaining.toString());
      setReference('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const numAmount = parseFloat(amount) || 0;
  const change    = selectedMethod === 'cash' ? numAmount - remaining : 0;

  function handleMethodSelect(method: PaymentMethod, label: string) {
    setSelectedMethod(method);
    setMethodLabel(label);
    setSelectedKey(`${method}:${label}`);
  }

  function handleConfirm() {
    if (!selectedMethod) return;

    createPayment(
      {
        order_id: orderId,
        method:   selectedMethod,
        amount:   numAmount,
        ...(reference ? { reference } : {}),
      },
      {
        onSuccess: () => {
          setConfirmedAmount(numAmount);
          setStep('confirm');
          onSuccess?.({
            method:      selectedMethod!,
            methodLabel: methodLabel,
            amountPaid:  numAmount,
            change:      Math.max(0, change),
          });
        },
      },
    );
  }

  const canProceedToAmount = !!selectedMethod;
  const canConfirm         = numAmount > 0 && numAmount <= remaining + 0.001;

  const STEP_TITLES: Record<Step, string> = {
    method:  'Mode de paiement',
    amount:  'Saisie du montant',
    confirm: 'Paiement confirmé',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            {step !== 'method' && step !== 'confirm' && (
              <button
                onClick={() => setStep('method')}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors -ml-1"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900 text-base">
                {STEP_TITLES[step]}
              </h2>
              {step !== 'confirm' && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Solde restant : {formatCurrency(remaining, locale, currencyCode)}
                </p>
              )}
            </div>
            {/* Step dots */}
            <div className="flex gap-1.5">
              {(['method', 'amount', 'confirm'] as Step[]).map((s) => (
                <div
                  key={s}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    s === step ? 'bg-terracotta' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 'method' && (
              <StepMethod selected={selectedKey} onSelect={handleMethodSelect} />
            )}
            {step === 'amount' && selectedMethod && (
              <StepAmount
                method={selectedMethod}
                methodLabel={methodLabel}
                remaining={remaining}
                locale={locale}
                currencyCode={currencyCode}
                amount={amount}
                reference={reference}
                onChange={(field, value) =>
                  field === 'amount' ? setAmount(value) : setReference(value)
                }
              />
            )}
            {step === 'confirm' && selectedMethod && (
              <StepConfirm
                method={selectedMethod}
                methodLabel={methodLabel}
                amount={confirmedAmount}
                change={change}
                locale={locale}
                currencyCode={currencyCode}
                onPrint={() => window.print()}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            {step === 'confirm' ? (
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-[#B14530] transition-colors"
              >
                Fermer
              </button>
            ) : step === 'method' ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  disabled={!canProceedToAmount}
                  onClick={() => setStep('amount')}
                  className="flex-1 py-3 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-[#B14530] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  disabled={!canConfirm || isPending}
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-[#B14530] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Enregistrement…' : 'Confirmer'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
