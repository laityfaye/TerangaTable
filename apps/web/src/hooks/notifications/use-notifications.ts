'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  unread_count: number;
}

export const NOTIFS_QKEY = {
  all: ['notifications'] as const,
};

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: NOTIFS_QKEY.all,
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationsResponse>('/notifications');
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIFS_QKEY.all });
      const prev = qc.getQueryData<NotificationsResponse>(NOTIFS_QKEY.all);
      if (prev) {
        qc.setQueryData<NotificationsResponse>(NOTIFS_QKEY.all, {
          data: prev.data.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
          unread_count: Math.max(0, prev.unread_count - 1),
        });
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(NOTIFS_QKEY.all, ctx.prev);
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: NOTIFS_QKEY.all });
      const prev = qc.getQueryData<NotificationsResponse>(NOTIFS_QKEY.all);
      if (prev) {
        qc.setQueryData<NotificationsResponse>(NOTIFS_QKEY.all, {
          data: prev.data.map((n) => ({ ...n, is_read: true })),
          unread_count: 0,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(NOTIFS_QKEY.all, ctx.prev);
    },
  });
}
