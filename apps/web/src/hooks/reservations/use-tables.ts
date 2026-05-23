'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TableShape = 'round' | 'square' | 'rect';

export interface Zone {
  id: string;
  name: string;
  is_active: boolean;
  table_count?: number;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  shape: TableShape;
  zone: { id: string; name: string } | null;
  pos_x: number;
  pos_y: number;
  is_active: boolean;
  available?: boolean;
}

export interface CreateZonePayload { name: string }
export interface UpdateZonePayload { id: string; name?: string; is_active?: boolean }

export interface CreateTablePayload {
  number: string;
  capacity: number;
  shape: TableShape;
  zone_id?: string;
  pos_x?: number;
  pos_y?: number;
}

export interface UpdateTablePayload {
  id: string;
  number?: string;
  capacity?: number;
  shape?: TableShape;
  zone_id?: string;
  pos_x?: number;
  pos_y?: number;
  is_active?: boolean;
}

export interface TableAvailabilityQuery {
  date: string;
  party_size: number;
  duration_min?: number;
}

// ── Zones ──────────────────────────────────────────────────────────────────────

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data } = await apiClient.get<Zone[] | { data: Zone[] }>('/zones');
      return (Array.isArray(data) ? data : (data as { data: Zone[] }).data) ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateZonePayload) => {
      const { data } = await apiClient.post<Zone>('/zones', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateZonePayload) => {
      const { data } = await apiClient.patch<Zone>(`/zones/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/zones/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      qc.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

// ── Tables ─────────────────────────────────────────────────────────────────────

export function useTables(zoneId?: string) {
  return useQuery({
    queryKey: ['tables', { zoneId }],
    queryFn: async () => {
      const { data } = await apiClient.get<Table[] | { data: Table[] }>('/tables', {
        params: zoneId ? { zone_id: zoneId } : undefined,
      });
      return (Array.isArray(data) ? data : (data as { data: Table[] }).data) ?? [];
    },
    staleTime: 30_000,
  });
}

export function useTableAvailability(query: TableAvailabilityQuery | null) {
  return useQuery({
    queryKey: ['tables', 'availability', query],
    queryFn: async () => {
      const { data } = await apiClient.get<Table[]>('/tables/availability', { params: query! });
      return data;
    },
    enabled: !!query,
    staleTime: 15_000,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTablePayload) => {
      const { data } = await apiClient.post<Table>('/tables', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTablePayload) => {
      const { data } = await apiClient.patch<Table>(`/tables/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tables/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
}
