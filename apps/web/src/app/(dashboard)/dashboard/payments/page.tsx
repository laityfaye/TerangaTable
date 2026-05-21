'use client';

import { useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  usePayments,
  usePaymentSummary,
  useRefundPayment,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
  type ListPaymentsQuery,
} from '@/hooks/payments/use-payments';
import { useAuthStore } from '@/stores/auth.store';

// ── Region helpers ─────────────────────────────────────────────────────────────

const REGION_CURRENCY: Record<string, { currencyCode: string; locale: string }> = {
  dakar:         { currencyCode: 'XOF', locale: 'fr-SN' },
  thies:         { currencyCode: 'XOF', locale: 'fr-SN' },
  'saint-louis': { currencyCode: 'XOF', locale: 'fr-SN' },
  ziguinchor:    { currencyCode: 'XOF', locale: 'fr-SN' },
  abidjan:       { currencyCode: 'XOF', locale: 'fr-CI' },
  casablanca:    { currencyCode: 'MAD', locale: 'fr-MA' },
  paris:         { currencyCode: 'EUR', locale: 'fr-FR' },
};

// ── Constants ──────────────────────────────────────────────────────────────────

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash:         'Espèces',
  card:         'Carte',
  mobile_money: 'Mobile Money',
  online:       'Online',
  voucher:      'Bon',
};

const METHOD_ICON: Record<PaymentMethod, string> = {
  cash:         '💵',
  card:         '💳',
  mobile_money: '📱',
  online:       '🌐',
  voucher:      '🎟️',
};

const STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  pending:   { label: 'En attente',  className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Complété',    className: 'bg-green-100 text-green-700' },
  failed:    { label: 'Échoué',      className: 'bg-red-100 text-red-600' },
  refunded:  { label: 'Remboursé',   className: 'bg-slate-100 text-slate-600' },
};

