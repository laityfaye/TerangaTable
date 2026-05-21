'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  Star,
  TrendingUp,
  Clock,
  UserMinus,
  X,
  ChevronRight,
  Gift,
} from 'lucide-react';
import {
  useCustomers,
  useCreateCustomer,
  type CustomerSegment,
  type ListCustomersQuery,
  type Customer,
} from '@/hooks/crm/use-customers';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatAmount(v: number | string) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(n) + ' F';
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

const SEGMENT_META: Record<CustomerSegment, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  vip: { label: 'VIP', color: '#B45309', bg: '#FEF3C7', icon: <Star size={11} /> },
  regular: { label: 'Régulier', color: '#1D4ED8', bg: '#DBEAFE', icon: <TrendingUp size={11} /> },
  new: { label: 'Nouveau', color: '#15803D', bg: '#DCFCE7', icon: <Users size={11} /> },
  inactive: { label: 'Inactif', color: '#64748B', bg: '#F1F5F9', icon: <Clock size={11} /> },
};

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const meta = SEGMENT_META[segment];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

// ── New customer modal ─────────────────────────────────────────────────────────

function NewCustomerModal({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateCustomer();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create(
      {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-heading text-lg font-bold text-slate-900">Nouveau client</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                placeholder="Amadou"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                placeholder="Diallo"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              placeholder="amadou@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
              placeholder="+221 77 000 00 00"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-50"
            >
              {isPending ? 'Création…' : 'Créer le client'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Customer row ───────────────────────────────────────────────────────────────

function CustomerRow({ customer }: { customer: Customer }) {
  const initials = getInitials(customer.first_name, customer.last_name);
  const colors = ['bg-terracotta', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500'];
  const colorIdx = (customer.first_name.charCodeAt(0) ?? 0) % colors.length;

  return (
    <Link
      href={`/dashboard/customers/${customer.id}`}
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0"
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full ${colors[colorIdx]} flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-white text-xs font-bold">{initials}</span>
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {customer.first_name} {customer.last_name}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {customer.email ?? customer.phone ?? '—'}
        </p>
      </div>

      {/* Segment badge */}
      <div className="hidden sm:block w-24 flex-shrink-0">
        <SegmentBadge segment={customer.segment} />
      </div>

      {/* Orders count */}
      <div className="hidden md:block w-20 text-center flex-shrink-0">
        <span className="text-sm font-medium text-slate-700">{customer.total_orders}</span>
        <p className="text-[10px] text-slate-400">commandes</p>
      </div>

      {/* Total spent */}
      <div className="hidden md:block w-28 text-right flex-shrink-0">
        <span className="text-sm font-semibold text-slate-800">
          {formatAmount(customer.total_spent)}
        </span>
        {customer.loyalty_points > 0 && (
          <p className="text-[10px] text-amber-600">{customer.loyalty_points} pts</p>
        )}
      </div>

      {/* Last visit */}
      <div className="hidden lg:block w-28 text-right flex-shrink-0">
        <span className="text-xs text-slate-500">{formatDate(customer.last_visit_at)}</span>
      </div>

      {/* Arrow */}
      <ChevronRight size={16} className="text-slate-300 group-hover:text-terracotta transition-colors flex-shrink-0" />
    </Link>
  );
}

// ── Segment tabs ───────────────────────────────────────────────────────────────

const TABS: { key: CustomerSegment | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'new', label: 'Nouveaux' },
  { key: 'regular', label: 'Réguliers' },
  { key: 'vip', label: 'VIP' },
  { key: 'inactive', label: 'Inactifs' },
];

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomerSegment | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<ListCustomersQuery['sort_by']>('created_at');

  const query: ListCustomersQuery = {
    ...(activeTab !== 'all' && { segment: activeTab }),
    ...(search && { search }),
    sort_by: sortBy,
    sort_order: 'desc',
    limit: 50,
  };

  const { data, isLoading } = useCustomers(query);
  const customers = data?.data ?? [];
  const counts = data?.meta.counts;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {counts?.all ?? 0} client{(counts?.all ?? 0) !== 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/customers/loyalty"
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-amber-200 text-amber-700 text-sm hover:bg-amber-50 transition-colors"
          >
            <Gift size={15} />
            <span className="hidden sm:inline">Fidélité</span>
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors"
          >
            <Plus size={16} />
            Nouveau client
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Nouveaux', value: counts.new, color: '#15803D', bg: '#DCFCE7', icon: <Users size={16} /> },
            { label: 'Réguliers', value: counts.regular, color: '#1D4ED8', bg: '#DBEAFE', icon: <TrendingUp size={16} /> },
            { label: 'VIP', value: counts.vip, color: '#B45309', bg: '#FEF3C7', icon: <Star size={16} /> },
            { label: 'Inactifs', value: counts.inactive, color: '#64748B', bg: '#F1F5F9', icon: <UserMinus size={16} /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: stat.bg, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as ListCustomersQuery['sort_by'])}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/30 bg-white text-slate-700"
        >
          <option value="created_at">Date inscription</option>
          <option value="total_spent">Total dépensé</option>
          <option value="last_visit_at">Dernière visite</option>
          <option value="total_orders">Nb commandes</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 overflow-x-auto">
        {TABS.map((tab) => {
          const count = tab.key === 'all' ? counts?.all : counts?.[tab.key];
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    active ? 'bg-terracotta text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Column headers */}
        <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="w-9 flex-shrink-0" />
          <div className="flex-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Client</div>
          <div className="hidden sm:block w-24 text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">Segment</div>
          <div className="hidden md:block w-20 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">Commandes</div>
          <div className="hidden md:block w-28 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">Dépensé</div>
          <div className="hidden lg:block w-28 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">Dernière visite</div>
          <div className="w-4 flex-shrink-0" />
        </div>

        {isLoading ? (
          <div className="space-y-0 divide-y divide-slate-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-100 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-48" />
                </div>
                <div className="h-5 bg-slate-100 rounded-full w-16 hidden sm:block" />
                <div className="h-4 bg-slate-100 rounded w-8 hidden md:block" />
                <div className="h-4 bg-slate-100 rounded w-20 hidden md:block" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">
              {search ? 'Aucun client trouvé' : 'Aucun client dans ce segment'}
            </p>
            {!search && activeTab === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-sm text-terracotta hover:text-terracotta-dark underline"
              >
                Créer le premier client
              </button>
            )}
          </div>
        ) : (
          <div>
            {customers.map((customer) => (
              <CustomerRow key={customer.id} customer={customer} />
            ))}
            {(data?.meta.total ?? 0) > customers.length && (
              <div className="px-4 py-3 text-center text-xs text-slate-400 border-t border-slate-50">
                Affichage de {customers.length} / {data?.meta.total} clients
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && <NewCustomerModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
