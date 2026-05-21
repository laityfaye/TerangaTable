'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Setting {
  id: string;
  key: string;
  value: unknown;
  type: string;
  category: string | null;
  updatedAt: string;
}

export interface SettingsResponse {
  data: Setting[];
  grouped: Record<string, Record<string, unknown>>;
}

export interface UpdateSettingItem {
  key: string;
  value: unknown;
  category?: string;
}

export const SETTINGS_QKEY = ['settings'] as const;

export function useSettings() {
  return useQuery<SettingsResponse>({
    queryKey: SETTINGS_QKEY,
    queryFn: async () => {
      const { data } = await apiClient.get<SettingsResponse>('/settings');
      return data;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: UpdateSettingItem[]) => apiClient.patch('/settings', items),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SETTINGS_QKEY });
    },
  });
}
