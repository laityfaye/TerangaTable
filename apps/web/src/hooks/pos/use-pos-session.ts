'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PosSession {
  id:             string;
  tenantId:       string;
  openedById:     string;
  closedById:     string | null;
  openingAmount:  number;
  closingAmount:  number | null;
  totalSales:     number;
  totalOrders:    number;
  salesByMethod:  Record<string, number>;
  cashDifference: number | null;
  status:         'open' | 'closed';
  openedAt:       string;
  closedAt:       string | null;
  openedBy:       { id: string; firstName: string; lastName: string };
  closedBy:       { id: string; firstName: string; lastName: string } | null;
}

export interface OpenSessionPayload {
  opening_amount: number;
  notes?: string;
}

export interface CloseSessionPayload {
  closing_amount: number;
  notes?: string;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const POS_SESSION_QKEY = {
  current: ['pos', 'session', 'current'] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function usePosCurrentSession() {
  return useQuery({
    queryKey: POS_SESSION_QKEY.current,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PosSession }>('/pos/sessions/current');
      return data.data;
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useOpenPosSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OpenSessionPayload) => {
      const { data } = await apiClient.post<{ data: PosSession }>('/pos/sessions/open', payload);
      return data.data;
    },
    onSuccess: (session) => {
      qc.setQueryData(POS_SESSION_QKEY.current, session);
    },
  });
}

export function useClosePosSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CloseSessionPayload) => {
      const { data } = await apiClient.post<{ data: PosSession }>('/pos/sessions/close', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: POS_SESSION_QKEY.current });
    },
  });
}
