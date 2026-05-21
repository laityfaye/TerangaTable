'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface TenantRequest {
  id: string;
  req_number: string;
  restaurant_name: string;
  owner_name: string;
  email: string;
  phone?: string;
  region_id: string;
  region_name: string;
  city?: string;
  message?: string;
  desired_modules?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  region_id: string;
  region_name: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'trial' | 'suspended' | 'deleted';
  created_at: string;
  orders_total?: number;
  revenue_total?: number;
  users?: { id: string; email: string; first_name: string; last_name: string }[];
  modules?: string[];
}

export interface Region {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  country_name: string;
  platform_label: string;
  timezone: string;
  currency_code: string;
  currency_symbol: string;
  locale: string;
  is_active: boolean;
  tenants_count?: number;
  pending_requests_count?: number;
  regional_admin?: { id: string; email: string; first_name: string; last_name: string } | null;
}

export interface DashboardStats {
  active_tenants: number;
  pending_requests: number;
  new_this_month: number;
}

export interface PlatformModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  required_plan: string;
  is_active: boolean;
  active_tenants_count?: number;
}

interface RequestFilters {
  region?: string;
  status?: string;
  search?: string;
}

interface TenantFilters {
  region?: string;
  status?: string;
  plan?: string;
  search?: string;
}

export function useRequests(filters: RequestFilters = {}) {
  return useQuery({
    queryKey: ['super-admin', 'requests', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.region) params.set('regionId', filters.region);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      const { data } = await apiClient.get<{ data: TenantRequest[] }>(
        `/tenant-requests?${params.toString()}`,
      );
      return data.data;
    },
  });
}

export function useTenants(filters: TenantFilters = {}) {
  return useQuery({
    queryKey: ['super-admin', 'tenants', filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => Boolean(v))),
      );
      const { data } = await apiClient.get<{ data: Tenant[] }>(
        `/tenants?${params.toString()}`,
      );
      return data.data;
    },
  });
}

export function useRegions() {
  return useQuery({
    queryKey: ['super-admin', 'regions'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Region[] }>('/regions?all=true');
      return data.data;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['super-admin', 'dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DashboardStats }>('/super-admin/stats');
      return data.data;
    },
  });
}

export function useModules() {
  return useQuery({
    queryKey: ['super-admin', 'modules'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PlatformModule[] }>('/modules');
      return data.data;
    },
  });
}

export function useReviewRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      reason?: string;
    }) => {
      const decision = status === 'approved' ? 'approve' : 'reject';
      const { data } = await apiClient.patch(`/tenant-requests/${id}/review`, {
        decision,
        ...(reason && { notes: reason }),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'requests'] });
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/tenant-requests/${id}`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'requests'] });
    },
  });
}

export function useToggleTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'suspended' }) => {
      const { data } = await apiClient.patch(`/tenants/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/tenants/${id}`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
    },
  });
}

export function usePurgeTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/tenants/${id}/purge`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'tenants'] });
    },
  });
}

export function useToggleRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data } = await apiClient.patch(`/regions/${id}`, { is_active });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'regions'] });
    },
  });
}

export function useCreateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<Region, 'id' | 'tenants_count' | 'pending_requests_count' | 'regional_admin'>,
    ) => {
      const { data } = await apiClient.post('/regions', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'regions'] });
    },
  });
}

export interface RegionStats {
  active_tenants: number;
  orders_today: number;
  pending_requests: number;
  revenue_month?: number;
}

export interface TenantHistoryPoint {
  month: string;
  active_tenants: number;
}

export function useRegion(slug: string) {
  return useQuery({
    queryKey: ['super-admin', 'regions', slug],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Region }>(`/regions/${slug}`);
      return data.data;
    },
  });
}

export function useRegionStats(_slug: string) {
  return useQuery({
    queryKey: ['super-admin', 'regions', _slug, 'stats'],
    queryFn: async (): Promise<RegionStats> => ({
      active_tenants: 0,
      orders_today: 0,
      pending_requests: 0,
    }),
    enabled: false,
  });
}

export function useRegionTenantsHistory(_slug: string) {
  return useQuery({
    queryKey: ['super-admin', 'regions', _slug, 'history'],
    queryFn: async (): Promise<TenantHistoryPoint[]> => [],
    enabled: false,
  });
}

export function useToggleModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data } = await apiClient.patch(`/modules/${id}`, { is_active });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'modules'] });
    },
  });
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'regional_admin';
  region_id?: string;
  region_name?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

interface AdminFilters {
  role?: string;
  region?: string;
  search?: string;
}

export function useAdmins(filters: AdminFilters = {}) {
  return useQuery({
    queryKey: ['super-admin', 'admins', filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => Boolean(v))),
      );
      const { data } = await apiClient.get<{ data: AdminUser[] }>(
        `/admins?${params.toString()}`,
      );
      return data.data;
    },
  });
}

export function useToggleAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data } = await apiClient.patch(`/admins/${id}`, { is_active });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/admins/${id}`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
    },
  });
}

export function useInviteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      first_name: string;
      last_name: string;
      role: 'super_admin' | 'regional_admin';
      region_id?: string;
    }) => {
      const { data } = await apiClient.post('/admins/invite', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'admins'] });
    },
  });
}
