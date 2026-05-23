'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Banknote,
  Smartphone,
  CreditCard,
  Globe,
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { usePosSessionHistory, type PosSessionSummary } from '@/hooks/pos/use-pos-session';
import { printZReport } from '../utils/ticket-printer';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v) + ' F';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function durationLabel(openedAt: string, closedAt: string | null): string {
  if (!closedAt) return '—';
  const mins = Math.floor((new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60_000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Session card ───────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onPrint,
}: {
  session: PosSessionSummary;
  onPrint: (s: PosSessionSummary) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const salesByMethod  = session.salesByMethod ?? {};
  const cash           = salesByMethod.cash         ?? 0;
  const mobileMoney    = salesByMethod.mobile_money ?? 0;
  const card           = salesByMethod.card         ?? 0;
  const online         = salesByMethod.online       ?? 0;
  const voucher        = salesByMethod.voucher      ?? 0;

  const theoretical    = Number(session.openingAmount) + cash;
  const diff           = session.cashDifference ?? 0;
  const diffPositive   = diff >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
      >
        {/* Date badge */}
        <div className="flex-shrink-0 text-center bg-terracotta/8 rounded-xl px-3 py-2 min-w-[56px]">
          <p className="text-[10px] font-bold text-terracotta uppercase tracking-wide">
            {new Date(session.openedAt).toLocaleDateString('fr-FR', { month: 'short' })}
          </p>
          <p className="text-2xl font-black text-terracotta leading-none">
            {new Date(session.openedAt).getDate()}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">
              {fmtDate(session.openedAt)}
            </p>
            <span className="text-slate-300">→</span>
            <p className="text-sm text-slate-500">
              {session.closedAt ? fmtDate(session.closedAt) : '—'}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />
              {durationLabel(session.openedAt, session.closedAt)}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <ShoppingBag size={11} />
              {session.totalOrders} commande{session.totalOrders !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              par {session.openedBy.firstName} {session.openedBy.lastName}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-black text-terracotta">{fmt(Number(session.totalSales))}</p>
          <p className="text-[10px] text-slate-400">encaissé</p>
        </div>

        <ChevronRight
          size={16}
          className={`flex-shrink-0 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">

          {/* Payment breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <Banknote size={14} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400">Fond initial</p>
                <p className="text-sm font-bold text-slate-800">{fmt(Number(session.openingAmount))}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <TrendingUp size={14} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400">Total encaissé</p>
                <p className="text-sm font-bold text-terracotta">{fmt(Number(session.totalSales))}</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {cash > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Banknote size={13} className="text-green-500" /> Espèces
                </span>
                <span className="font-mono font-semibold text-slate-900">{fmt(cash)}</span>
              </div>
            )}
            {mobileMoney > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Smartphone size={13} className="text-blue-500" /> Wave · Orange Money
                </span>
                <span className="font-mono font-semibold text-slate-900">{fmt(mobileMoney)}</span>
              </div>
            )}
            {card > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <CreditCard size={13} className="text-purple-500" /> Carte bancaire
                </span>
                <span className="font-mono font-semibold text-slate-900">{fmt(card)}</span>
              </div>
            )}
            {online > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Globe size={13} className="text-sky-500" /> En ligne
                </span>
                <span className="font-mono font-semibold text-slate-900">{fmt(online)}</span>
              </div>
            )}
            {voucher > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <Ticket size={13} className="text-amber-500" /> Bons
                </span>
                <span className="font-mono font-semibold text-slate-900">{fmt(voucher)}</span>
              </div>
            )}
            {session.closingAmount != null && (
              <div className={`flex items-center justify-between px-4 py-2.5 text-sm ${diffPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={`flex items-center gap-2 ${diffPositive ? 'text-green-700' : 'text-red-600'}`}>
                  {diffPositive
                    ? <CheckCircle size={13} />
                    : <AlertTriangle size={13} />}
                  Écart espèces
                </span>
                <span className={`font-mono font-semibold ${diffPositive ? 'text-green-700' : 'text-red-600'}`}>
                  {diffPositive ? '+' : ''}{fmt(diff)}
                </span>
              </div>
            )}
          </div>

          {/* Closed by */}
          {session.closedBy && (
            <p className="text-xs text-slate-400 text-right">
              Fermé par {session.closedBy.firstName} {session.closedBy.lastName}
            </p>
          )}

          {/* Print Z */}
          <button
            onClick={() => onPrint(session)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-terracotta hover:text-terracotta hover:bg-terracotta/5 transition-all"
          >
            <Printer size={14} />
            Réimprimer le Ticket Z
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PosSessionsPage() {
  const router  = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePosSessionHistory(page, 20);

  const sessions   = data?.data ?? [];
  const meta       = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  function handlePrint(session: PosSessionSummary) {
    const salesByMethod = session.salesByMethod ?? {};
    const cash          = salesByMethod.cash ?? 0;
    const theoretical   = Number(session.openingAmount) + cash;
    const diff          = session.cashDifference ?? 0;
    const avgOrder      = session.totalOrders > 0
      ? Math.round(Number(session.totalSales) / session.totalOrders)
      : 0;

    printZReport({
      restaurantName:  'TÉRANGATABLE',
      openedBy:        `${session.openedBy.firstName} ${session.openedBy.lastName}`,
      closedBy:        session.closedBy
        ? `${session.closedBy.firstName} ${session.closedBy.lastName}`
        : undefined,
      openedAt:        session.openedAt,
      closedAt:        session.closedAt ?? new Date().toISOString(),
      durationLabel:   durationLabel(session.openedAt, session.closedAt),
      totalSales:      Number(session.totalSales),
      totalOrders:     session.totalOrders,
      avgOrderValue:   avgOrder,
      openingAmount:   Number(session.openingAmount),
      salesByMethod,
      cashCounted:     Number(session.closingAmount ?? 0),
      cashTheoretical: theoretical,
      cashDifference:  diff,
      currencyCode:    'XOF',
      locale:          'fr-SN',
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900">Historique des sessions</h1>
          {meta && (
            <p className="text-xs text-slate-400">{meta.total} session{meta.total !== 1 ? 's' : ''} fermée{meta.total !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-terracotta" />
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="text-slate-500 font-medium">Aucune session fermée</p>
            <p className="text-slate-400 text-sm mt-1">Les sessions apparaîtront ici après fermeture de caisse.</p>
          </div>
        )}

        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} onPrint={handlePrint} />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600">
              Page <span className="font-bold">{page}</span> / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
