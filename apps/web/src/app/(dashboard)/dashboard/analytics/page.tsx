'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Download, RefreshCw, TrendingUp, TrendingDown, Minus,
  ShoppingCart, CreditCard, Users, BarChart3,
} from 'lucide-react';
import {
  useAnalyticsSummary,
  useAnalyticsRevenue,
  useAnalyticsTopProducts,
  useAnalyticsPeakHours,
  useAnalyticsOrderTypes,
  useAnalyticsStaff,
  triggerCsvExport,
  type AnalyticsQuery,
  type AnalyticsPeriod,
  type OrderTypeItem,
} from '@/hooks/analytics/use-analytics';
import { useAuthStore } from '@/stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';

// ── Region / currency ──────────────────────────────────────────────────────────

const REGION_CURRENCY: Record<string, { code: string; locale: string }> = {
  dakar:         { code: 'XOF', locale: 'fr-SN' },
  thies:         { code: 'XOF', locale: 'fr-SN' },
  'saint-louis': { code: 'XOF', locale: 'fr-SN' },
  ziguinchor:    { code: 'XOF', locale: 'fr-SN' },
  abidjan:       { code: 'XOF', locale: 'fr-CI' },
  casablanca:    { code: 'MAD', locale: 'fr-MA' },
  paris:         { code: 'EUR', locale: 'fr-FR' },
};

function useCurrency() {
  const regionSlug = useAuthStore((s) => s.user?.regionSlug ?? '');
  return REGION_CURRENCY[regionSlug] ?? { code: 'XOF', locale: 'fr-SN' };
}

function fmt(amount: number, locale: string, code: string) {
  return new Intl.NumberFormat(locale, {
    style:    'currency',
    currency: code,
    maximumFractionDigits: code === 'XOF' ? 0 : 2,
  }).format(amount);
}

