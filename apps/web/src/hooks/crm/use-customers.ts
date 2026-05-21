'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type CustomerSegment = 'new' | 'regular' | 'vip' | 'inactive';

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  last_visit_at: string | null;
  segment: CustomerSegment;
  notes: string | null;
  created_at: string;
}

export interface SegmentCounts {
  all: number;
  new: number;
  regular: number;
  vip: number;
  inactive: number;
}

export interface CustomersResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counts: SegmentCounts;
  };
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  type: string;
  workflow_state: { id: string; name: string; color: string; slug: string } | null;
  total: number;
  created_at: string;
  items_count: number;
}

export interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export interface LoyaltyReward {
  points_required: number;
  description: string;
  type: 'discount' | 'gift' | 'upgrade';
}

export interface LoyaltySettings {
  enabled: boolean;
  points_per_amount: number;
  redemption_points: number;
  redemption_value: number;
  expiry_days: number;
  vip_threshold_type: 'percent' | 'amount';
  vip_threshold_value: number;
  rewards: LoyaltyReward[];
}

export interface ListCustomersQuery {
  segment?: CustomerSegment;
  search?: string;
  sort_by?: 'total_spent' | 'last_visit_at' | 'total_orders' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateCustomerPayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const CUSTOMERS_QKEY = {
  list: (q?: ListCustomersQuery) => ['customers', q ?? {}] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
  orders: (id: string) => ['customers', id, 'orders'] as const,
  loyalty: (id: string) => ['customers', id, 'loyalty'] as const,
  loyaltySettings: () => ['loyalty', 'settings'] as const,
  loyaltyBalance: (id: string) => ['loyalty', 'balance', id] as const,
};

// ── List ───────────────────────────────────────────────────────────────────────

export function useCustomers(query?: ListCustomersQuery) {
  return useQuery({
    queryKey: CUSTOMERS_QKEY.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get<CustomersResponse>('/customers', { params: query });
      return data;
    },
    staleTime: 30_000,
  });
}

// ── Detail ─────────────────────────────────────────────────────────────────────

export function useCustomer(id: string) {
  return useQuery({
    queryKey: CUSTOMERS_QKEY.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Customer>(`/customers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── Customer orders ────────────────────────────────────────────────────────────

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: CUSTOMERS_QKEY.orders(customerId),
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerOrder[]>(`/customers/${customerId}/orders`);
      return data;
    },
    enabled: !!customerId,
  });
}

// ── Customer loyalty history ───────────────────────────────────────────────────

export function useCustomerLoyalty(customerId: string) {
  return useQuery({
    queryKey: CUSTOMERS_QKEY.loyalty(customerId),
    queryFn: async () => {
      const { data } = await apiClient.get<LoyaltyTransaction[]>(`/customers/${customerId}/loyalty`);
      return data;
    },
    enabled: !!customerId,
  });
}

// ── Loyalty settings ───────────────────────────────────────────────────────────

export function useLoyaltySettings() {
  return useQuery({
    queryKey: CUSTOMERS_QKEY.loyaltySettings(),
    queryFn: async () => {
      const { data } = await apiClient.get<LoyaltySettings>('/loyalty/settings');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useUpdateLoyaltySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: LoyaltySettings) => {
      const { data } = await apiClient.put<LoyaltySettings>('/loyalty/settings', settings);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(CUSTOMERS_QKEY.loyaltySettings(), data);
    },
  });
}

// ── Loyalty balance ────────────────────────────────────────────────────────────

export function useLoyaltyBalance(customerId: string) {
  return useQuery({
    queryKey: CUSTOMERS_QKEY.loyaltyBalance(customerId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/loyalty/balance/${customerId}`);
      return data as { customer_id: string; balance: number; transactions: LoyaltyTransaction[] };
    },
    enabled: !!customerId,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      const { data } = await apiClient.post<Customer>('/customers', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & UpdateCustomerPayload) => {
      const { data } = await apiClient.patch<Customer>(`/customers/${id}`, payload);
      return data;
    },
    onSuccess: (customer) => {
      qc.setQueryData(CUSTOMERS_QKEY.detail(customer.id), customer);
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useArchiveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/customers/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useEarnPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { customer_id: string; order_id?: string; amount: number }) => {
      const { data } = await apiClient.post('/loyalty/earn', payload);
      return data as { points_earned: number; new_balance: number };
    },
    onSuccess: (_, { customer_id }) => {
      qc.invalidateQueries({ queryKey: CUSTOMERS_QKEY.detail(customer_id) });
      qc.invalidateQueries({ queryKey: CUSTOMERS_QKEY.loyalty(customer_id) });
    },
  });
}

export function useRedeemPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { customer_id: string; order_id?: string; points: number }) => {
      const { data } = await apiClient.post('/loyalty/redeem', payload);
      return data as { points_redeemed: number; discount_value: number; new_balance: number };
    },
    onSuccess: (_, { customer_id }) => {
      qc.invalidateQueries({ queryKey: CUSTOMERS_QKEY.detail(customer_id) });
      qc.invalidateQueries({ queryKey: CUSTOMERS_QKEY.loyalty(customer_id) });
    },
  });
}
