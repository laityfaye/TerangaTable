'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'custom';
export type Granularity = 'day' | 'week' | 'month';

export interface AnalyticsQuery {
  period?: AnalyticsPeriod;
  date_from?: string;
  date_to?: string;
}

export interface SummaryVariations {
  orders_count:    number | null;
  revenue_total:   number | null;
  avg_order_value: number | null;
  new_customers:   number | null;
}

export interface AnalyticsSummary {
  period:          { from: string; to: string };
  orders_count:    number;
  revenue_total:   number;
  avg_order_value: number;
  new_customers:   number;
  variations:      SummaryVariations;
}

export interface RevenuePoint {
  date:         string;
  revenue:      number;
  orders_count: number;
}

export interface RevenueData {
  granularity: Granularity;
  period:      { from: string; to: string };
  current:     RevenuePoint[];
  previous:    RevenuePoint[];
}

export interface TopProductItem {
  product_id:    string;
  product_name:  string;
  total_quantity: number;
  total_revenue: number;
  revenue_pct:   number;
}

export interface TopProductsData {
  period: { from: string; to: string };
  items:  TopProductItem[];
}

export interface PeakHoursData {
  days:       number;
  matrix:     number[][];   // [7 days][24 hours]
  day_labels: string[];
}

export interface OrderTypeItem {
  type:  string;
  count: number;
  pct:   number;
}

export interface OrderTypesData {
  period: { from: string; to: string };
  total:  number;
  items:  OrderTypeItem[];
}

export interface StaffItem {
  agent_id:    string;
  name:        string;
  order_count: number;
  revenue:     number;
}

export interface StaffData {
  period: { from: string; to: string };
  items:  StaffItem[];
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const ANALYTICS_QKEY = {
  summary:     (q: AnalyticsQuery) => ['analytics', 'summary',     q] as const,
  revenue:     (q: AnalyticsQuery) => ['analytics', 'revenue',     q] as const,
  topProducts: (q: AnalyticsQuery) => ['analytics', 'top-products', q] as const,
  peakHours:   (days: number)      => ['analytics', 'peak-hours',  days] as const,
  orderTypes:  (q: AnalyticsQuery) => ['analytics', 'order-types', q] as const,
  staff:       (q: AnalyticsQuery) => ['analytics', 'staff',       q] as const,
};

const STALE = 5 * 60 * 1000; // 5 min — aligns with Redis TTL

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useAnalyticsSummary(query: AnalyticsQuery) {
  return useQuery({
    queryKey: ANALYTICS_QKEY.summary(query),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AnalyticsSummary }>('/analytics/summary', {
        params: query,
      });
      return data.data;
    },
    staleTime: STALE,
  });
}

export function useAnalyticsRevenue(query: AnalyticsQuery & { granularity?: Granularity }) {
  return useQuery({
    queryKey: ANALYTICS_QKEY.revenue(query),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: RevenueData }>('/analytics/revenue', {
        params: query,
      });
      return data.data;
    },
    staleTime: STALE,
  });
}

export function useAnalyticsTopProducts(query: AnalyticsQuery) {
  return useQuery({
    queryKey: ANALYTICS_QKEY.topProducts(query),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: TopProductsData }>('/analytics/top-products', {
        params: query,
      });
      return data.data;
    },
    staleTime: STALE,
  });
}

export function useAnalyticsPeakHours(days = 7) {
  return useQuery({
    queryKey: ANALYTICS_QKEY.peakHours(days),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PeakHoursData }>('/analytics/peak-hours', {
        params: { days },
      });
      return data.data;
    },
    staleTime: STALE,
  });
}

export function useAnalyticsOrderTypes(query: AnalyticsQuery) {
  return useQuery({
    queryKey: ANALYTICS_QKEY.orderTypes(query),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: OrderTypesData }>('/analytics/order-types', {
        params: query,
      });
      return data.data;
    },
    staleTime: STALE,
  });
}

export function useAnalyticsStaff(query: AnalyticsQuery) {
  return useQuery({
    queryKey: ANALYTICS_QKEY.staff(query),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: StaffData }>('/analytics/staff', {
        params: query,
      });
      return data.data;
    },
    staleTime: STALE,
  });
}

// ── Export helper (direct download) ───────────────────────────────────────────

export function triggerCsvExport(query: AnalyticsQuery, accessToken: string, tenantId: string) {
  const params = new URLSearchParams();
  if (query.period)    params.set('period',    query.period);
  if (query.date_from) params.set('date_from', query.date_from);
  if (query.date_to)   params.set('date_to',   query.date_to);
  params.set('format', 'csv');

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';
  const url = `${apiUrl}/analytics/export?${params.toString()}`;

  // Use fetch to add auth headers, then create blob download
  void fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Tenant-ID':  tenantId,
    },
  })
    .then((res) => res.blob())
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
}
