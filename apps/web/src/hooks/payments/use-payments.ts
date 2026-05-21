'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'online' | 'voucher';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id:         string;
  order_id:   string;
  order?:     { id: string; order_number: string };
  method:     PaymentMethod;
  amount:     number;
  reference:  string | null;
  status:     PaymentStatus;
  metadata:   Record<string, unknown>;
  created_at: string;
}

export interface PaymentsResponse {
  data: Payment[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface PaymentSummary {
  total:     number;
  by_method: Partial<Record<PaymentMethod, number>>;
  count:     number;
}

export interface ListPaymentsQuery {
  date_from?: string;
  date_to?:   string;
  method?:    PaymentMethod;
  status?:    PaymentStatus;
  page?:      number;
  limit?:     number;
}

export interface CreatePaymentPayload {
  order_id:  string;
  method:    PaymentMethod;
  amount:    number;
  reference?: string;
  metadata?:  Record<string, unknown>;
}

export interface RefundResult {
  refunded:       boolean;
  original:       Payment;
  refund_payment: Payment;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const PAYMENTS_QKEY = {
  list:    (q?: ListPaymentsQuery) => ['payments', q ?? {}] as const,
  detail:  (id: string)            => ['payments', 'detail', id] as const,
  summary: (q?: { date_from?: string; date_to?: string }) =>
    ['payments', 'summary', q ?? {}] as const,
};

// ── List ───────────────────────────────────────────────────────────────────────

export function usePayments(query?: ListPaymentsQuery) {
  return useQuery({
    queryKey: PAYMENTS_QKEY.list(query),
    queryFn:  async () => {
      const { data } = await apiClient.get<PaymentsResponse>('/payments', { params: query });
      return data;
    },
    staleTime: 30_000,
  });
}

// ── Detail ─────────────────────────────────────────────────────────────────────

export function usePayment(id: string) {
  return useQuery({
    queryKey: PAYMENTS_QKEY.detail(id),
    queryFn:  async () => {
      const { data } = await apiClient.get<{ data: Payment }>(`/payments/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

// ── Summary ────────────────────────────────────────────────────────────────────

export function usePaymentSummary(query?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: PAYMENTS_QKEY.summary(query),
    queryFn:  async () => {
      const { data } = await apiClient.get<{ data: PaymentSummary }>('/payments/summary', {
        params: query,
      });
      return data.data;
    },
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePaymentPayload) => {
      const { data } = await apiClient.post<{ data: Payment }>('/payments', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await apiClient.post<{ data: RefundResult }>(`/payments/${id}/refund`, { reason });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
