'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus,
  Save,
  ArrowLeft,
  GripVertical,
  X,
  ChevronRight,
  Bell,
  CircleDot,
  Diamond,
  Loader2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm } from 'react-hook-form';
import {
  useWorkflow,
  useUpdateWorkflow,
  useCreateState,
  useUpdateState,
  useDeleteState,
  useCreateTransition,
  useUpdateTransition,
  useDeleteTransition,
  type WorkflowState,
  type WorkflowTransition,
  type CreateStatePayload,
  type CreateTransitionPayload,
} from '@/hooks/workflows/use-workflows';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#10B981', // green
  '#EF4444', // red
  '#8B5CF6', // violet
  '#F97316', // orange
  '#6B7280', // gray
  '#EC4899', // pink
];

const ALLOWED_ROLES = [
  { value: 'owner', label: 'Propriétaire' },
  { value: 'manager', label: 'Manager' },
  { value: 'server', label: 'Serveur' },
  { value: 'cashier', label: 'Caissier' },
  { value: 'kitchen_staff', label: 'Cuisine' },
];

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

// ── Color Picker ──────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
            value === c ? 'border-slate-700 scale-110' : 'border-transparent'
          }`}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded-full cursor-pointer border border-slate-200"
        title="Couleur personnalisée"
      />
    </div>
  );
}

// ── Sortable State Row ────────────────────────────────────────────────────────

function SortableStateRow({
  state,
  isSelected,
  onClick,
}: {
  state: WorkflowState;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: state.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
        isSelected ? 'bg-terracotta/10 border border-terracotta/20' : 'hover:bg-slate-100 border border-transparent'
      }`}
    >
      <span {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
        <GripVertical size={14} />
      </span>

      <span
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: state.color }}
      />

      <span className="flex-1 text-sm font-medium text-[#1C1917] truncate">{state.name}</span>

      <span className="flex items-center gap-1 text-slate-400">
        {state.is_initial && <Diamond size={11} className="text-amber-500" aria-label="Initial" />}
        {state.is_terminal && <CircleDot size={11} className="text-slate-500" aria-label="Terminal" />}
        {state.triggers_alert && <Bell size={11} className="text-red-400" aria-label="Alerte" />}
      </span>

      <ChevronRight size={13} className={`text-slate-300 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
    </div>
  );
}

// ── State Form ────────────────────────────────────────────────────────────────

interface StateFormData {
  name: string;
  slug: string;
  color: string;
  is_initial: boolean;
  is_terminal: boolean;
  triggers_alert: boolean;
  sort_order: number;
}

function StateForm({
  state,
  workflowId,
  onClose,
}: {
  state: WorkflowState | null;
  workflowId: string;
  onClose: () => void;
}) {
  const createState = useCreateState(workflowId);
  const updateState = useUpdateState(workflowId);

  const { register, handleSubmit, watch, setValue, reset } = useForm<StateFormData>({
    defaultValues: state
      ? {
          name: state.name,
          slug: state.slug,
          color: state.color,
          is_initial: state.is_initial,
          is_terminal: state.is_terminal,
          triggers_alert: state.triggers_alert,
          sort_order: state.sort_order,
        }
      : { name: '', slug: '', color: '#3B82F6', is_initial: false, is_terminal: false, triggers_alert: false, sort_order: 0 },
  });

  const name = watch('name');
  const color = watch('color');

  useEffect(() => {
    if (!state) {
      setValue('slug', toSlug(name));
    }
  }, [name, state, setValue]);

  useEffect(() => {
    reset(
      state
        ? {
            name: state.name,
            slug: state.slug,
            color: state.color,
            is_initial: state.is_initial,
            is_terminal: state.is_terminal,
            triggers_alert: state.triggers_alert,
            sort_order: state.sort_order,
          }
        : { name: '', slug: '', color: '#3B82F6', is_initial: false, is_terminal: false, triggers_alert: false, sort_order: 0 },
    );
  }, [state, reset]);

  const onSubmit = async (data: StateFormData) => {
    const payload: CreateStatePayload = {
      name: data.name,
      slug: data.slug || toSlug(data.name),
      color: data.color,
      is_initial: data.is_initial,
      is_terminal: data.is_terminal,
      triggers_alert: data.triggers_alert,
      sort_order: data.sort_order,
    };

    if (state) {
      await updateState.mutateAsync({ stateId: state.id, payload });
    } else {
      await createState.mutateAsync(payload);
      onClose();
    }
  };

  const isPending = createState.isPending || updateState.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold text-[#1C1917]">
          {state ? 'Modifier l\'état' : 'Nouvel état'}
        </h3>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100 transition-colors">
          <X size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-[#E7E5E4]">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {watch('name') || 'Aperçu'}
        </span>
        <span className="text-xs text-slate-400">Apparence dans le kanban</span>
      </div>

      {/* Nom */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name', { required: true })}
          placeholder="Ex : En cuisine"
          className="w-full h-9 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Slug</label>
        <input
          {...register('slug')}
          placeholder="in_kitchen"
          className="w-full h-9 px-3 rounded-md border border-[#E7E5E4] text-sm text-slate-500 font-mono placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
        />
      </div>

      {/* Couleur */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Couleur</label>
        <ColorPicker value={color} onChange={(c) => setValue('color', c)} />
      </div>

      {/* Flags */}
      <div className="space-y-2">
        {[
          { field: 'is_initial' as const, label: 'État initial', icon: <Diamond size={13} className="text-amber-500" />, help: 'Point d\'entrée du workflow' },
          { field: 'is_terminal' as const, label: 'État terminal', icon: <CircleDot size={13} className="text-slate-500" />, help: 'Fin du workflow (archivage)' },
          { field: 'triggers_alert' as const, label: 'Déclenche une alerte', icon: <Bell size={13} className="text-red-400" />, help: 'Notifie le manager' },
        ].map(({ field, label, icon, help }) => (
          <label key={field} className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              {...register(field)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-terracotta focus:ring-terracotta/30"
            />
            <span className="flex items-center gap-1.5 text-sm text-[#1C1917]">
              {icon}
              {label}
              <span className="text-xs text-slate-400">— {help}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Sort order */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Ordre d&apos;affichage</label>
        <input
          type="number"
          {...register('sort_order', { valueAsNumber: true })}
          min={0}
          className="w-24 h-9 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
        />
      </div>

      <div className="flex gap-2 pt-2 border-t border-[#E7E5E4]">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-9 rounded-md border border-[#E7E5E4] text-sm font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
        >
          {state ? 'Fermer' : 'Annuler'}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-9 rounded-md bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {state ? 'Sauvegarder' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}

// ── Transition Form ───────────────────────────────────────────────────────────

interface TransitionFormData {
  from_state_id: string;
  to_state_id: string;
  name: string;
  allowed_roles: string[];
}

function TransitionForm({
  transition,
  states,
  workflowId,
  onClose,
}: {
  transition: WorkflowTransition | null;
  states: WorkflowState[];
  workflowId: string;
  onClose: () => void;
}) {
  const createTransition = useCreateTransition(workflowId);
  const updateTransition = useUpdateTransition(workflowId);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    transition?.allowed_roles ?? [],
  );

  const { register, handleSubmit, reset } = useForm<TransitionFormData>({
    defaultValues: {
      from_state_id: transition?.from_state_id ?? '',
      to_state_id: transition?.to_state_id ?? '',
      name: transition?.name ?? '',
      allowed_roles: transition?.allowed_roles ?? [],
    },
  });

  useEffect(() => {
    reset({
      from_state_id: transition?.from_state_id ?? '',
      to_state_id: transition?.to_state_id ?? '',
      name: transition?.name ?? '',
      allowed_roles: transition?.allowed_roles ?? [],
    });
    setSelectedRoles(transition?.allowed_roles ?? []);
  }, [transition, reset]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const onSubmit = async (data: TransitionFormData) => {
    const payload: CreateTransitionPayload = {
      from_state_id: data.from_state_id || null,
      to_state_id: data.to_state_id,
      name: data.name,
      allowed_roles: selectedRoles,
    };

    if (transition) {
      await updateTransition.mutateAsync({ tid: transition.id, payload });
    } else {
      await createTransition.mutateAsync(payload);
      onClose();
    }
  };

  const isPending = createTransition.isPending || updateTransition.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold text-[#1C1917]">
          {transition ? 'Modifier la transition' : 'Nouvelle transition'}
        </h3>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100 transition-colors">
          <X size={16} className="text-slate-400" />
        </button>
      </div>

      {/* État source */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          État source
          <span className="ml-1 text-slate-400">(vide = depuis n&apos;importe où)</span>
        </label>
        <select
          {...register('from_state_id')}
          className="w-full h-9 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
        >
          <option value="">— Depuis n&apos;importe quel état</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* État destination */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          État destination <span className="text-red-500">*</span>
        </label>
        <select
          {...register('to_state_id', { required: true })}
          className="w-full h-9 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
        >
          <option value="">— Choisir un état</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Libellé */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Libellé du bouton <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name', { required: true })}
          placeholder="Ex : Marquer prête"
          className="w-full h-9 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
        />
      </div>

      {/* Rôles */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">
          Rôles autorisés
          <span className="ml-1 text-slate-400">(vide = tous les rôles)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ALLOWED_ROLES.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => toggleRole(role.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedRoles.includes(role.value)
                  ? 'bg-terracotta text-white border-terracotta'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-terracotta/40'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-[#E7E5E4]">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-9 rounded-md border border-[#E7E5E4] text-sm font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
        >
          {transition ? 'Fermer' : 'Annuler'}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-9 rounded-md bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {transition ? 'Sauvegarder' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}

// ── Transition Row ────────────────────────────────────────────────────────────

function TransitionRow({
  transition,
  isSelected,
  onClick,
}: {
  transition: WorkflowTransition;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group text-sm ${
        isSelected ? 'bg-terracotta/10 border border-terracotta/20' : 'hover:bg-slate-100 border border-transparent'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
            style={{ backgroundColor: transition.from_state?.color ?? '#94A3B8' }}
          >
            {transition.from_state?.name ?? 'Tout état'}
          </span>
          <ChevronRight size={11} className="text-slate-400 flex-shrink-0" />
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
            style={{ backgroundColor: transition.to_state?.color ?? '#94A3B8' }}
          >
            {transition.to_state?.name}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium truncate">&ldquo;{transition.name}&rdquo;</p>
        {transition.allowed_roles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {transition.allowed_roles.map((r) => (
              <span key={r} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                {ALLOWED_ROLES.find((ar) => ar.value === r)?.label ?? r}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight size={13} className={`text-slate-300 mt-0.5 flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Selection =
  | { type: 'state'; id: string }
  | { type: 'transition'; id: string }
  | { type: 'new-state' }
  | { type: 'new-transition' }
  | null;

export default function WorkflowEditPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const { data: workflow, isLoading } = useWorkflow(workflowId);
  const updateWorkflow = useUpdateWorkflow(workflowId);
  const updateState = useUpdateState(workflowId);
  const deleteState = useDeleteState(workflowId);
  const deleteTransition = useDeleteTransition(workflowId);

  const [selection, setSelection] = useState<Selection>(null);
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState('');
  const [localStates, setLocalStates] = useState<WorkflowState[]>([]);

  useEffect(() => {
    if (workflow) {
      setLocalName(workflow.name);
      setLocalStates([...workflow.states].sort((a, b) => a.sort_order - b.sort_order));
    }
  }, [workflow]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setLocalStates((prev) => {
        const oldIdx = prev.findIndex((s) => s.id === active.id);
        const newIdx = prev.findIndex((s) => s.id === over.id);
        const reordered = arrayMove(prev, oldIdx, newIdx);

        // Persist new sort_order for each moved state
        reordered.forEach((s, i) => {
          if (s.sort_order !== i) {
            updateState.mutate({ stateId: s.id, payload: { sort_order: i } });
          }
        });

        return reordered;
      });
    },
    [updateState],
  );

  const saveName = async () => {
    if (localName.trim() && localName !== workflow?.name) {
      await updateWorkflow.mutateAsync({ name: localName.trim() });
    }
    setEditingName(false);
  };

  const selectedState =
    selection?.type === 'state'
      ? workflow?.states.find((s) => s.id === selection.id) ?? null
      : null;

  const selectedTransition =
    selection?.type === 'transition'
      ? workflow?.transitions.find((t) => t.id === selection.id) ?? null
      : null;

  const handleDeleteState = (stateId: string) => {
    if (window.confirm('Supprimer cet état ?')) {
      deleteState.mutate(stateId);
      if (selection?.type === 'state' && selection.id === stateId) setSelection(null);
    }
  };

  const handleDeleteTransition = (tid: string) => {
    if (window.confirm('Supprimer cette transition ?')) {
      deleteTransition.mutate(tid);
      if (selection?.type === 'transition' && selection.id === tid) setSelection(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-terracotta" />
      </div>
    );
  }

  if (!workflow) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ── Bandeau haut ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#E7E5E4] gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings/workflows')}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-slate-500" />
          </button>

          {editingName ? (
            <input
              autoFocus
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') { setLocalName(workflow.name); setEditingName(false); }
              }}
              className="font-heading text-lg font-semibold text-[#1C1917] border-b-2 border-terracotta bg-transparent outline-none min-w-0 max-w-xs"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="font-heading text-lg font-semibold text-[#1C1917] hover:text-terracotta transition-colors truncate text-left"
              title="Cliquer pour modifier le nom"
            >
              {workflow.name}
            </button>
          )}

          {updateWorkflow.isPending && <Loader2 size={14} className="animate-spin text-terracotta flex-shrink-0" />}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {localStates.length} états · {workflow.transitions.length} transitions
          </span>
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings/workflows')}
            className="flex items-center gap-1.5 px-4 h-9 rounded-md bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors"
          >
            <Save size={14} />
            Terminer
          </button>
        </div>
      </div>

      {/* ── Corps 2 panneaux ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panneau gauche */}
        <div className="w-72 flex-shrink-0 bg-slate-50 border-r border-[#E7E5E4] flex flex-col overflow-y-auto">
          {/* États */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">États</span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localStates.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {localStates.map((state) => (
                    <div key={state.id} className="group/row relative">
                      <SortableStateRow
                        state={state}
                        isSelected={selection?.type === 'state' && selection.id === state.id}
                        onClick={() => setSelection({ type: 'state', id: state.id })}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteState(state.id); }}
                        className="absolute right-7 top-1/2 -translate-y-1/2 p-1 rounded text-slate-300 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-all"
                        title="Supprimer l'état"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              type="button"
              onClick={() => setSelection({ type: 'new-state' })}
              className="mt-2 w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-terracotta hover:bg-terracotta/5 border border-dashed border-terracotta/30 hover:border-terracotta/60 transition-colors"
            >
              <Plus size={13} /> Ajouter un état
            </button>
          </div>

          <div className="mx-3 border-t border-[#E7E5E4]" />

          {/* Transitions */}
          <div className="p-3 flex-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Transitions</span>
            </div>

            <div className="space-y-0.5">
              {workflow.transitions.map((t) => (
                <div key={t.id} className="group/row relative">
                  <TransitionRow
                    transition={t}
                    isSelected={selection?.type === 'transition' && selection.id === t.id}
                    onClick={() => setSelection({ type: 'transition', id: t.id })}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteTransition(t.id); }}
                    className="absolute right-7 top-3 p-1 rounded text-slate-300 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-all"
                    title="Supprimer la transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelection({ type: 'new-transition' })}
              className="mt-2 w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-terracotta hover:bg-terracotta/5 border border-dashed border-terracotta/30 hover:border-terracotta/60 transition-colors"
            >
              <Plus size={13} /> Ajouter une transition
            </button>
          </div>
        </div>

        {/* Panneau droit */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selection && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-slate-400">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <ChevronRight size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-body">
                Sélectionnez un état ou une transition<br />dans le panneau gauche pour le configurer.
              </p>
            </div>
          )}

          {(selection?.type === 'state' || selection?.type === 'new-state') && (
            <div className="max-w-sm">
              <StateForm
                key={selection.type === 'state' ? selection.id : 'new'}
                state={selectedState}
                workflowId={workflowId}
                onClose={() => setSelection(null)}
              />
            </div>
          )}

          {(selection?.type === 'transition' || selection?.type === 'new-transition') && (
            <div className="max-w-sm">
              <TransitionForm
                key={selection.type === 'transition' ? selection.id : 'new'}
                transition={selectedTransition}
                states={workflow.states}
                workflowId={workflowId}
                onClose={() => setSelection(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
