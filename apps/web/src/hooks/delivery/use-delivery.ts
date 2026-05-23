'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DeliveryZone {
  id: string;
  name: string;
  type: 'radius' | 'polygon';
  radius_km: number | null;
  polygon: Record<string, unknown> | null;
  min_order: number;
  delivery_fee: number;
  is_active: boolean;
  agents_count: number;
}

export interface DeliveryDriver {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  is_available: boolean;
  zone: { id: string; name: string } | null;
  deliveries_today: number;
  created_at: string;
}

export interface DeliveryRecord {
  id: string;
  order_id: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'failed';
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  order: {
    id: string;
    order_number: string;
    delivery_address: Record<string, unknown> | null;
    customer: { firstName: string; lastName: string; phone: string | null } | null;
  } | null;
  agent: { id: string; name: string; phone: string | null } | null;
}

export interface DeliveryKpis {
  active: number;
  pending: number;
  delivered_today: number;
  failed_today: number;
}

export interface CreateZonePayload {
  name: string;
  type: 'radius' | 'polygon';
  radius_km?: number;
  polygon?: Record<string, unknown>;
  min_order?: number;
  delivery_fee?: number;
  is_active?: boolean;
}

export interface CreateDriverPayload {
  user_id: string;
  name: string;
  phone?: string;
  zone_id?: string;
  notes?: string;
}

export interface UpdateDriverPayload {
  name?: string;
  phone?: string;
  zone_id?: string | null;
  is_available?: boolean;
}

export interface AssignPayload {
  order_id: string;
  agent_id: string;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const DELIVERY_QKEY = {
  kpis: () => ['delivery', 'kpis'] as const,
  active: () => ['delivery', 'active'] as const,
  zones: () => ['delivery', 'zones'] as const,
  zone: (id: string) => ['delivery', 'zones', id] as const,
  drivers: () => ['delivery', 'drivers'] as const,
  driver: (id: string) => ['delivery', 'drivers', id] as const,
};

// ── KPIs ───────────────────────────────────────────────────────────────────────

export function useDeliveryKpis() {
  return useQuery({
    queryKey: DELIVERY_QKEY.kpis(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DeliveryKpis }>('/delivery/kpis');
      return data.data;
    },
    refetchInterval: 30_000,
  });
}

// ── Active deliveries ──────────────────────────────────────────────────────────

export function useActiveDeliveries() {
  return useQuery({
    queryKey: DELIVERY_QKEY.active(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DeliveryRecord[] }>('/delivery/active');
      return data.data;
    },
    refetchInterval: 15_000,
  });
}

// ── Zones ──────────────────────────────────────────────────────────────────────

export function useDeliveryZones() {
  return useQuery({
    queryKey: DELIVERY_QKEY.zones(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DeliveryZone[] }>('/delivery/zones');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateZonePayload) =>
      apiClient.post<{ data: DeliveryZone }>('/delivery/zones', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DELIVERY_QKEY.zones() }),
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<CreateZonePayload> & { id: string }) =>
      apiClient.patch<{ data: DeliveryZone }>(`/delivery/zones/${id}`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DELIVERY_QKEY.zones() }),
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ data: unknown }>(`/delivery/zones/${id}`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DELIVERY_QKEY.zones() }),
  });
}

// ── Drivers ────────────────────────────────────────────────────────────────────

export function useDeliveryDrivers() {
  return useQuery({
    queryKey: DELIVERY_QKEY.drivers(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DeliveryDriver[] }>('/delivery/drivers');
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDriverPayload) =>
      apiClient.post<{ data: DeliveryDriver }>('/delivery/drivers', payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DELIVERY_QKEY.drivers() }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateDriverPayload & { id: string }) =>
      apiClient.patch<{ data: DeliveryDriver }>(`/delivery/drivers/${id}`, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DELIVERY_QKEY.drivers() }),
  });
}

export function useToggleDriverAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<{ data: DeliveryDriver }>(`/delivery/drivers/${id}/availability`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DELIVERY_QKEY.drivers() }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ data: unknown }>(`/delivery/drivers/${id}`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DELIVERY_QKEY.drivers() }),
  });
}

// ── Assign ─────────────────────────────────────────────────────────────────────

export function useAssignDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignPayload) =>
      apiClient.post<{ data: DeliveryRecord }>('/delivery/assign', payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DELIVERY_QKEY.active() });
      qc.invalidateQueries({ queryKey: DELIVERY_QKEY.kpis() });
    },
  });
}

export function useAutoAssignDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient.post<{ data: DeliveryRecord }>(`/delivery/auto-assign/${orderId}`).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DELIVERY_QKEY.active() });
      qc.invalidateQueries({ queryKey: DELIVERY_QKEY.kpis() });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      apiClient
        .patch<{ data: DeliveryRecord }>(`/delivery/${id}/status`, { status, notes })
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DELIVERY_QKEY.active() });
      qc.invalidateQueries({ queryKey: DELIVERY_QKEY.kpis() });
    },
  });
}
