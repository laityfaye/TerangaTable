'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface RuleCondition {
  field: string;
  operator: string;
  value?: unknown;
}

export interface RuleAction {
  type: string;
  [key: string]: unknown;
}

export type ConditionLogic = 'AND' | 'OR';

export type EventTrigger =
  | 'order.created'
  | 'order.state_changed'
  | 'payment.received'
  | 'product.unavailable';

export interface Rule {
  id: string;
  tenantId: string;
  name: string;
  eventTrigger: EventTrigger;
  conditions: RuleCondition[];
  conditionLogic: ConditionLogic;
  actions: RuleAction[];
  isActive: boolean;
  priority: number;
  createdAt: string;
}

export interface RulesResponse {
  data: Rule[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListRulesQuery {
  event_trigger?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateRulePayload {
  name: string;
  event_trigger: EventTrigger;
  conditions: RuleCondition[];
  condition_logic: ConditionLogic;
  actions: RuleAction[];
  is_active?: boolean;
  priority?: number;
}

export type UpdateRulePayload = Partial<CreateRulePayload>;

export interface TestRulePayload {
  payload: Record<string, unknown>;
}

export interface TestRuleResult {
  matched: boolean;
  rule_name: string;
  event_trigger: string;
  condition_logic: ConditionLogic;
  conditions: Array<{
    field: string;
    operator: string;
    value?: unknown;
    result: boolean;
  }>;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const RULES_QKEY = {
  list: (q?: ListRulesQuery) => ['rules', q ?? {}] as const,
  detail: (id: string) => ['rules', 'detail', id] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────────

export function useRules(query?: ListRulesQuery) {
  return useQuery({
    queryKey: RULES_QKEY.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get<RulesResponse>('/rules', { params: query });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useRule(id: string) {
  return useQuery({
    queryKey: RULES_QKEY.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Rule>(`/rules/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRulePayload) => {
      const { data } = await apiClient.post<Rule>('/rules', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateRulePayload & { id: string }) => {
      const { data } = await apiClient.patch<Rule>(`/rules/${id}`, payload);
      return data;
    },
    onSuccess: (rule) => {
      qc.setQueryData(RULES_QKEY.detail(rule.id), rule);
      qc.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/rules/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<Rule>(`/rules/${id}/toggle`);
      return data;
    },
    onSuccess: (rule) => {
      qc.setQueryData(RULES_QKEY.detail(rule.id), rule);
      qc.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useTestRule() {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const { data } = await apiClient.post<TestRuleResult>(`/rules/${id}/test`, { payload });
      return data;
    },
  });
}
