'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OptionSelection {
  group_id: string;
  group_name: string;
  option_id: string;
  option_name: string;
  price_delta: number;
}

export interface OrderItem {
  id: string;
  productId?: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  options: OptionSelection[];
  lineTotal: number;
  notes?: string | null;
  createdAt?: string;
}

export interface WorkflowStateSnap {
  id: string;
  name: string;
  color: string;
  slug: string;
  sortOrder?: number;
}

export interface Order {
  id: string;
  order_number: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'online';
  status: string;
  workflow_state: WorkflowStateSnap | null;
  table: { id: string; number: string } | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  agent: { id: string; firstName: string; lastName: string } | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  delivery_address: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
}

export interface Payment {
  id: string;
  method: string;
  amount: number;
  status: string;
  reference?: string | null;
  createdAt: string;
}

export interface OrdersResponse {
  data: Order[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AvailableTransition {
  id: string;
  name: string;
  toState: { id: string; name: string; color: string };
}

export interface ListOrdersQuery {
  status?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateOrderPayload {
  type: 'dine_in' | 'takeaway' | 'delivery' | 'online';
  table_id?: string;
  customer_id?: string;
  notes?: string;
  delivery_address?: Record<string, unknown>;
  items: Array<{
    product_id: string;
    quantity: number;
    options?: OptionSelection[];
    notes?: string;
  }>;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const ORDERS_QKEY = {
  list: (q?: ListOrdersQuery) => ['orders', q ?? {}] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  transitions: (id: string) => ['orders', 'transitions', id] as const,
};

// ── List ───────────────────────────────────────────────────────────────────────

export function useOrders(query?: ListOrdersQuery) {
  return useQuery({
    queryKey: ORDERS_QKEY.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get<OrdersResponse>('/orders', { params: query });
      return data;
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

// ── Detail ─────────────────────────────────────────────────────────────────────

export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDERS_QKEY.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Order>(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── Transitions ────────────────────────────────────────────────────────────────

export function useOrderTransitions(orderId: string, enabled = false) {
  return useQuery({
    queryKey: ORDERS_QKEY.transitions(orderId),
    queryFn: async () => {
      const { data } = await apiClient.get<AvailableTransition[]>(
        `/orders/${orderId}/transitions`,
      );
      return data;
    },
    enabled: !!orderId && enabled,
    staleTime: 10_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const { data } = await apiClient.post<Order>('/orders', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: string; notes?: string; delivery_address?: Record<string, unknown> }) => {
      const { data } = await apiClient.patch<Order>(`/orders/${id}`, payload);
      return data;
    },
    onSuccess: (order) => {
      qc.setQueryData(ORDERS_QKEY.detail(order.id), order);
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/orders/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useTransitionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      transitionId,
    }: {
      orderId: string;
      transitionId: string;
    }) => {
      const { data } = await apiClient.post(`/orders/${orderId}/transition`, {
        transitionId,
      });
      return data;
    },
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ORDERS_QKEY.detail(orderId) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAddOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      ...item
    }: {
      orderId: string;
      product_id: string;
      quantity: number;
      options?: OptionSelection[];
      notes?: string;
    }) => {
      const { data } = await apiClient.post(`/orders/${orderId}/items`, item);
      return data;
    },
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ORDERS_QKEY.detail(orderId) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRemoveOrderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, itemId }: { orderId: string; itemId: string }) => {
      await apiClient.delete(`/orders/${orderId}/items/${itemId}`);
    },
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ORDERS_QKEY.detail(orderId) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
