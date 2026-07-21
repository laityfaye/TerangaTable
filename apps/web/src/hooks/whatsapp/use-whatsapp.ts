'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface WhatsappStatus {
  active: boolean;
  shared_number: string | null;
  conversations_count: number;
  completed_orders_count: number;
}

export function useWhatsappStatus() {
  return useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: WhatsappStatus }>('/whatsapp/admin/status');
      return data.data;
    },
  });
}
