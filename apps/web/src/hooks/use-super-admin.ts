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
  desired_plan_id?: string;
  desired_plan_name?: string;
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
  plan: string;
  plan_id: string;
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
  phone_prefix?: string;
  tenants_count?: number;
  pending_requests_count?: number;
  regional_admin?: { id: string; email: string; first_name: string; last_name: string } | null;
}

export interface DashboardStats {
  active_tenants: number;
  pending_requests: number;
  new_this_month: number;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_products: number;
  features: Record<string, boolean>;
  is_active: boolean;
  tenants_count?: number;
}

export type PlanFormData = Omit<Plan, 'id' | 'tenants_count'>;

export interface PlatformModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  included_in_plans: string[];
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
      planId,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      reason?: string;
      planId?: string;
    }) => {
      const decision = status === 'approved' ? 'approve' : 'reject';
      const { data } = await apiClient.patch(`/tenant-requests/${id}/review`, {
        decision,
        ...(reason && { notes: reason }),
        ...(planId && { planId }),
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

export function useUpdateTenantPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      const { data } = await apiClient.patch(`/tenants/${id}/plan`, { planId });
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

export function useRegionStats(slug: string) {
  return useQuery({
    queryKey: ['super-admin', 'regions', slug, 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: RegionStats }>(`/regions/${slug}/stats`);
      return data.data;
    },
    enabled: Boolean(slug),
  });
}

export function useRegionTenantsHistory(slug: string) {
  return useQuery({
    queryKey: ['super-admin', 'regions', slug, 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: TenantHistoryPoint[] }>(
        `/regions/${slug}/tenants-history`,
      );
      return data.data;
    },
    enabled: Boolean(slug),
  });
}

export interface ModerationReview {
  id: string;
  order_id: string;
  order_number: string | null;
  customer: { first_name: string; last_name: string | null } | null;
  rating: number;
  comment: string | null;
  status: 'published' | 'flagged' | 'hidden';
  response: string | null;
  report_count: number;
  created_at: string;
  tenant: { name: string; slug: string };
}

export function useReviewModerationQueue() {
  return useQuery({
    queryKey: ['super-admin', 'reviews', 'moderation'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ModerationReview[] }>('/reviews/moderation');
      return data.data;
    },
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'published' | 'hidden' }) => {
      const { data } = await apiClient.patch(`/reviews/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'reviews', 'moderation'] });
    },
  });
}

export interface PublicPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_products: number;
  features: Record<string, boolean>;
}

// Public — consommé par la landing page (section tarifs). Pas d'auth requise.
export function usePublicPlans() {
  return useQuery({
    queryKey: ['plans', 'public'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PublicPlan[] }>('/plans/public');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['super-admin', 'plans'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Plan[] }>('/plans');
      return data.data;
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlanFormData) => {
      const { data } = await apiClient.post('/plans', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PlanFormData> & { id: string }) => {
      const { data } = await apiClient.patch(`/plans/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'plans'] });
    },
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

export function useAssignAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ regionId, userId }: { regionId: string; userId: string | null }) => {
      const { data } = await apiClient.patch(`/regions/${regionId}/assign-admin`, { userId });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'regions'] });
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
