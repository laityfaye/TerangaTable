'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkflowState {
  id: string;
  workflow_id: string;
  name: string;
  slug: string;
  color: string;
  is_initial: boolean;
  is_terminal: boolean;
  triggers_alert: boolean;
  sort_order: number;
}

export interface WorkflowTransition {
  id: string;
  workflow_id: string;
  from_state_id: string | null;
  to_state_id: string;
  name: string;
  allowed_roles: string[];
  from_state?: { id: string; name: string; color: string } | null;
  to_state?: { id: string; name: string; color: string };
}

export interface WorkflowSummary {
  id: string;
  name: string;
  entity_type: string;
  is_default: boolean;
  states_count: number;
  transitions_count: number;
  states: Pick<WorkflowState, 'id' | 'name' | 'color' | 'is_initial' | 'is_terminal' | 'sort_order'>[];
}

export interface WorkflowDetail extends Omit<WorkflowSummary, 'states_count' | 'transitions_count'> {
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

export interface CreateWorkflowPayload {
  name: string;
  entity_type: string;
  is_default?: boolean;
}

export interface UpdateWorkflowPayload {
  name?: string;
  entity_type?: string;
}

export interface CreateStatePayload {
  name: string;
  slug?: string;
  color: string;
  is_initial?: boolean;
  is_terminal?: boolean;
  triggers_alert?: boolean;
  sort_order?: number;
}

export interface UpdateStatePayload extends Partial<CreateStatePayload> {}

export interface CreateTransitionPayload {
  from_state_id?: string | null;
  to_state_id: string;
  name: string;
  allowed_roles?: string[];
}

export interface UpdateTransitionPayload extends Partial<CreateTransitionPayload> {}

// ── Query keys ────────────────────────────────────────────────────────────────

const QKEY = {
  list: ['workflows'] as const,
  detail: (id: string) => ['workflows', id] as const,
  states: (id: string) => ['workflows', id, 'states'] as const,
  transitions: (id: string) => ['workflows', id, 'transitions'] as const,
};

// ── Workflows ─────────────────────────────────────────────────────────────────

export function useWorkflows() {
  return useQuery({
    queryKey: QKEY.list,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: WorkflowSummary[] }>('/workflows');
      return data.data;
    },
    staleTime: 5 * 60_000, // workflow config rarely changes
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: QKEY.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: WorkflowDetail }>(`/workflows/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateWorkflowPayload) => {
      const { data } = await apiClient.post<WorkflowSummary>('/workflows', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.list }),
  });
}

export function useUpdateWorkflow(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateWorkflowPayload) => {
      const { data } = await apiClient.patch<WorkflowSummary>(`/workflows/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY.list });
      qc.invalidateQueries({ queryKey: QKEY.detail(id) });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/workflows/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.list }),
  });
}

export function useSetDefaultWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/workflows/${id}/set-default`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.list }),
  });
}

export function useDuplicateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<WorkflowDetail>(`/workflows/${id}/duplicate`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.list }),
  });
}

// ── States ────────────────────────────────────────────────────────────────────

export function useCreateState(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStatePayload) => {
      const { data } = await apiClient.post<WorkflowState>(`/workflows/${workflowId}/states`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.detail(workflowId) }),
  });
}

export function useUpdateState(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ stateId, payload }: { stateId: string; payload: UpdateStatePayload }) => {
      const { data } = await apiClient.patch<WorkflowState>(
        `/workflows/${workflowId}/states/${stateId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.detail(workflowId) }),
  });
}

export function useDeleteState(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stateId: string) => {
      await apiClient.delete(`/workflows/${workflowId}/states/${stateId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.detail(workflowId) }),
  });
}

// ── Transitions ───────────────────────────────────────────────────────────────

export function useCreateTransition(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTransitionPayload) => {
      const { data } = await apiClient.post<WorkflowTransition>(
        `/workflows/${workflowId}/transitions`,
        payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.detail(workflowId) }),
  });
}

export function useUpdateTransition(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tid, payload }: { tid: string; payload: UpdateTransitionPayload }) => {
      const { data } = await apiClient.patch<WorkflowTransition>(
        `/workflows/${workflowId}/transitions/${tid}`,
        payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.detail(workflowId) }),
  });
}

export function useDeleteTransition(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tid: string) => {
      await apiClient.delete(`/workflows/${workflowId}/transitions/${tid}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY.detail(workflowId) }),
  });
}
