'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface RolePermission {
  id: string;
  module: string;
  action: string;
  resource: string;
  description: string | null;
  key: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  tenantId: string | null;
  createdAt: string;
  permissions: RolePermission[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  resource: string;
  description: string | null;
}

export interface CreateRolePayload {
  name: string;
  slug: string;
  description?: string;
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Role[] }>('/roles');
      return data.data;
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Permission[] }>('/roles/permissions');
      return data.data;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRolePayload) => {
      const { data } = await apiClient.post<{ data: Role }>('/roles', payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      const { data } = await apiClient.put<{ data: Role }>(
        `/roles/${roleId}/permissions`,
        { permissionIds },
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      const { data } = await apiClient.delete<{ data: { success: boolean } }>(`/roles/${roleId}`);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
