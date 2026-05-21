'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { ShoppingCart, TrendingUp, CreditCard, UserPlus, Plus, CalendarPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import {
  useAnalyticsSummary,
  useAnalyticsRevenue,
  useAnalyticsPeakHours,
} from '@/hooks/analytics/use-analytics';
import { useOrders } from '@/hooks/orders/use-orders';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatXAF(amount: number) {
  return (
    new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + ' F'
  );
}

function toDayLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]!) - 1, Number(parts[2]));
  const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return (label.charAt(0).toUpperCase() + label.slice(1).replace('.', '')).slice(0, 3);
}

function formatTrend(v: number | null): { value: string; positive: boolean } | undefined {
  if (v == null) return undefined;
  return { value: `${v > 0 ? '+' : ''}${v}%`, positive: v >= 0 };
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'Sur place',
  takeaway: 'Emporté',
  delivery: 'Livraison',
  online: 'En ligne',
};

// ── Components ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="bg-white rounded-lg border border-[#E7E5E4] p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center text-terracotta flex-shrink-0">
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.positive ? 'bg-green-50 text-green-success' : 'bg-red-50 text-red-500'
            }`}
          >
            {trend.positive ? '▲' : '▼'} {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-slate-500 font-body">{label}</p>
      <p className="mt-1 text-2xl font-heading font-bold text-[#1C1917]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-[#E7E5E4] p-5 shadow-sm animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-slate-100" />
      <div className="mt-4 h-3 w-24 bg-slate-100 rounded" />
      <div className="mt-2 h-7 w-32 bg-slate-100 rounded" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary({ period: 'today' });
  const { data: revenue } = useAnalyticsRevenue({ period: '7d', granularity: 'day' });
  const { data: peakHours } = useAnalyticsPeakHours(7);
  const { data: recentOrdersRes } = useOrders({ limit: 5 });

  // Revenue area chart data
  const revenueData =
    revenue?.current.map((p) => ({ day: toDayLabel(p.date), ca: p.revenue })) ?? [];

  // Orders-by-hour: average across the 7-day matrix (non-zero hours only)
  const ordersData = (() => {
    if (!peakHours) return [];
    const result: { hour: string; count: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const total = peakHours.matrix.reduce((sum, row) => sum + (row[h] ?? 0), 0);
      if (total > 0) {
        result.push({ hour: `${h}h`, count: Math.round(total / 7) });
      }
    }
    return result;
  })();

  const recentOrders = recentOrdersRes?.data ?? [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">
            {greeting()}, {user?.firstName ?? 'Chef'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-body">
            Voici l&rsquo;activité de votre restaurant aujourd&rsquo;hui.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 h-10 rounded-md border border-[#E7E5E4] text-sm font-body text-[#1C1917] hover:bg-[#F5F4F2] transition-colors">
            <CalendarPlus size={15} />
            Réservation
          </button>
          <button className="flex items-center gap-2 px-4 h-10 rounded-md bg-terracotta text-white text-sm font-body hover:bg-terracotta-dark transition-colors">
            <Plus size={15} />
            Commande
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={<ShoppingCart size={20} />}
              label="Commandes aujourd'hui"
              value={String(summary?.orders_count ?? 0)}
              {...(summary?.avg_order_value
                ? { sub: `moy. ${formatXAF(summary.avg_order_value)}` }
                : {})}
              {...(formatTrend(summary?.variations.orders_count ?? null) != null
                ? { trend: formatTrend(summary?.variations.orders_count ?? null)! }
                : {})}
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              label="CA du jour"
              value={formatXAF(summary?.revenue_total ?? 0)}
              {...(formatTrend(summary?.variations.revenue_total ?? null) != null
                ? { trend: formatTrend(summary?.variations.revenue_total ?? null)! }
                : {})}
            />
            <StatCard
              icon={<CreditCard size={20} />}
              label="Valeur moy. / commande"
              value={formatXAF(summary?.avg_order_value ?? 0)}
              {...(formatTrend(summary?.variations.avg_order_value ?? null) != null
                ? { trend: formatTrend(summary?.variations.avg_order_value ?? null)! }
                : {})}
            />
            <StatCard
              icon={<UserPlus size={20} />}
              label="Nouveaux clients"
              value={String(summary?.new_customers ?? 0)}
              sub="inscrits aujourd'hui"
              {...(formatTrend(summary?.variations.new_customers ?? null) != null
                ? { trend: formatTrend(summary?.variations.new_customers ?? null)! }
                : {})}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Revenue area chart */}
        <div className="xl:col-span-3 bg-white rounded-lg border border-[#E7E5E4] p-5 shadow-sm">
          <h2 className="font-heading font-semibold text-[#1C1917] text-base mb-4">
            Chiffre d&rsquo;affaires — 7 derniers jours
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8553D" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C8553D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F0EFED" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#9C9995' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9C9995' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v / 1000}k`}
                width={36}
              />
              <Tooltip
                formatter={(v) => [typeof v === 'number' ? formatXAF(v) : v, 'CA']}
                contentStyle={{ border: '1px solid #E7E5E4', borderRadius: 8, fontSize: 13 }}
              />
              <Area
                type="monotone"
                dataKey="ca"
                stroke="#C8553D"
                strokeWidth={2.5}
                fill="url(#caGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#C8553D' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by hour bar chart */}
        <div className="xl:col-span-2 bg-white rounded-lg border border-[#E7E5E4] p-5 shadow-sm">
          <h2 className="font-heading font-semibold text-[#1C1917] text-base mb-4">
            Commandes par heure
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ordersData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#F0EFED" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: '#9C9995' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9C9995' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: '1px solid #E7E5E4', borderRadius: 8, fontSize: 13 }}
                formatter={(v) => [v, 'commandes']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {ordersData.map((entry, i) => {
                  const maxCount = Math.max(...ordersData.map((d) => d.count));
                  return <Cell key={i} fill={entry.count === maxCount ? '#C8553D' : '#E8826F'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E7E5E4] flex items-center justify-between">
          <h2 className="font-heading font-semibold text-[#1C1917] text-base">
            Commandes récentes
          </h2>
          <a
            href="/dashboard/orders"
            className="text-xs text-terracotta hover:text-terracotta-dark transition-colors"
          >
            Voir toutes →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-[#E7E5E4]">
                <th className="text-left px-5 py-3 font-medium">N°</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Table</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">
                    Aucune commande pour le moment
                  </td>
                </tr>
              ) : (
                recentOrders.map((order, i) => {
                  const statusColor = order.workflow_state?.color ?? '#6B7280';
                  const typeLabel = ORDER_TYPE_LABELS[order.type] ?? order.type;
                  const tableLabel = order.table ? `Table ${order.table.number}` : '—';
                  const statusLabel = order.workflow_state?.name ?? order.status;

                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-[#E7E5E4] hover:bg-[#FAFAF8] transition-colors ${
                        i === recentOrders.length - 1 ? 'border-0' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-[#1C1917] font-medium">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{typeLabel}</td>
                      <td className="px-5 py-3.5 text-slate-600">{tableLabel}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-[#1C1917]">
                        {formatXAF(order.total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: statusColor + '20',
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
