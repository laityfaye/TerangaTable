'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Invitation {
  id: string;
  email: string;
  role: { id: string; name: string; slug: string };
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationPayload {
  email: string;
  roleSlug: string;
}

export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Invitation[] }>('/users/invitations');
      return data.data;
    },
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvitationPayload) => {
      const { data } = await apiClient.post<{ data: Invitation }>('/users/invitations', payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ data: { success: boolean } }>(`/users/invitations/${id}`);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}
