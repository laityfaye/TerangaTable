'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Check, Loader2, Settings2 } from 'lucide-react';
import {
  useCustomFields,
  useCustomFieldValues,
  useUpsertCustomFieldValue,
  type CustomField,
  type CustomFieldType,
  type CustomFieldWithValue,
} from '@/hooks/custom-fields/use-custom-fields';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DynamicFormProps {
  entityType: string;
  entityId: string | undefined;
  onSave?: () => void;
  readOnly?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface FieldState {
  value: string | number | boolean | null;
  status: SaveStatus;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitialValue(
  field: CustomField,
  savedValues: CustomFieldWithValue[],
): string | number | boolean | null {
  const saved = savedValues.find((v) => v.custom_field_id === field.id);
  if (saved !== undefined) return saved.value;
  if (field.field_type === 'boolean') return false;
  return null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return <Loader2 size={11} className="animate-spin text-terracotta flex-shrink-0" />;
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-green-600 whitespace-nowrap">
        <Check size={11} /> Enregistré
      </span>
    );
  }
  if (status === 'error') {
    return <span className="text-[10px] text-red-500">Erreur</span>;
  }
  return null;
}

function SwitchInput({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1 disabled:opacity-50 ${
        checked ? 'bg-terracotta' : 'bg-slate-200'
      }`}
    >
      <span
        className={`mt-0.5 inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function FieldInput({
  field,
  value,
  readOnly,
  onChange,
}: {
  field: CustomField;
  value: string | number | boolean | null;
  readOnly: boolean;
  onChange: (v: string | number | boolean | null) => void;
}) {
  const base =
    'w-full px-3 h-9 rounded-lg border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-400';

  switch (field.field_type as CustomFieldType) {
    case 'string':
      return (
        <input
          type="text"
          disabled={readOnly}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );

    case 'text':
      return (
        <textarea
          disabled={readOnly}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors resize-none disabled:bg-slate-50 disabled:text-slate-400"
        />
      );

    case 'number':
      return (
        <input
          type="number"
          disabled={readOnly}
          value={(value as number) ?? ''}
          onChange={(e) =>
            onChange(e.target.value === '' ? null : Number(e.target.value))
          }
          className={base}
        />
      );

    case 'boolean':
      return (
        <SwitchInput
          checked={Boolean(value)}
          onChange={onChange}
          disabled={readOnly}
          label={field.label}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          disabled={readOnly}
          value={value ? String(value).slice(0, 10) : ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={base}
        />
      );

    case 'select': {
      const opts = Array.isArray(field.options) ? (field.options as string[]) : [];
      return (
        <select
          disabled={readOnly}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={base}
        >
          <option value="">— Sélectionner —</option>
          {opts.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    default:
      return (
        <input
          type="text"
          disabled={readOnly}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DynamicForm({
  entityType,
  entityId,
  onSave,
  readOnly = false,
}: DynamicFormProps) {
  const { data: fields = [], isLoading: loadingFields } = useCustomFields(entityType);
  const { data: savedValues = [], isLoading: loadingValues } = useCustomFieldValues(
    entityType,
    entityId,
  );
  const upsert = useUpsertCustomFieldValue();

  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (fields.length === 0) return;
    setFieldStates((prev) => {
      const next: Record<string, FieldState> = {};
      for (const f of fields) {
        next[f.id] = prev[f.id] ?? {
          value: getInitialValue(f, savedValues),
          status: 'idle',
        };
      }
      return next;
    });
  }, [fields, savedValues]);

  const saveField = useCallback(
    async (field: CustomField, value: string | number | boolean | null) => {
      if (!entityId) return;
      setFieldStates((prev) => ({
        ...prev,
        [field.id]: { ...prev[field.id], status: 'saving' },
      }));
      try {
        await upsert.mutateAsync({
          custom_field_id: field.id,
          entity_id: entityId,
          entity_type: entityType,
          value,
        });
        setFieldStates((prev) => ({
          ...prev,
          [field.id]: { ...prev[field.id], status: 'saved' },
        }));
        onSave?.();
        setTimeout(() => {
          setFieldStates((prev) => ({
            ...prev,
            [field.id]: { ...prev[field.id], status: 'idle' },
          }));
        }, 2000);
      } catch {
        setFieldStates((prev) => ({
          ...prev,
          [field.id]: { ...prev[field.id], status: 'error' },
        }));
      }
    },
    [entityId, entityType, upsert, onSave],
  );

  const handleChange = useCallback(
    (field: CustomField, value: string | number | boolean | null) => {
      if (readOnly) return;
      setFieldStates((prev) => ({
        ...prev,
        [field.id]: { value, status: 'idle' },
      }));
      if (timersRef.current[field.id]) clearTimeout(timersRef.current[field.id]);
      timersRef.current[field.id] = setTimeout(() => {
        saveField(field, value);
      }, 800);
    },
    [readOnly, saveField],
  );

  if (!entityId) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400">
        <Settings2 size={24} className="mb-2 opacity-40" />
        <p className="text-sm text-center">
          Enregistrez d&apos;abord pour accéder aux champs personnalisés.
        </p>
      </div>
    );
  }

  if (loadingFields || loadingValues) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400">
        <Settings2 size={24} className="mb-2 opacity-40" />
        <p className="text-sm">Aucun champ personnalisé configuré.</p>
        <p className="text-xs mt-1">
          <a
            href="/dashboard/settings/custom-fields"
            className="text-terracotta hover:underline"
          >
            Configurer dans Paramètres →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const state = fieldStates[field.id] ?? { value: null, status: 'idle' as SaveStatus };
        return (
          <div key={field.id}>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-xs font-medium text-slate-600">
                {field.label}
                {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <StatusIndicator status={state.status} />
            </div>
            <FieldInput
              field={field}
              value={state.value}
              readOnly={readOnly}
              onChange={(v) => handleChange(field, v)}
            />
          </div>
        );
      })}
    </div>
  );
}
