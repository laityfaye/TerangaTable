'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Volume2, Wifi, WifiOff, UtensilsCrossed, Bike, ShoppingBag } from 'lucide-react';
import {
  useOrders,
  useOrderTransitions,
  useTransitionOrder,
  type Order,
} from '@/hooks/orders/use-orders';
import { useOrdersWs } from '@/hooks/orders/use-orders-ws';

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<Order['type'], string> = {
  dine_in: 'Sur place',
  takeaway: 'Emporter',
  delivery: 'Livraison',
  online: 'En ligne',
};

const TYPE_ICONS: Record<Order['type'], React.ReactNode> = {
  dine_in: <UtensilsCrossed size={13} />,
  takeaway: <ShoppingBag size={13} />,
  delivery: <Bike size={13} />,
  online: <ShoppingBag size={13} />,
};

function elapsedMinutes(createdAt: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60_000));
}

function urgencyClasses(minutes: number): string {
  if (minutes >= 20) return 'border-red-500 bg-red-500/10';
  if (minutes >= 10) return 'border-amber-500 bg-amber-500/10';
  return 'border-emerald-500 bg-emerald-500/10';
}

function urgencyTextClasses(minutes: number): string {
  if (minutes >= 20) return 'text-red-400';
  if (minutes >= 10) return 'text-amber-400';
  return 'text-emerald-400';
}

// ── Ticket ─────────────────────────────────────────────────────────────────────

function Ticket({ order, now }: { order: Order; now: number }) {
  const { data: transitions = [] } = useOrderTransitions(order.id, true);
  const { mutate: transition, isPending } = useTransitionOrder();
  const minutes = elapsedMinutes(order.created_at, now);

  return (
    <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 bg-slate-800 ${urgencyClasses(minutes)}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-lg font-bold text-white">#{order.order_number}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300">
            {TYPE_ICONS[order.type]}
            <span>{TYPE_LABELS[order.type]}</span>
            {order.table && <span className="text-slate-500">· Table {order.table.number}</span>}
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${urgencyTextClasses(minutes)}`}>
          <Clock size={14} />
          {minutes} min
        </div>
      </div>

      <div className="flex-1 space-y-1.5 border-t border-slate-700 pt-3">
        {order.items.map((item) => (
          <div key={item.id} className="text-sm text-slate-100">
            <span className="font-bold">{item.quantity}×</span> {item.productName}
            {item.options.length > 0 && (
              <span className="block pl-5 text-xs text-slate-400">
                {item.options.map((o) => o.option_name).join(', ')}
              </span>
            )}
            {item.notes && <span className="block pl-5 text-xs text-amber-400">{item.notes}</span>}
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-xs text-amber-300 bg-amber-500/10 rounded-lg px-2.5 py-1.5">{order.notes}</p>
      )}

      {transitions.length > 0 && (
        <div className="flex gap-2 pt-1">
          {transitions.map((t) => (
            <button
              key={t.id}
              disabled={isPending}
              onClick={() => transition({ orderId: order.id, transitionId: t.id })}
              className="flex-1 h-10 rounded-lg font-medium text-sm text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: t.toState.color }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Column ─────────────────────────────────────────────────────────────────────

function Column({ title, orders, now, accent }: { title: string; orders: Order[]; now: number; accent: string }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
        <h2 className="font-heading font-bold text-white">{title}</h2>
        <span className="text-sm text-slate-400">({orders.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Aucune commande</div>
        ) : (
          orders.map((order) => <Ticket key={order.id} order={order} now={now} />)
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KdsPage() {
  const { connected, soundUnlocked, unlockSound } = useOrdersWs();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Compat avec les tenants onboardés avant l'alignement du workflow par défaut
  // (anciens slugs pending/preparing) en plus du nouveau schéma new/in_kitchen/...
  const { data: newRes } = useOrders({ status: 'new,confirmed,pending', limit: 50 });
  const { data: preparingRes } = useOrders({ status: 'in_kitchen,in_preparation,preparing', limit: 50 });
  const { data: readyRes } = useOrders({ status: 'ready', limit: 50 });

  const newOrders = newRes?.data ?? [];
  const preparingOrders = preparingRes?.data ?? [];
  const readyOrders = readyRes?.data ?? [];

  return (
    <div className="fixed inset-0 z-30 bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-heading text-lg font-bold text-white">Écran cuisine</h1>
        </div>
        <div className="flex items-center gap-3">
          {!soundUnlocked && (
            <button
              onClick={unlockSound}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-terracotta/20 text-terracotta text-xs font-medium hover:bg-terracotta/30 transition-colors"
            >
              <Volume2 size={14} />
              Activer le son
            </button>
          )}
          <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connected ? 'Connecté' : 'Hors ligne'}
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 flex gap-5 p-5 overflow-hidden">
        <Column title="Nouvelles" orders={newOrders} now={now} accent="#F59E0B" />
        <Column title="En préparation" orders={preparingOrders} now={now} accent="#3B82F6" />
        <Column title="Prêtes" orders={readyOrders} now={now} accent="#10B981" />
      </div>
    </div>
  );
}
