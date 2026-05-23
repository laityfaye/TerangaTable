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

export interface PosSessionSummary {
  id:             string;
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

export interface PosSessionHistoryMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export function usePosSessionHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['pos', 'sessions', 'history', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PosSessionSummary[]; meta: PosSessionHistoryMeta }>(
        `/pos/sessions?page=${page}&limit=${limit}`,
      );
      return data;
    },
    staleTime: 60_000,
  });
}

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

export interface PosSessionStats {
  openingAmount: number;
  openedAt:      string;
  totalOrders:   number;
  totalSales:    number;
  salesByMethod: Record<string, number>;
}

export function usePosSessionStats(enabled = false) {
  return useQuery({
    queryKey: ['pos', 'session', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PosSessionStats }>('/pos/sessions/current/stats');
      return (data as unknown as { data: PosSessionStats }).data ?? (data as unknown as PosSessionStats);
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
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
