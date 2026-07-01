'use client';

import Link from 'next/link';
import { Building2, Clock, ShoppingCart, DollarSign, ArrowRight, CheckCircle, XCircle, ExternalLink, Globe } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useRegions,
  useRegionStats,
  useRegionTenantsHistory,
  useRequests,
  type Region,
  type RegionStats,
  type TenantHistoryPoint,
  type TenantRequest,
} from '@/hooks/use-super-admin';

// ── Mock data ──────────────────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  SN: '🇸🇳',
  CI: '🇨🇮',
  MA: '🇲🇦',
  FR: '🇫🇷',
};

const MOCK_REGIONS: Region[] = [
  { id: '1', name: 'Dakar', slug: 'dakar', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Dakar', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true, tenants_count: 34, pending_requests_count: 4 },
  { id: '2', name: 'Thiès', slug: 'thies', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Thiès', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true, tenants_count: 12, pending_requests_count: 1 },
  { id: '3', name: 'Saint-Louis', slug: 'saint-louis', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Saint-Louis', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true, tenants_count: 8, pending_requests_count: 0 },
  { id: '4', name: 'Abidjan', slug: 'abidjan', country_code: 'CI', country_name: "Côte d'Ivoire", platform_label: 'TérangaTable Abidjan', timezone: 'Africa/Abidjan', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-CI', phone_prefix: '+225', is_active: true, tenants_count: 18, pending_requests_count: 2 },
  { id: '5', name: 'Casablanca', slug: 'casablanca', country_code: 'MA', country_name: 'Maroc', platform_label: 'TérangaTable Casablanca', timezone: 'Africa/Casablanca', currency_code: 'MAD', currency_symbol: 'DH', locale: 'fr-MA', phone_prefix: '+212', is_active: true, tenants_count: 11, pending_requests_count: 1 },
  { id: '6', name: 'Paris', slug: 'paris', country_code: 'FR', country_name: 'France', platform_label: 'TérangaTable Paris', timezone: 'Europe/Paris', currency_code: 'EUR', currency_symbol: '€', locale: 'fr-FR', phone_prefix: '+33', is_active: false, tenants_count: 0, pending_requests_count: 0 },
];

const MOCK_STATS: Record<string, RegionStats> = {
  dakar:        { active_tenants: 34, orders_today: 127, pending_requests: 4,  revenue_month: 12500000 },
  thies:        { active_tenants: 12, orders_today: 38,  pending_requests: 1,  revenue_month: 4200000  },
  'saint-louis':{ active_tenants: 8,  orders_today: 21,  pending_requests: 0,  revenue_month: 2800000  },
  abidjan:      { active_tenants: 18, orders_today: 74,  pending_requests: 2,  revenue_month: 7800000  },
  casablanca:   { active_tenants: 11, orders_today: 45,  pending_requests: 1,  revenue_month: 5500000  },
  paris:        { active_tenants: 0,  orders_today: 0,   pending_requests: 0,  revenue_month: 0        },
};

const MOCK_HISTORY: Record<string, TenantHistoryPoint[]> = {
  dakar:         [{ month: 'Déc', active_tenants: 24 }, { month: 'Jan', active_tenants: 26 }, { month: 'Fév', active_tenants: 28 }, { month: 'Mar', active_tenants: 29 }, { month: 'Avr', active_tenants: 31 }, { month: 'Mai', active_tenants: 34 }],
  thies:         [{ month: 'Déc', active_tenants: 8  }, { month: 'Jan', active_tenants: 9  }, { month: 'Fév', active_tenants: 9  }, { month: 'Mar', active_tenants: 10 }, { month: 'Avr', active_tenants: 11 }, { month: 'Mai', active_tenants: 12 }],
  'saint-louis': [{ month: 'Déc', active_tenants: 5  }, { month: 'Jan', active_tenants: 6  }, { month: 'Fév', active_tenants: 6  }, { month: 'Mar', active_tenants: 7  }, { month: 'Avr', active_tenants: 7  }, { month: 'Mai', active_tenants: 8  }],
  abidjan:       [{ month: 'Déc', active_tenants: 12 }, { month: 'Jan', active_tenants: 13 }, { month: 'Fév', active_tenants: 14 }, { month: 'Mar', active_tenants: 15 }, { month: 'Avr', active_tenants: 16 }, { month: 'Mai', active_tenants: 18 }],
  casablanca:    [{ month: 'Déc', active_tenants: 7  }, { month: 'Jan', active_tenants: 8  }, { month: 'Fév', active_tenants: 9  }, { month: 'Mar', active_tenants: 9  }, { month: 'Avr', active_tenants: 10 }, { month: 'Mai', active_tenants: 11 }],
  paris:         [{ month: 'Déc', active_tenants: 0  }, { month: 'Jan', active_tenants: 0  }, { month: 'Fév', active_tenants: 0  }, { month: 'Mar', active_tenants: 0  }, { month: 'Avr', active_tenants: 0  }, { month: 'Mai', active_tenants: 0  }],
};

const MOCK_REQUESTS: TenantRequest[] = [
  { id: '1', req_number: 'REQ-2026-0012', restaurant_name: 'Le Teranga', owner_name: 'Moussa Diop', email: 'moussa@example.com', phone: '+221 77 123 45 67', region_id: 'dakar', region_name: 'Dakar', city: 'Plateau', message: 'Restaurant traditionnel sénégalais.', desired_modules: ['menu', 'orders'], status: 'pending', created_at: '2026-05-15T10:30:00Z' },
  { id: '2', req_number: 'REQ-2026-0011', restaurant_name: "Saveurs d'Abidjan", owner_name: 'Kofi Asante', email: 'kofi@example.com', phone: '+225 07 123 45 67', region_id: 'abidjan', region_name: 'Abidjan', city: 'Plateau', message: 'Restaurant ivoirien.', desired_modules: ['menu', 'orders'], status: 'approved', created_at: '2026-05-14T08:15:00Z', reviewed_at: '2026-05-14T11:00:00Z' },
  { id: '3', req_number: 'REQ-2026-0010', restaurant_name: 'Délices Casablanca', owner_name: 'Rachid Benali', email: 'rachid@example.com', phone: '+212 06 123 45 67', region_id: 'casablanca', region_name: 'Casablanca', city: 'Maarif', message: 'Brasserie marocaine.', desired_modules: ['menu', 'orders', 'pos'], status: 'pending', created_at: '2026-05-13T14:20:00Z' },
  { id: '4', req_number: 'REQ-2026-0009', restaurant_name: 'Resto Thiès', owner_name: 'Fatou Sow', email: 'fatou@example.com', region_id: 'thies', region_name: 'Thiès', city: 'Thiès', message: '', desired_modules: ['menu'], status: 'rejected', rejection_reason: 'Informations incomplètes.', created_at: '2026-05-12T09:45:00Z', reviewed_at: '2026-05-12T16:00:00Z' },
  { id: '5', req_number: 'REQ-2026-0008', restaurant_name: 'La Médina', owner_name: 'Ibrahima Ba', email: 'ibrahima@example.com', region_id: 'dakar', region_name: 'Dakar', city: 'Médina', message: 'Restaurant familial.', desired_modules: ['menu', 'orders'], status: 'approved', created_at: '2026-05-11T11:00:00Z', reviewed_at: '2026-05-11T15:30:00Z' },
  { id: '6', req_number: 'REQ-2026-0007', restaurant_name: 'Chez Aminata', owner_name: 'Aminata Coulibaly', email: 'aminata@example.com', region_id: 'abidjan', region_name: 'Abidjan', city: 'Cocody', message: 'Maquis ivoirien.', desired_modules: ['menu', 'orders'], status: 'pending', created_at: '2026-05-10T16:00:00Z' },
];

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(amount: number, currencyCode: string, currencySymbol: string): string {
  if (!amount) return '—';
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: currencyCode === 'XOF' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'XOF' ? 0 : 2,
  }).format(amount);
  return `${formatted} ${currencySymbol}`;
}

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  pulse?: boolean;
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
      <p className="mt-1 text-2xl font-heading font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RegionDashboardPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const { data: regionsData }  = useRegions();
  const { data: statsData }    = useRegionStats(slug);
  const { data: historyData }  = useRegionTenantsHistory(slug);
  const { data: requestsData } = useRequests({ region: slug });

  const region = (regionsData ?? MOCK_REGIONS).find((r) => r.slug === slug) ?? MOCK_REGIONS[0]!;
  const stats   = statsData   ?? MOCK_STATS[slug]   ?? MOCK_STATS['dakar']!;
  const history = historyData ?? MOCK_HISTORY[slug] ?? MOCK_HISTORY['dakar']!;

  const allRequests = requestsData ?? MOCK_REQUESTS;
  const regionRequests = allRequests
    .filter((r) => r.region_id === slug || r.region_name === region.name)
    .slice(0, 5);

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="text-4xl leading-none mt-0.5">
            {FLAG[region.country_code] ?? '🌍'}
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-white">
              {region.platform_label}
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {region.country_name} · {region.currency_code} ({region.currency_symbol}) ·{' '}
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  region.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {region.is_active ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
              </span>
            </p>
          </div>
        </div>
        <a
          href={`https://terangatable.cloud/decouvrir/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/40 transition-all text-xs font-medium flex-shrink-0"
        >
          <Globe size={13} />
          Page publique
          <ExternalLink size={11} className="opacity-60" />
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 size={20} />}
          label="Tenants actifs"
          value={stats.active_tenants}
          sub="dans cette région"
        />
        <StatCard
          icon={<ShoppingCart size={20} />}
          label="Commandes aujourd'hui"
          value={stats.orders_today}
          sub="agrégat tous tenants"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Demandes en attente"
          value={stats.pending_requests}
          sub="à traiter"
          pulse={stats.pending_requests > 0}
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="CA du mois"
          value={formatCurrency(stats.revenue_month ?? 0, region.currency_code, region.currency_symbol)}
          sub="abonnements actifs"
        />
      </div>

      {/* Chart + Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* LineChart tenants 6 mois */}
        <div className="xl:col-span-3 bg-slate-800/60 border border-white/10 rounded-xl p-5">
          <h2 className="font-heading font-semibold text-white text-base mb-4">
            Tenants actifs sur 6 mois
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#F1F5F9',
                }}
                formatter={(v) => [v, 'tenants actifs']}
              />
              <Line
                type="monotone"
                dataKey="active_tenants"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ fill: '#8B5CF6', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#A78BFA' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feed demandes récentes */}
        <div className="xl:col-span-2 bg-slate-800/60 border border-white/10 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-white text-base">
              Demandes récentes
            </h2>
            <Link
              href={`/super-admin/regions/${slug}/requests`}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Voir toutes <ArrowRight size={12} />
            </Link>
          </div>

          {regionRequests.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center flex-1 flex items-center justify-center">
              Aucune demande dans cette région.
            </p>
          ) : (
            <div className="space-y-2.5 flex-1">
              {regionRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-slate-900/50 border border-white/5"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {req.status === 'approved' && <CheckCircle size={14} className="text-green-400" />}
                    {req.status === 'rejected' && <XCircle size={14} className="text-red-400" />}
                    {req.status === 'pending' && (
                      <span className="relative flex h-3 w-3 mt-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-200 font-medium truncate">
                      {req.restaurant_name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{req.owner_name} · {formatDate(req.created_at)}</p>
                  </div>
                  <span className={`flex-shrink-0 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[req.status]}`}>
                    {STATUS_LABEL[req.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href={`/super-admin/regions/${slug}/requests`}
          className="flex items-center justify-between p-4 bg-slate-800/60 border border-white/10 rounded-xl hover:border-violet-500/30 hover:bg-slate-800 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Gérer les demandes</p>
              <p className="text-xs text-slate-500">{stats.pending_requests} en attente</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
        </Link>
        <Link
          href={`/super-admin/regions/${slug}/tenants`}
          className="flex items-center justify-between p-4 bg-slate-800/60 border border-white/10 rounded-xl hover:border-violet-500/30 hover:bg-slate-800 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Building2 size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Gérer les tenants</p>
              <p className="text-xs text-slate-500">{stats.active_tenants} actifs</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
        </Link>
        <a
          href={`https://terangatable.cloud/decouvrir/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 bg-slate-800/60 border border-white/10 rounded-xl hover:border-green-500/30 hover:bg-slate-800 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Globe size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Page de découverte</p>
              <p className="text-xs text-slate-500">terangatable.cloud</p>
            </div>
          </div>
          <ExternalLink size={16} className="text-slate-500 group-hover:text-green-400 transition-colors" />
        </a>
      </div>
    </div>
  );
}