// ── Animated counter ───────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const from  = useRef(0);

  useEffect(() => {
    from.current = 0;
    start.current = null;

    const step = (ts: number) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from.current + (target - from.current) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };

    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return value;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-lg ${className ?? ''}`} />
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label:     string;
  value:     number;
  variation: number | null;
  icon:      React.ReactNode;
  format:    (v: number) => string;
  loading:   boolean;
}

function KpiCard({ label, value, variation, icon, format, loading }: KpiCardProps) {
  const animated = useCountUp(loading ? 0 : value);
  const isUp   = variation !== null && variation > 0;
  const isDown = variation !== null && variation < 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <span className="text-slate-300">{icon}</span>
      </div>

      <p className="font-heading text-3xl font-bold text-[#1C1917] tracking-tight">
        {format(animated)}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        {variation === null ? (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Minus size={12} /> Pas de données N-1
          </span>
        ) : isUp ? (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
            <TrendingUp size={12} /> +{variation}%
          </span>
        ) : isDown ? (
          <span className="text-xs font-medium text-red-500 flex items-center gap-1">
            <TrendingDown size={12} /> {variation}%
          </span>
        ) : (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Minus size={12} /> 0%
          </span>
        )}
        <span className="text-xs text-slate-400">vs période précédente</span>
      </div>
    </div>
  );
}

// ── Period selector ────────────────────────────────────────────────────────────

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 jours',     value: '7d'   },
  { label: '30 jours',    value: '30d'  },
  { label: 'Personnalisé', value: 'custom' },
];

// ── Order type labels ──────────────────────────────────────────────────────────

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in:  'Sur place',
  takeaway: 'À emporter',
  delivery: 'Livraison',
  online:   'En ligne',
};

const ORDER_TYPE_COLORS = ['#C8553D', '#D4A843', '#2D6A4F', '#5B7FA6'];

// ── Heatmap ────────────────────────────────────────────────────────────────────

function Heatmap({ matrix, dayLabels }: { matrix: number[][]; dayLabels: string[] }) {
  const max = Math.max(...matrix.flat(), 1);

  function cellStyle(val: number): { backgroundColor: string } {
    if (val === 0) return { backgroundColor: '#F8FAFC' };
    const alpha = 0.08 + (val / max) * 0.82;
    return { backgroundColor: `rgba(200, 85, 61, ${alpha.toFixed(2)})` };
  }

  const legendSteps = [0, 0.15, 0.35, 0.55, 0.75, 1];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Hours header */}
        <div className="flex mb-1 ml-12">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center text-[9px] text-slate-400 font-mono">
              {h % 4 === 0 ? `${h}h` : ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        {matrix.map((row, dayIdx) => (
          <div key={dayIdx} className="flex items-center mb-0.5">
            <span className="w-12 text-xs text-slate-500 font-medium pr-2 text-right shrink-0">
              {dayLabels[dayIdx]}
            </span>
            {row.map((val, hour) => (
              <div
                key={hour}
                title={`${dayLabels[dayIdx]} ${hour}h : ${val} commande${val !== 1 ? 's' : ''}`}
                className="flex-1 h-5 rounded-[2px] mx-px cursor-default transition-opacity hover:opacity-80"
                style={cellStyle(val)}
              />
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-12">
          <span className="text-xs text-slate-400">Moins</span>
          {legendSteps.map((alpha, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-sm border border-slate-100"
              style={{ backgroundColor: alpha === 0 ? '#F8FAFC' : `rgba(200,85,61,${alpha})` }}
            />
          ))}
          <span className="text-xs text-slate-400">Plus</span>
        </div>
      </div>
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function RevenueTooltip({
  active, payload, label, locale, currencyCode,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  locale: string;
  currencyCode: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-sm min-w-[160px]">
      <p className="text-slate-500 text-xs mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="font-mono font-semibold text-slate-800">
            {fmt(p.value, locale, currencyCode)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { code: currencyCode, locale } = useCurrency();
  const accessToken = useAuthStore((s) => s.accessToken);
  const tenantId    = useAuthStore((s) => s.tenantId);
  const queryClient = useQueryClient();

  const [period, setPeriod]      = useState<AnalyticsPeriod>('7d');
  const [dateFrom, setDateFrom]  = useState('');
  const [dateTo,   setDateTo]    = useState('');
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');

  const query: AnalyticsQuery = {
    period,
    ...(period === 'custom' && dateFrom ? { date_from: dateFrom } : {}),
    ...(period === 'custom' && dateTo   ? { date_to:   dateTo   } : {}),
  };

  const { data: summary,     isLoading: loadSummary  } = useAnalyticsSummary(query);
  const { data: revenue,     isLoading: loadRevenue  } = useAnalyticsRevenue(query);
  const { data: topProducts, isLoading: loadProducts } = useAnalyticsTopProducts(query);
  const { data: peakHours,   isLoading: loadPeakHours } = useAnalyticsPeakHours(7);
  const { data: orderTypes,  isLoading: loadTypes    } = useAnalyticsOrderTypes(query);
  const { data: staff,       isLoading: loadStaff    } = useAnalyticsStaff(query);

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }

  function handleCsvExport() {
    const token = accessToken ?? (typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null) ?? '';
    triggerCsvExport(query, token, tenantId ?? '');
  }

  // Revenue chart data — align by position (previous has different absolute dates)
  const revenueChartData = (() => {
    if (!revenue) return [];
    const len = Math.max(revenue.current.length, revenue.previous.length);
    return Array.from({ length: len }, (_, i) => ({
      date:     revenue.current[i]?.date ?? '',
      current:  revenue.current[i]?.revenue ?? 0,
      previous: revenue.previous[i]?.revenue ?? 0,
    }));
  })();

  // Top products → top 5 for bar chart
  const topProductsChart = (topProducts?.items ?? []).slice(0, 5).map((p) => ({
    name: p.product_name.length > 20 ? p.product_name.slice(0, 18) + '…' : p.product_name,
    fullName: p.product_name,
    revenue: p.total_revenue,
    pct:     p.revenue_pct,
  }));

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Analytics</h1>
          <p className="text-sm text-slate-500 font-body mt-0.5">
            Tableau de bord performance
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={13} />
            Actualiser
          </button>

          {/* CSV export */}
          <button
            onClick={handleCsvExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={13} />
            CSV
          </button>
        </div>
      </div>

      {/* ── Period selector ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-[#C8553D] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#C8553D] focus:outline-none focus:ring-1 focus:ring-[#C8553D]"
            />
            <span className="text-slate-400 text-sm">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#C8553D] focus:outline-none focus:ring-1 focus:ring-[#C8553D]"
            />
          </div>
        )}
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="CA Total"
          value={summary?.revenue_total ?? 0}
          variation={summary?.variations.revenue_total ?? null}
          icon={<CreditCard size={18} />}
          format={(v) => fmt(v, locale, currencyCode)}
          loading={loadSummary}
        />
        <KpiCard
          label="Nb Commandes"
          value={summary?.orders_count ?? 0}
          variation={summary?.variations.orders_count ?? null}
          icon={<ShoppingCart size={18} />}
          format={(v) => Math.round(v).toLocaleString('fr-FR')}
          loading={loadSummary}
        />
        <KpiCard
          label="Panier Moyen"
          value={summary?.avg_order_value ?? 0}
          variation={summary?.variations.avg_order_value ?? null}
          icon={<BarChart3 size={18} />}
          format={(v) => fmt(v, locale, currencyCode)}
          loading={loadSummary}
        />
        <KpiCard
          label="Nouveaux Clients"
          value={summary?.new_customers ?? 0}
          variation={summary?.variations.new_customers ?? null}
          icon={<Users size={18} />}
          format={(v) => Math.round(v).toLocaleString('fr-FR')}
          loading={loadSummary}
        />
      </div>

      {/* ── Revenue Chart ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-[#1C1917] text-base">
            Chiffre d&apos;affaires
          </h2>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button
              onClick={() => setChartMode('line')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                chartMode === 'line' ? 'bg-[#C8553D] text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Ligne
            </button>
            <button
              onClick={() => setChartMode('bar')}
              className={`px-3 py-1.5 font-medium transition-colors ${
                chartMode === 'bar' ? 'bg-[#C8553D] text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Barres
            </button>
          </div>
        </div>

        {loadRevenue ? (
          <Skeleton className="h-[280px]" />
        ) : revenueChartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
            Aucune donnée pour cette période
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            {chartMode === 'line' ? (
              <LineChart data={revenueChartData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => v.slice(5)} // MM-DD
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<RevenueTooltip locale={locale} currencyCode={currencyCode} />}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Line
                  type="monotone"
                  dataKey="current"
                  name="Période actuelle"
                  stroke="#C8553D"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#C8553D' }}
                />
                <Line
                  type="monotone"
                  dataKey="previous"
                  name="Période précédente"
                  stroke="#CBD5E1"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
              </LineChart>
            ) : (
              <BarChart data={revenueChartData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<RevenueTooltip locale={locale} currencyCode={currencyCode} />}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="current" name="Période actuelle" fill="#C8553D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Période précédente" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Row: Top Products + Order Types ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Top Products */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-heading font-semibold text-[#1C1917] text-base mb-4">
            Top 5 Produits
          </h2>

          {loadProducts ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : topProductsChart.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              Aucune donnée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={topProductsChart}
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  hide
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(value: unknown) => [fmt(Number(value), locale, currencyCode), 'CA'] as [string, string]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {topProductsChart.map((_, index) => (
                    <Cell
                      key={index}
                      fill={`hsl(10, ${55 + index * 5}%, ${55 - index * 5}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Revenue % labels */}
          {!loadProducts && topProducts && topProducts.items.length > 0 && (
            <div className="mt-2 space-y-1">
              {topProducts.items.slice(0, 5).map((p) => (
                <div key={p.product_id} className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate max-w-[160px]">{p.product_name}</span>
                  <span className="font-mono font-medium text-slate-700 ml-2">
                    {fmt(p.total_revenue, locale, currencyCode)}
                    <span className="text-slate-400 ml-1">({p.revenue_pct}%)</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Types Donut */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-heading font-semibold text-[#1C1917] text-base mb-4">
            Types de commandes
          </h2>

          {loadTypes ? (
            <div className="flex justify-center"><Skeleton className="h-40 w-40 rounded-full" /></div>
          ) : !orderTypes || orderTypes.total === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              Aucune donnée
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={orderTypes.items}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="count"
                    paddingAngle={3}
                  >
                    {orderTypes.items.map((_, idx) => (
                      <Cell key={idx} fill={ORDER_TYPE_COLORS[idx % ORDER_TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown, _n: unknown, props: unknown) => {
                      const p = (props as { payload?: OrderTypeItem }).payload;
                      return [`${Number(v)} (${p?.pct ?? 0}%)`, ORDER_TYPE_LABELS[p?.type ?? ''] ?? p?.type] as [string, string | undefined];
                    }}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2 mt-2">
                {orderTypes.items.map((item, idx) => (
                  <div key={item.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ORDER_TYPE_COLORS[idx % ORDER_TYPE_COLORS.length] }}
                      />
                      <span className="text-slate-600">
                        {ORDER_TYPE_LABELS[item.type] ?? item.type}
                      </span>
                    </div>
                    <span className="font-medium text-slate-700">
                      {item.count} <span className="text-slate-400">({item.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Heatmap ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-semibold text-[#1C1917] text-base">
              Heures de pointe
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">7 derniers jours</p>
          </div>
        </div>

        {loadPeakHours ? (
          <Skeleton className="h-40" />
        ) : !peakHours ? (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
            Aucune donnée
          </div>
        ) : (
          <Heatmap matrix={peakHours.matrix} dayLabels={peakHours.day_labels} />
        )}
      </div>

      {/* ── Staff performance ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-heading font-semibold text-[#1C1917] text-base">
            Performance équipe
          </h2>
        </div>

        {loadStaff ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : !staff || staff.items.length === 0 ? (
          <div className="py-12 flex items-center justify-center text-slate-400 text-sm">
            Aucune donnée pour cette période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Agent</th>
                  <th className="text-right px-5 py-3">Commandes</th>
                  <th className="text-right px-5 py-3">CA généré</th>
                  <th className="text-right px-5 py-3">Part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.items.map((agent, idx) => {
                  const totalRevenue = staff.items.reduce((s, a) => s + a.revenue, 0);
                  const pct = totalRevenue > 0
                    ? ((agent.revenue / totalRevenue) * 100).toFixed(1)
                    : '0';
                  const initials = agent.name
                    .split(' ')
                    .map((n) => n[0] ?? '')
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={agent.agent_id}
                      className={`transition-colors ${
                        idx === 0 ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              idx === 0 ? 'bg-[#D4A843] text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className={`font-medium ${idx === 0 ? 'text-[#1C1917]' : 'text-slate-700'}`}>
                              {agent.name}
                            </p>
                            {idx === 0 && (
                              <p className="text-[10px] text-amber-600 font-semibold">⭐ Top performer</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">
                        {agent.order_count.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">
                        {fmt(agent.revenue, locale, currencyCode)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-[#C8553D] h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 font-medium w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
