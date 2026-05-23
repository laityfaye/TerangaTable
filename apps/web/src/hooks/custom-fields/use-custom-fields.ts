'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export type CustomFieldType = 'string' | 'number' | 'boolean' | 'date' | 'select' | 'text';

export interface CustomField {
  id: string;
  entity_type: string;
  name: string;
  label: string;
  field_type: CustomFieldType;
  options: string[] | null;
  is_required: boolean;
  is_shown_on_vitrine: boolean;
  sort_order: number;
}

export interface CustomFieldWithValue {
  id: string;
  custom_field_id: string;
  label: string;
  type: CustomFieldType;
  options: string[] | null;
  is_required: boolean;
  is_shown_on_vitrine: boolean;
  value: string | number | boolean | null;
}

export interface CustomFieldPayload {
  entity_type: string;
  label: string;
  name?: string;
  field_type: CustomFieldType;
  options?: string[];
  is_required?: boolean;
  is_shown_on_vitrine?: boolean;
  sort_order?: number;
}

export interface UpsertValuePayload {
  custom_field_id: string;
  entity_id: string;
  entity_type: string;
  value: string | number | boolean | null;
}

const QKEY = ['custom-fields'] as const;
const VALUES_QKEY = ['custom-field-values'] as const;

export function useCustomFields(entityType?: string) {
  return useQuery({
    queryKey: [...QKEY, entityType],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: CustomField[] }>('/custom-fields', {
        params: entityType ? { entity_type: entityType } : {},
      });
      return data.data;
    },
  });
}

export function useCustomFieldValues(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: [...VALUES_QKEY, entityType, entityId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: CustomFieldWithValue[] }>(
        `/custom-fields/values/${entityType}/${entityId}`,
      );
      return data.data;
    },
    enabled: !!entityId,
  });
}

export function useCreateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CustomFieldPayload) => {
      const { data } = await apiClient.post<{ data: CustomField }>('/custom-fields', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useUpdateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CustomFieldPayload> }) => {
      const { data } = await apiClient.patch<{ data: CustomField }>(`/custom-fields/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useDeleteCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/custom-fields/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useReorderCustomFields() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ id: string; sort_order: number }>) => {
      await apiClient.patch('/custom-fields/reorder', { items });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QKEY }),
  });
}

export function useUpsertCustomFieldValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertValuePayload) => {
      const { data } = await apiClient.post('/custom-fields/values', payload);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...VALUES_QKEY, vars.entity_type, vars.entity_id] });
    },
  });
}
