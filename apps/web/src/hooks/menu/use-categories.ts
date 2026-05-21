'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string | null;
  sort_order: number;
  parent_id?: string | null;
  is_active: boolean;
  product_count?: number;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  image_url?: string | null;
  sort_order?: number;
  parent_id?: string | null;
  is_active?: boolean;
}

const QKEY = ['categories'] as const;

export function useCategories() {
  return useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Category[] }>('/categories');
      return data.data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryPayload) => {
      const { data } = await apiClient.post<{ data: Category }>('/categories', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CategoryPayload>;
    }) => {
      const { data } = await apiClient.patch<{ data: Category }>(`/categories/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ id: string; sort_order: number }>) => {
      await apiClient.patch('/categories/reorder', items);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}
