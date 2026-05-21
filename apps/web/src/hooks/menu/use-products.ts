'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string | null;
  category_id: string | null;
  category_name?: string | null;
  is_available: boolean;
  is_featured: boolean;
  sku?: string | null;
  sort_order?: number;
  tags?: string[];
  allergens?: string[];
  calories?: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
  serving_size?: string;
}

export interface ProductFilters {
  category_id?: string;
  search?: string;
  is_available?: boolean;
  is_featured?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductPayload {
  name: string;
  description?: string | undefined;
  base_price: number;
  category_id: string;
  is_available?: boolean | undefined;
  is_featured?: boolean | undefined;
  sku?: string | undefined;
  sort_order?: number | undefined;
  tags?: string[] | undefined;
  allergens?: string[] | undefined;
  calories?: number | undefined;
  proteins?: number | undefined;
  carbs?: number | undefined;
  fats?: number | undefined;
  serving_size?: string | undefined;
}

const QKEY = ['products'] as const;

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [...QKEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Product[] }>('/products', { params: filters });
      return data.data;
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [...QKEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Product }>(`/products/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductPayload) => {
      const { data } = await apiClient.post<{ data: Product }>('/products', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProductPayload>;
    }) => {
      const { data } = await apiClient.patch<{ data: Product }>(`/products/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      await apiClient.patch(`/products/${id}/availability`, { is_available });
    },
    onMutate: async ({ id, is_available }) => {
      await qc.cancelQueries({ queryKey: QKEY });
      const snapshots = qc.getQueriesData<Product[]>({ queryKey: QKEY });
      qc.setQueriesData<Product[]>({ queryKey: QKEY }, (old) =>
        old?.map((p) => (p.id === id ? { ...p, is_available } : p)),
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useReorderProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ id: string; sort_order: number }>) => {
      await apiClient.patch('/products/reorder', items);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}
