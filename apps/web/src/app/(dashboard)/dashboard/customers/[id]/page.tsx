'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  TrendingUp,
  Users,
  Clock,
  ShoppingBag,
  Gift,
  FileText,
  Settings2,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import {
  useCustomer,
  useCustomerOrders,
  useCustomerLoyalty,
  useUpdateCustomer,
  useArchiveCustomer,
  type CustomerSegment,
} from '@/hooks/crm/use-customers';
import { DynamicForm } from '@/components/custom-fields/dynamic-form';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatAmount(v: number | string) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(n) + ' F';
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

const SEGMENT_META: Record<CustomerSegment, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  vip: { label: 'VIP', color: '#B45309', bg: '#FEF3C7', icon: <Star size={12} /> },
  regular: { label: 'Régulier', color: '#1D4ED8', bg: '#DBEAFE', icon: <TrendingUp size={12} /> },
  new: { label: 'Nouveau', color: '#15803D', bg: '#DCFCE7', icon: <Users size={12} /> },
  inactive: { label: 'Inactif', color: '#64748B', bg: '#F1F5F9', icon: <Clock size={12} /> },
};

const AVATAR_COLORS = ['#C8553D', '#2563EB', '#16A34A', '#9333EA', '#D97706'];

// ── Edit form (inline) ─────────────────────────────────────────────────────────

function EditForm({
  customer,
  onClose,
}: {
  customer: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null };
  onClose: () => void;
}) {
  const { mutate: update, isPending } = useUpdateCustomer();
  const [form, setForm] = useState({
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update(
      {
        id: customer.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Prénom</label>
          <input
            required
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
          <input
            required
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <X size={13} /> Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-terracotta text-white hover:bg-terracotta-dark disabled:opacity-50"
        >
          <Check size={13} /> {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  );
}

// ── Notes tab ──────────────────────────────────────────────────────────────────

function NotesTab({ customer }: { customer: { id: string; notes: string | null } }) {
  const [notes, setNotes] = useState(customer.notes ?? '');
  const [saved, setSaved] = useState(false);
  const { mutate: update } = useUpdateCustomer();

  function handleSave() {
    update({ id: customer.id, notes }, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        placeholder="Notes internes sur ce client (préférences, allergies, informations utiles…)"
        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
      />
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors ${
            saved
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-terracotta text-white hover:bg-terracotta-dark'
          }`}
        >
          {saved ? <><Check size={14} /> Sauvegardé</> : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

// ── Orders tab ─────────────────────────────────────────────────────────────────

function OrdersTab({ customerId }: { customerId: string }) {
  const { data: orders = [], isLoading } = useCustomerOrders(customerId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">Aucune commande pour ce client</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/dashboard/orders`}
          className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800 font-mono">{order.order_number}</p>
            <p className="text-xs text-slate-400">{formatDateTime(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{formatAmount(order.total)}</p>
            {order.workflow_state && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  color: order.workflow_state.color,
                  backgroundColor: order.workflow_state.color + '20',
                }}
              >
                {order.workflow_state.name}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Loyalty tab ────────────────────────────────────────────────────────────────

function LoyaltyTab({ customerId }: { customerId: string }) {
  const { data: transactions = [], isLoading } = useCustomerLoyalty(customerId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Gift size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">Aucune transaction de fidélité</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl"
        >
          <div>
            <p className="text-sm text-slate-700">{tx.description ?? tx.type}</p>
            <p className="text-xs text-slate-400">{formatDateTime(tx.createdAt)}</p>
          </div>
          <div className="text-right">
            <p
              className={`text-sm font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}
            >
              {tx.points > 0 ? '+' : ''}{tx.points} pts
            </p>
            <p className="text-xs text-slate-400">Solde : {tx.balanceAfter} pts</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type TabKey = 'orders' | 'loyalty' | 'notes' | 'custom';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'orders', label: 'Commandes', icon: <ShoppingBag size={15} /> },
  { key: 'loyalty', label: 'Points', icon: <Gift size={15} /> },
  { key: 'notes', label: 'Notes', icon: <FileText size={15} /> },
  { key: 'custom', label: 'Champs perso', icon: <Settings2 size={15} /> },
];

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [editing, setEditing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const { data: customer, isLoading } = useCustomer(id);
  const { mutate: archiveCustomer, isPending: archiving } = useArchiveCustomer();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded-xl w-48 animate-pulse" />
        <div className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>Client introuvable.</p>
        <Link href="/dashboard/customers" className="text-terracotta hover:underline text-sm mt-2 block">
          ← Retour aux clients
        </Link>
      </div>
    );
  }

  const seg = SEGMENT_META[customer.segment];
  const avatarColor = AVATAR_COLORS[(customer.first_name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  const initials = getInitials(customer.first_name, customer.last_name);

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={15} />
        Retour aux clients
      </Link>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5">
          {editing ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">Modifier le client</p>
              <EditForm customer={customer} onClose={() => setEditing(false)} />
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-xl font-bold text-[#1C1917]">
                    {customer.first_name} {customer.last_name}
                  </h1>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ color: seg.color, backgroundColor: seg.bg }}
                  >
                    {seg.icon} {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                  {customer.email && <span>{customer.email}</span>}
                  {customer.phone && <span>{customer.phone}</span>}
                  <span>Membre depuis {formatDate(customer.created_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Edit2 size={14} />
                  Modifier
                </button>
                {confirmArchive ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setConfirmArchive(false)}
                      className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Annuler
                    </button>
                    <button
                      disabled={archiving}
                      onClick={() => archiveCustomer(customer.id, { onSuccess: () => router.push('/dashboard/customers') })}
                      className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {archiving ? '…' : 'Confirmer'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmArchive(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                    Archiver
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Commandes', value: customer.total_orders, unit: '' },
          { label: 'Total dépensé', value: formatAmount(customer.total_spent), unit: '' },
          { label: 'Points fidélité', value: customer.loyalty_points, unit: 'pts' },
          { label: 'Dernière visite', value: formatDate(customer.last_visit_at), unit: '' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-100 px-4 py-4"
          >
            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-slate-900">
              {stat.value}
              {stat.unit && (
                <span className="text-sm font-normal text-slate-400 ml-1">{stat.unit}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'orders' && <OrdersTab customerId={customer.id} />}
          {activeTab === 'loyalty' && <LoyaltyTab customerId={customer.id} />}
          {activeTab === 'notes' && <NotesTab customer={customer} />}
          {activeTab === 'custom' && (
            <DynamicForm entityType="customer" entityId={customer.id} />
          )}
        </div>
      </div>
    </div>
  );
}
