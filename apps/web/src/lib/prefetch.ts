'use client';

import type { QueryClient } from '@tanstack/react-query';
import { apiClient } from './api';

const STALE_30S = 30_000;
const STALE_2M  = 2 * 60_000;
const STALE_5M  = 5 * 60_000;
const STALE_10M = 10 * 60_000;

// Query key builders — must match what the hooks use exactly
const QK = {
  orders:          (q = {})          => ['orders', q] as const,
  workflows:       ()                => ['workflows'] as const,
  categories:      ()                => ['categories'] as const,
  summary:         (q: object)       => ['analytics', 'summary',    q] as const,
  revenue:         (q: object)       => ['analytics', 'revenue',    q] as const,
  peakHours:       (days: number)    => ['analytics', 'peak-hours', days] as const,
  posSession:      ()                => ['pos', 'session', 'current'] as const,
  reservations:    (q = {})          => ['reservations', q] as const,
  customers:       (q = {})          => ['customers', q] as const,
  payments:        (q = {})          => ['payments', q] as const,
  paymentsSummary: (q = {})          => ['payments', 'summary', q] as const,
  websiteSettings: ()                => ['website-settings'] as const,
  websiteThemes:   ()                => ['website-themes'] as const,
  deliveryKpis:    ()                => ['delivery', 'kpis'] as const,
  deliveryActive:  ()                => ['delivery', 'active'] as const,
  deliveryZones:   ()                => ['delivery', 'zones'] as const,
  deliveryDrivers: ()                => ['delivery', 'drivers'] as const,
  settings:        ()                => ['settings'] as const,
};

// Query functions — must return the same shape as the hooks
const QF = {
  orders:          (params: object) => () =>
    apiClient.get('/orders', { params }).then(r => r.data),
  workflows:       () => () =>
    apiClient.get<{ data: unknown[] }>('/workflows').then(r => r.data.data),
  categories:      () => () =>
    apiClient.get<{ data: unknown[] }>('/categories').then(r => r.data.data),
  summary:         (params: object) => () =>
    apiClient.get<{ data: unknown }>('/analytics/summary', { params }).then(r => r.data.data),
  revenue:         (params: object) => () =>
    apiClient.get<{ data: unknown }>('/analytics/revenue', { params }).then(r => r.data.data),
  peakHours:       (days: number) => () =>
    apiClient.get<{ data: unknown }>('/analytics/peak-hours', { params: { days } }).then(r => r.data.data),
  posSession:      () => () =>
    apiClient.get<{ data: unknown }>('/pos/sessions/current').then(r => r.data.data),
  reservations:    (params: object) => () =>
    apiClient.get('/reservations', { params }).then(r => r.data),
  customers:       (params: object) => () =>
    apiClient.get('/customers', { params }).then(r => r.data),
  payments:        (params: object) => () =>
    apiClient.get('/payments', { params }).then(r => r.data),
  paymentsSummary: (params: object) => () =>
    apiClient.get('/payments/summary', { params }).then(r => r.data),
  websiteSettings: () => () =>
    apiClient.get<{ data: unknown }>('/website/settings').then(r => r.data.data),
  websiteThemes:   () => () =>
    apiClient.get<{ data: unknown[] }>('/website/themes').then(r => r.data.data),
  deliveryKpis:    () => () =>
    apiClient.get<{ data: unknown }>('/delivery/kpis').then(r => r.data.data),
  deliveryActive:  () => () =>
    apiClient.get<{ data: unknown }>('/delivery/active').then(r => r.data.data),
  deliveryZones:   () => () =>
    apiClient.get<{ data: unknown }>('/delivery/zones').then(r => r.data.data),
  deliveryDrivers: () => () =>
    apiClient.get<{ data: unknown }>('/delivery/drivers').then(r => r.data.data),
  settings:        () => () =>
    apiClient.get('/settings').then(r => r.data),
};

