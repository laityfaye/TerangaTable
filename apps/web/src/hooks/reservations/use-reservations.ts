'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ReservationSource = 'website' | 'phone' | 'walk_in' | 'api';

export interface ReservationTable {
  id: string;
  number: string;
  capacity: number;
  shape: 'round' | 'square' | 'rect';
  zone?: { id: string; name: string } | null;
}

export interface ReservationCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
}

export interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_id: string | null;
  customer: ReservationCustomer | null;
  party_size: number;
  table: ReservationTable | null;
  table_id: string | null;
  reserved_at: string;
  duration_min: number;
  status: ReservationStatus;
  source: ReservationSource;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
}

export interface ReservationsResponse {
  data: Reservation[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListReservationsQuery {
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: ReservationStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateReservationPayload {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_id?: string;
  party_size: number;
  table_id?: string;
  reserved_at: string;
  duration_min?: number;
  source: ReservationSource;
  notes?: string;
}

export interface UpdateReservationPayload {
  id: string;
  table_id?: string;
  reserved_at?: string;
  duration_min?: number;
  party_size?: number;
  status?: ReservationStatus;
  notes?: string;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const RESERVATIONS_QKEY = {
  list: (q?: ListReservationsQuery) => ['reservations', q ?? {}] as const,
  detail: (id: string) => ['reservations', 'detail', id] as const,
};

// ── List ───────────────────────────────────────────────────────────────────────

export function useReservations(query?: ListReservationsQuery) {
  return useQuery({
    queryKey: RESERVATIONS_QKEY.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get<ReservationsResponse>('/reservations', {
        params: query,
      });
      return data;
    },
    staleTime: 30_000,
  });
}

// ── Detail ─────────────────────────────────────────────────────────────────────

export function useReservation(id: string) {
  return useQuery({
    queryKey: RESERVATIONS_QKEY.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Reservation>(`/reservations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReservationPayload) => {
      const { data } = await apiClient.post<Reservation>('/reservations', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

export function useUpdateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateReservationPayload) => {
      const { data } = await apiClient.patch<Reservation>(`/reservations/${id}`, payload);
      return data;
    },
    onSuccess: (r) => {
      qc.setQueryData(RESERVATIONS_QKEY.detail(r.id), r);
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<Reservation>(`/reservations/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}
