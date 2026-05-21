'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  X,
  Clock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useWorkflows } from '@/hooks/workflows/use-workflows';
import {
  useOrders,
  useOrderTransitions,
  useTransitionOrder,
  useCancelOrder,
  useOrder,
  type Order,
  type AvailableTransition,
} from '@/hooks/orders/use-orders';
import { useOrdersWs } from '@/hooks/orders/use-orders-ws';
import { DynamicForm } from '@/components/custom-fields/dynamic-form';

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: string; label: string }> = {
  dine_in: { icon: '🍽️', label: 'Sur place' },
  takeaway: { icon: '🥡', label: 'À emporter' },
  delivery: { icon: '🛵', label: 'Livraison' },
  online: { icon: '💻', label: 'En ligne' },
};

function formatXAF(v: number) {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v) + ' F';
}

function elapsed(createdAt: string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
  return mins;
}

// ── Elapsed timer badge ────────────────────────────────────────────────────────

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const [mins, setMins] = useState(() => elapsed(createdAt));

  useEffect(() => {
    const t = setInterval(() => setMins(elapsed(createdAt)), 30_000);
    return () => clearInterval(t);
  }, [createdAt]);

  const color =
    mins < 10 ? 'text-green-600' : mins < 15 ? 'text-amber-500' : 'text-red-500';
  const pulse = mins >= 15;

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Clock size={11} className={pulse ? 'animate-pulse' : ''} />
      {mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h${mins % 60}`}
    </span>
  );
}

// ── Quick transition buttons ───────────────────────────────────────────────────

function QuickTransitions({
  orderId,
  onTransition,
}: {
  orderId: string;
  onTransition: (t: AvailableTransition) => void;
}) {
  const { data: transitions = [] } = useOrderTransitions(orderId, true);
  const visible = transitions.slice(0, 2);

  if (visible.length === 0) return null;

  return (
    <div className="flex gap-1 mt-2 flex-wrap">
      {visible.map((t) => (
        <button
          key={t.id}
          onClick={(e) => {
            e.stopPropagation();
            onTransition(t);
          }}
          className="text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors"
          style={{
            borderColor: t.toState.color + '60',
            color: t.toState.color,
            backgroundColor: t.toState.color + '10',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              t.toState.color + '20';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              t.toState.color + '10';
          }}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

// ── Order card ─────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  isNew,
  onOpenDrawer,
  onTransition,
}: {
  order: Order;
  isNew: boolean;
  onOpenDrawer: (id: string) => void;
  onTransition: (orderId: string, t: AvailableTransition) => void;
}) {
  const meta = TYPE_META[order.type] ?? { icon: '📋', label: order.type };
  const stateColor = order.workflow_state?.color ?? '#94A3B8';
  const visibleItems = order.items.slice(0, 3);
  const extraCount = order.items.length - visibleItems.length;
  const isLate = elapsed(order.created_at) >= 15;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onClick={() => onOpenDrawer(order.id)}
      className={`bg-white rounded-[10px] shadow-md cursor-pointer select-none relative overflow-hidden ${
        isNew ? 'ring-2 ring-orange-400 ring-offset-1' : ''
      }`}
      style={{ borderLeft: `4px solid ${stateColor}` }}
    >
      {isLate && (
        <span className="absolute top-2 right-2">
          <AlertTriangle size={13} className="text-red-500 animate-pulse" />
        </span>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">
            {order.order_number}
          </span>
          <ElapsedBadge createdAt={order.created_at} />
        </div>

        {/* Type + table */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">
            {meta.icon} {meta.label}
          </span>
          {order.table && (
            <span className="text-xs text-slate-500">Table {order.table.number}</span>
          )}
        </div>

        {/* Items */}
        <div className="text-xs text-slate-500 mb-2 leading-relaxed">
          {visibleItems.map((item, i) => (
            <span key={item.id}>
              {i > 0 ? ', ' : ''}
              {item.quantity > 1 ? `${item.quantity}× ` : ''}
              {item.productName}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-slate-400"> +{extraCount} autre{extraCount > 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-sm font-semibold"
            style={{ color: '#C8553D' }}
          >
            {formatXAF(Number(order.total))}
          </span>
          {order.customer && (
            <span className="text-xs text-slate-400 truncate max-w-[80px]">
              {order.customer.firstName}
            </span>
          )}
        </div>

        {/* Quick transitions */}
        <QuickTransitions
          orderId={order.id}
          onTransition={(t) => onTransition(order.id, t)}
        />
      </div>
    </motion.div>
  );
}

// ── Kanban column ──────────────────────────────────────────────────────────────

function KanbanColumn({
  state,
  orders,
  newIds,
  onOpenDrawer,
  onTransition,
}: {
  state: { id: string; name: string; color: string };
  orders: Order[];
  newIds: Set<string>;
  onOpenDrawer: (id: string) => void;
  onTransition: (orderId: string, t: AvailableTransition) => void;
}) {
  return (
    <div
      className="flex-shrink-0 w-72 flex flex-col rounded-xl overflow-hidden"
      style={{ backgroundColor: state.color + '0D' }}
    >
      {/* Column header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: `3px solid ${state.color}` }}
      >
        <span className="text-sm font-semibold text-slate-800">{state.name}</span>
        <span
          className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: state.color }}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <AnimatePresence initial={false}>
          {orders.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-400 text-center py-6"
            >
              Aucune commande
            </motion.p>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isNew={newIds.has(order.id)}
                onOpenDrawer={onOpenDrawer}
                onTransition={onTransition}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Order Drawer ───────────────────────────────────────────────────────────────

function OrderDrawer({
  orderId,
  onClose,
  onTransition,
}: {
  orderId: string;
  onClose: () => void;
  onTransition: (orderId: string, t: AvailableTransition) => void;
}) {
  const { data: order, isLoading } = useOrder(orderId);
  const { data: transitions = [] } = useOrderTransitions(orderId, true);
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'detail' | 'custom'>('detail');

  if (isLoading || !order) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  const meta = TYPE_META[order.type] ?? { icon: '📋', label: order.type };
  const stateColor = order.workflow_state?.color ?? '#94A3B8';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div
        className="px-6 py-4 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10"
        style={{ borderTop: `4px solid ${stateColor}` }}
      >
        <div>
          <p className="font-mono text-lg font-bold text-slate-900">{order.order_number}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{meta.icon} {meta.label}</span>
            <span className="text-slate-300">·</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: stateColor }}
            >
              {order.workflow_state?.name ?? order.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(order.created_at).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-6">
        {([['detail', 'Détail'], ['custom', 'Infos supp.']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setDrawerTab(key)}
            className={`py-2.5 mr-4 text-sm font-medium border-b-2 transition-colors ${
              drawerTab === key
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {drawerTab === 'custom' && (
        <div className="px-6 py-4 flex-1">
          <DynamicForm entityType="order" entityId={orderId} />
        </div>
      )}

      {drawerTab === 'detail' && (
      <div className="px-6 py-4 space-y-5 flex-1">
        {/* Items */}
        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Commande
          </h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-800">
                    {item.quantity > 1 && (
                      <span className="text-terracotta font-bold mr-1">{item.quantity}×</span>
                    )}
                    {item.productName}
                  </span>
                  {(item.options as { option_name?: string }[])?.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(item.options as { option_name?: string }[])
                        .map((o) => o.option_name)
                        .join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-amber-600 mt-0.5 italic">{item.notes}</p>
                  )}
                </div>
                <span className="font-mono text-xs font-medium text-slate-600 ml-3 whitespace-nowrap">
                  {formatXAF(Number(item.lineTotal))}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Totals */}
        <section className="border-t border-slate-100 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Sous-total</span>
            <span className="font-mono">{formatXAF(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Remise</span>
              <span className="font-mono">-{formatXAF(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
            <span>Total</span>
            <span className="font-mono" style={{ color: '#C8553D' }}>
              {formatXAF(Number(order.total))}
            </span>
          </div>
        </section>

        {/* Customer */}
        {order.customer && (
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Client
            </h3>
            <p className="text-sm font-medium text-slate-800">
              {order.customer.firstName} {order.customer.lastName}
            </p>
            {order.customer.phone && (
              <p className="text-xs text-slate-500">{order.customer.phone}</p>
            )}
          </section>
        )}

        {/* Notes */}
        {order.notes && (
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Notes
            </h3>
            <p className="text-sm text-slate-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
              {order.notes}
            </p>
          </section>
        )}

        {/* Payments */}
        {order.payments.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Paiements
            </h3>
            {order.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-slate-600 capitalize">{p.method}</span>
                <span className="font-mono">{formatXAF(Number(p.amount))}</span>
              </div>
            ))}
          </section>
        )}

        {/* Transitions */}
        {transitions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Actions
            </h3>
            <div className="flex flex-col gap-2">
              {transitions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTransition(orderId, t)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: t.toState.color + '40',
                    color: t.toState.color,
                    backgroundColor: t.toState.color + '0A',
                  }}
                >
                  <span>{t.name}</span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
      )}

      {/* Cancel */}
      <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
        {confirmCancel ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmCancel(false)}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              disabled={cancelling}
              onClick={() => {
                cancelOrder(orderId, { onSuccess: onClose });
              }}
              className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'En cours…' : 'Confirmer'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmCancel(true)}
            className="w-full py-2 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Annuler la commande
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const newIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const { connected } = useOrdersWs(soundEnabled);

  // Default order workflow
  const { data: workflows } = useWorkflows();
  const workflow = workflows?.find((w) => w.entity_type === 'order' && w.is_default);
  const states = workflow?.states ?? [];

  // All orders (Kanban needs them all)
  const { data: ordersData, isLoading: ordersLoading } = useOrders({ limit: 200 });
  const orders = ordersData?.data ?? [];

  const { mutate: doTransition } = useTransitionOrder();

  // Track new orders for ring animation
  useEffect(() => {
    if (!ordersData) return;
    const current = new Set(ordersData.data.map((o) => o.id));
    // Orders added since last render
    for (const id of current) {
      if (!newIdsRef.current.has(id) && newIdsRef.current.size > 0) {
        setNewIds((prev) => new Set([...prev, id]));
        setTimeout(() => setNewIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 2500);
      }
    }
    newIdsRef.current = current;
  }, [ordersData]);

  // Group orders by workflow_state_id
  const ordersByState = new Map<string, Order[]>();
  for (const state of states) {
    ordersByState.set(state.id, []);
  }
  for (const order of orders) {
    const stateId = order.workflow_state?.id;
    if (stateId && ordersByState.has(stateId)) {
      ordersByState.get(stateId)!.push(order);
    }
  }

  function handleTransition(orderId: string, t: AvailableTransition) {
    doTransition({ orderId, transitionId: t.id });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Commandes</h1>
          <p className="text-sm text-slate-500 font-body mt-0.5">
            Temps réel · {ordersData?.meta.total ?? 0} commande
            {(ordersData?.meta.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* WS status */}
          <span
            title={connected ? 'Connecté en temps réel' : 'Déconnecté'}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium ${
              connected
                ? 'bg-green-50 text-green-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'En direct' : 'Hors ligne'}
          </span>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'Son activé' : 'Son désactivé'}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* New order */}
          <Link
            href="/dashboard/orders/new"
            className="flex items-center gap-2 px-4 h-10 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors"
          >
            <Plus size={16} />
            Nouvelle commande
          </Link>
        </div>
      </div>

      {/* Kanban board */}
      {ordersLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 bg-white rounded-xl border border-slate-100 animate-pulse h-64" />
          ))}
        </div>
      ) : states.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 mb-3">Aucun workflow configuré pour les commandes.</p>
            <Link
              href="/dashboard/settings/workflows"
              className="text-sm text-terracotta hover:text-terracotta-dark underline"
            >
              Configurer un workflow →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {states
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((state) => (
                <KanbanColumn
                  key={state.id}
                  state={state}
                  orders={ordersByState.get(state.id) ?? []}
                  newIds={newIds}
                  onOpenDrawer={setDrawerOrderId}
                  onTransition={handleTransition}
                />
              ))}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {drawerOrderId && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOrderId(null)}
              className="fixed inset-0 bg-black/30 z-40"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <OrderDrawer
                orderId={drawerOrderId}
                onClose={() => setDrawerOrderId(null)}
                onTransition={(id, t) => {
                  handleTransition(id, t);
                  setDrawerOrderId(null);
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