// Route → queries to prefetch on hover
export function prefetchRoute(href: string, qc: QueryClient): void {
  switch (href) {
    case '/dashboard':
      void qc.prefetchQuery({ queryKey: QK.summary({ period: 'today' }),                      queryFn: QF.summary({ period: 'today' }),                    staleTime: STALE_5M });
      void qc.prefetchQuery({ queryKey: QK.revenue({ period: '7d', granularity: 'day' }),     queryFn: QF.revenue({ period: '7d', granularity: 'day' }),   staleTime: STALE_5M });
      void qc.prefetchQuery({ queryKey: QK.peakHours(7),                                       queryFn: QF.peakHours(7),                                    staleTime: STALE_5M });
      void qc.prefetchQuery({ queryKey: QK.orders({ limit: 5 }),                               queryFn: QF.orders({ limit: 5 }),                            staleTime: STALE_2M });
      break;

    case '/dashboard/orders':
      void qc.prefetchQuery({ queryKey: QK.orders({ limit: 200 }),   queryFn: QF.orders({ limit: 200 }),   staleTime: STALE_2M });
      void qc.prefetchQuery({ queryKey: QK.workflows(),               queryFn: QF.workflows(),               staleTime: STALE_10M });
      break;

    case '/dashboard/pos':
      void qc.prefetchQuery({ queryKey: QK.posSession(), queryFn: QF.posSession(), staleTime: STALE_30S });
      void qc.prefetchQuery({ queryKey: QK.orders({ limit: 50, status: 'open' }), queryFn: QF.orders({ limit: 50, status: 'open' }), staleTime: STALE_2M });
      break;

    case '/dashboard/reservations':
      void qc.prefetchQuery({ queryKey: QK.reservations(), queryFn: QF.reservations({}), staleTime: STALE_30S });
      break;

    case '/dashboard/menu':
      void qc.prefetchQuery({ queryKey: QK.categories(), queryFn: QF.categories(), staleTime: STALE_10M });
      break;

    case '/dashboard/customers':
      void qc.prefetchQuery({ queryKey: QK.customers(), queryFn: QF.customers({}), staleTime: STALE_30S });
      break;

    case '/dashboard/payments':
      void qc.prefetchQuery({ queryKey: QK.payments(),        queryFn: QF.payments({}),        staleTime: STALE_30S });
      void qc.prefetchQuery({ queryKey: QK.paymentsSummary(), queryFn: QF.paymentsSummary({}), staleTime: STALE_2M });
      break;

    case '/dashboard/analytics':
      void qc.prefetchQuery({ queryKey: QK.summary({ period: '7d' }),                      queryFn: QF.summary({ period: '7d' }),                    staleTime: STALE_5M });
      void qc.prefetchQuery({ queryKey: QK.revenue({ period: '7d', granularity: 'day' }), queryFn: QF.revenue({ period: '7d', granularity: 'day' }), staleTime: STALE_5M });
      void qc.prefetchQuery({ queryKey: QK.peakHours(7),                                   queryFn: QF.peakHours(7),                                  staleTime: STALE_5M });
      break;

    case '/dashboard/website':
      void qc.prefetchQuery({ queryKey: QK.websiteSettings(), queryFn: QF.websiteSettings(), staleTime: STALE_30S });
      void qc.prefetchQuery({ queryKey: QK.websiteThemes(),   queryFn: QF.websiteThemes(),   staleTime: STALE_10M });
      break;

    case '/dashboard/delivery':
      void qc.prefetchQuery({ queryKey: QK.deliveryKpis(),    queryFn: QF.deliveryKpis(),    staleTime: STALE_30S });
      void qc.prefetchQuery({ queryKey: QK.deliveryActive(),  queryFn: QF.deliveryActive(),  staleTime: STALE_30S });
      void qc.prefetchQuery({ queryKey: QK.deliveryZones(),   queryFn: QF.deliveryZones(),   staleTime: STALE_2M  });
      void qc.prefetchQuery({ queryKey: QK.deliveryDrivers(), queryFn: QF.deliveryDrivers(), staleTime: STALE_30S });
      break;

    case '/dashboard/settings':
    case '/dashboard/settings/users':
      void qc.prefetchQuery({ queryKey: QK.settings(), queryFn: QF.settings(), staleTime: STALE_10M });
      break;
  }
}