const METHOD_COLORS: Partial<Record<PaymentMethod, string>> = {
  cash:         '#22C55E',
  card:         '#8B5CF6',
  mobile_money: '#3B82F6',
  online:       '#0EA5E9',
  voucher:      '#F59E0B',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, locale: string, currencyCode: string) {
  return new Intl.NumberFormat(locale, {
    style:    'currency',
    currency: currencyCode,
    maximumFractionDigits: currencyCode === 'XOF' ? 0 : 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]!;
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────

function DonutChart({
  data,
  total,
}: {
  data:  Partial<Record<PaymentMethod, number>>;
  total: number;
}) {
  const methods  = Object.keys(data) as PaymentMethod[];
  const radius   = 40;
  const cx       = 52;
  const cy       = 52;
  const stroke   = 18;
  const circumf  = 2 * Math.PI * radius;

  let offset = 0;
  const slices = methods.map((m) => {
    const pct  = total > 0 ? (data[m]! / total) : 0;
    const dash = pct * circumf;
    const gap  = circumf - dash;
    const s    = { method: m, offset, dash, gap };
    offset    += dash;
    return s;
  });

  if (methods.length === 0) return null;

  return (
    <svg width={104} height={104} className="flex-shrink-0">
      {slices.map(({ method, offset: off, dash, gap }) => (
        <circle
          key={method}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={METHOD_COLORS[method] ?? '#CBD5E1'}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={-off}
          transform={`rotate(-90, ${cx}, ${cy})`}
        />
      ))}
      {/* Inner hole background */}
      <circle cx={cx} cy={cy} r={radius - stroke / 2 - 1} fill="white" />
    </svg>
  );
}

// ── Refund modal ───────────────────────────────────────────────────────────────

function RefundModal({
  payment,
  locale,
  currencyCode,
  onClose,
  onConfirm,
  isPending,
}: {
  payment:      Payment;
  locale:       string;
  currencyCode: string;
  onClose:      () => void;
  onConfirm:    (reason: string) => void;
  isPending:    boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Confirmer le remboursement</h3>
              <p className="text-xs text-slate-500">
                {formatCurrency(payment.amount, locale, currencyCode)} ·{' '}
                {METHOD_ICON[payment.method]} {METHOD_LABEL[payment.method]}
              </p>
            </div>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Raison du remboursement (optionnel)"
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta resize-none"
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Traitement…' : 'Rembourser'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const regionSlug   = useAuthStore((s) => s.user?.regionSlug ?? '');
  const regionCfg    = REGION_CURRENCY[regionSlug] ?? { currencyCode: 'XOF', locale: 'fr-SN' };
  const locale       = regionCfg.locale;
  const currencyCode = regionCfg.currencyCode;

  const [filters, setFilters] = useState<ListPaymentsQuery>({
    date_from: todayISO(),
    page: 1,
    limit: 50,
  });

  const { data, isLoading, refetch, isFetching } = usePayments(filters);
  const { data: summary } = usePaymentSummary({
    ...(filters.date_from ? { date_from: filters.date_from } : {}),
    ...(filters.date_to   ? { date_to:   filters.date_to   } : {}),
  });

  const { mutate: refundPayment, isPending: refunding } = useRefundPayment();
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);

  const payments    = data?.data ?? [];
  const meta        = data?.meta;
  const totalPages  = meta?.totalPages ?? 1;

  function setFilter(key: keyof ListPaymentsQuery, value: string | undefined) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Paiements</h1>
          <p className="text-sm text-slate-500 font-body mt-0.5">
            Historique & encaissements
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            Total encaissé
          </p>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {summary ? formatCurrency(summary.total, locale, currencyCode) : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {summary?.count ?? 0} transaction{(summary?.count ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* By method list */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Par méthode
          </p>
          <div className="space-y-2">
            {summary && Object.keys(summary.by_method).length > 0 ? (
              (Object.entries(summary.by_method) as [PaymentMethod, number][]).map(
                ([method, amount]) => (
                  <div key={method} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {METHOD_ICON[method]} {METHOD_LABEL[method]}
                    </span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCurrency(amount, locale, currencyCode)}
                    </span>
                  </div>
                ),
              )
            ) : (
              <p className="text-xs text-slate-400">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* Donut */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center justify-center gap-5">
          {summary && summary.total > 0 ? (
            <>
              <DonutChart data={summary.by_method} total={summary.total} />
              <div className="space-y-1.5">
                {(Object.keys(summary.by_method) as PaymentMethod[]).map((m) => (
                  <div key={m} className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: METHOD_COLORS[m] ?? '#CBD5E1' }}
                    />
                    {METHOD_LABEL[m]}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Graphique indisponible</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Du</label>
            <input
              type="date"
              value={filters.date_from ?? ''}
              onChange={(e) => setFilter('date_from', e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Au</label>
            <input
              type="date"
              value={filters.date_to ?? ''}
              onChange={(e) => setFilter('date_to', e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Méthode</label>
            <select
              value={filters.method ?? ''}
              onChange={(e) => setFilter('method', e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            >
              <option value="">Toutes</option>
              {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>{METHOD_LABEL[m]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
            <select
              value={filters.status ?? ''}
              onChange={(e) => setFilter('status', e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
            >
              <option value="">Tous</option>
              {(Object.keys(STATUS_CONFIG) as PaymentStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setFilters({ date_from: todayISO(), page: 1, limit: 50 })}
            className="py-2 px-3 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 text-sm">Aucun paiement pour cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Date / Heure</th>
                  <th className="text-left px-5 py-3">Commande</th>
                  <th className="text-right px-5 py-3">Montant</th>
                  <th className="text-left px-5 py-3">Méthode</th>
                  <th className="text-left px-5 py-3">Référence</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((payment) => {
                  const statusCfg = STATUS_CONFIG[payment.status];
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap font-mono text-xs">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        {payment.order ? (
                          <span className="font-mono text-xs font-medium text-slate-700">
                            {payment.order.order_number}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-semibold ${
                            payment.amount < 0 ? 'text-red-500' : 'text-slate-900'
                          }`}
                        >
                          {payment.amount < 0 ? '-' : ''}
                          {formatCurrency(Math.abs(payment.amount), locale, currencyCode)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {METHOD_ICON[payment.method]} {METHOD_LABEL[payment.method]}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">
                        {payment.reference ?? '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => setRefundTarget(payment)}
                            className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline transition-colors"
                          >
                            Rembourser
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)} sur {meta.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={meta.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-medium text-slate-700">
                {meta.page} / {totalPages}
              </span>
              <button
                disabled={meta.page >= totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund modal */}
      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          locale={locale}
          currencyCode={currencyCode}
          onClose={() => setRefundTarget(null)}
          isPending={refunding}
          onConfirm={(reason) => {
            refundPayment(
              { id: refundTarget.id, reason },
              { onSuccess: () => setRefundTarget(null) },
            );
          }}
        />
      )}
    </div>
  );
}
