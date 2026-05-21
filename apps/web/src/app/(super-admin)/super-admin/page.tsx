'use client';

import Link from 'next/link';
import { Building2, Clock, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useDashboardStats,
  useRegions,
  useRequests,
} from '@/hooks/use-super-admin';

// ── Constants ──────────────────────────────────────────────────────────────────

const REGION_COLORS = ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#374151'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
};

// ── Components ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  pulse,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  pulse?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
          {icon}
        </div>
        {pulse && (
          <span className="relative flex h-2.5 w-2.5 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 flex items-center">
          <Loader2 size={18} className="animate-spin text-slate-500" />
        </div>
      ) : (
        <p className="mt-1 text-2xl font-heading font-bold text-white">{value}</p>
      )}
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { data: stats, isPending: statsLoading } = useDashboardStats();
  const { data: regions, isPending: regionsLoading } = useRegions();
  const { data: requests, isPending: requestsLoading } = useRequests({});

  const regionsChart = [...(regions ?? [])]
    .sort((a, b) => (b.tenants_count ?? 0) - (a.tenants_count ?? 0))
    .slice(0, 6)
    .map((r, i) => ({
      name: r.name,
      tenants: r.tenants_count ?? 0,
      fill: REGION_COLORS[i % REGION_COLORS.length] ?? '#374151',
    }));

  const recentRequests = (requests ?? []).slice(0, 5);

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-400">
          Vue d&rsquo;ensemble de la plateforme TérangaTable.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          icon={<Building2 size={20} />}
          label="Tenants actifs"
          value={stats?.active_tenants ?? 0}
          sub="sur toutes les régions"
          loading={statsLoading}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Demandes en attente"
          value={stats?.pending_requests ?? 0}
          sub="à traiter"
          pulse={(stats?.pending_requests ?? 0) > 0}
          loading={statsLoading}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Nouveaux ce mois"
          value={stats?.new_this_month ?? 0}
          sub={`tenants créés en ${new Date().toLocaleDateString('fr-FR', { month: 'long' })}`}
          loading={statsLoading}
        />
      </div>

      {/* Chart + Recent requests */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Horizontal bar chart — tenants par région */}
        <div className="xl:col-span-3 bg-slate-800/60 border border-white/10 rounded-xl p-5">
          <h2 className="font-heading font-semibold text-white text-base mb-4">
            Tenants actifs par région
          </h2>
          {regionsLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <Loader2 size={22} className="animate-spin text-slate-500" />
            </div>
          ) : regionsChart.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
              Aucune région active.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={regionsChart}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#F1F5F9',
                  }}
                  cursor={{ fill: 'rgba(139,92,246,0.08)' }}
                  formatter={(v) => [v, 'tenants']}
                />
                <Bar dataKey="tenants" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Demandes en attente par région */}
        <div className="xl:col-span-2 bg-slate-800/60 border border-white/10 rounded-xl p-5">
          <h2 className="font-heading font-semibold text-white text-base mb-4">
            Demandes en attente / région
          </h2>
          {regionsLoading ? (
            <div className="h-full flex items-center justify-center py-8">
              <Loader2 size={22} className="animate-spin text-slate-500" />
            </div>
          ) : (regions ?? []).filter((r) => (r.pending_requests_count ?? 0) > 0).length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Aucune demande en attente.</p>
          ) : (
            <div className="space-y-3">
              {[...(regions ?? [])]
                .filter((r) => (r.pending_requests_count ?? 0) > 0)
                .sort((a, b) => (b.pending_requests_count ?? 0) - (a.pending_requests_count ?? 0))
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{r.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300">
                      {r.pending_requests_count}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent requests table */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-white text-base">Demandes récentes</h2>
          <Link
            href="/super-admin/requests"
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Voir toutes <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-white/10">
                <th className="text-left px-5 py-3 font-medium">Numéro</th>
                <th className="text-left px-5 py-3 font-medium">Restaurant</th>
                <th className="text-left px-5 py-3 font-medium">Région</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {requestsLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <Loader2 size={20} className="animate-spin text-slate-500 mx-auto" />
                  </td>
                </tr>
              ) : recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-sm">
                    Aucune demande reçue.
                  </td>
                </tr>
              ) : (
                recentRequests.map((req, i) => (
                  <tr
                    key={req.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      i === recentRequests.length - 1 ? 'border-0' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-violet-300">{req.req_number}</td>
                    <td className="px-5 py-3.5 text-slate-200 font-medium">{req.restaurant_name}</td>
                    <td className="px-5 py-3.5 text-slate-400">{req.region_name}</td>
                    <td className="px-5 py-3.5 text-slate-400">{req.email}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                      {new Date(req.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[req.status]}`}
                      >
                        {STATUS_LABEL[req.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
