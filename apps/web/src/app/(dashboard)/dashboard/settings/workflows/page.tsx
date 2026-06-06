'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Copy,
  Pencil,
  Trash2,
  Star,
  GitBranch,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  useWorkflows,
  useCreateWorkflow,
  useDeleteWorkflow,
  useSetDefaultWorkflow,
  useDuplicateWorkflow,
  type WorkflowSummary,
  type CreateWorkflowPayload,
} from '@/hooks/workflows/use-workflows';
import { useForm } from 'react-hook-form';

// ── Constants ─────────────────────────────────────────────────────────────────

const ENTITY_LABELS: Record<string, string> = {
  order: 'Commandes',
  reservation: 'Réservations',
};

// ── State bubbles preview ─────────────────────────────────────────────────────

function StateBubbles({
  states,
}: {
  states: WorkflowSummary['states'];
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {states.map((s, i) => (
        <span key={s.id} className="flex items-center gap-1">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: s.color }}
          >
            {s.is_initial && <span className="text-[10px]">◆</span>}
            {s.name}
            {s.is_terminal && <span className="text-[10px]">●</span>}
          </span>
          {i < states.length - 1 && (
            <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
          )}
        </span>
      ))}
    </div>
  );
}

// ── Workflow Card ─────────────────────────────────────────────────────────────

function WorkflowCard({
  workflow,
  onDelete,
  onSetDefault,
  onDuplicate,
}: {
  workflow: WorkflowSummary;
  onDelete: () => void;
  onSetDefault: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-base font-semibold text-[#1C1917] truncate">
              {workflow.name}
            </h3>
            {workflow.is_default && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Star size={10} className="fill-amber-500 text-amber-500" />
                Par défaut
              </span>
            )}
          </div>
          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {ENTITY_LABELS[workflow.entity_type] ?? workflow.entity_type}
          </span>
        </div>
      </div>

      {/* States preview */}
      <div className="min-h-[28px]">
        {workflow.states.length > 0 ? (
          <StateBubbles states={workflow.states} />
        ) : (
          <span className="text-xs text-slate-400 italic">Aucun état configuré</span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500 font-body">
        <span className="flex items-center gap-1">
          <GitBranch size={12} />
          {workflow.states_count} état{workflow.states_count !== 1 ? 's' : ''}
        </span>
        <span>{workflow.transitions_count} transition{workflow.transitions_count !== 1 ? 's' : ''}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#E7E5E4]">
        <Link
          href={`/dashboard/settings/workflows/${workflow.id}/edit`}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-terracotta text-white text-xs font-medium hover:bg-terracotta-dark transition-colors"
        >
          <Pencil size={12} />
          Modifier
        </Link>

        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-[#E7E5E4] text-xs font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
        >
          <Copy size={12} />
          Dupliquer
        </button>

        {!workflow.is_default && (
          <button
            type="button"
            onClick={onSetDefault}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-[#E7E5E4] text-xs font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
            title="Définir par défaut"
          >
            <Star size={12} />
            Par défaut
          </button>
        )}

        {!workflow.is_default && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto flex items-center gap-1.5 px-3 h-8 rounded-md border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateWorkflowModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createWorkflow = useCreateWorkflow();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateWorkflowPayload>({
    defaultValues: { name: '', entity_type: 'order', is_default: false },
  });

  const onSubmit = async (data: CreateWorkflowPayload) => {
    await createWorkflow.mutateAsync(data);
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4]">
          <h2 className="font-heading text-lg font-semibold text-[#1C1917]">Nouveau workflow</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: 'Le nom est requis' })}
              placeholder="Ex : Commandes sur place"
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Type d&apos;entité</label>
            <select
              {...register('entity_type')}
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
            >
              <option value="order">Commandes</option>
              <option value="reservation">Réservations</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-md border border-[#E7E5E4] text-sm font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createWorkflow.isPending}
              className="flex-1 h-10 rounded-md bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-60"
            >
              {createWorkflow.isPending ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: workflows = [], isLoading } = useWorkflows();
  const deleteWorkflow = useDeleteWorkflow();
  const setDefault = useSetDefaultWorkflow();
  const duplicate = useDuplicateWorkflow();

  function handleDelete(id: string) {
    if (window.confirm('Supprimer ce workflow ? Cette action est irréversible.')) {
      deleteWorkflow.mutate(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Workflows</h1>
          <p className="text-sm text-slate-500 font-body mt-0.5">
            Définissez les étapes de vie de vos commandes et réservations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-md bg-terracotta text-white text-sm font-body hover:bg-terracotta-dark transition-colors"
        >
          <Plus size={16} />
          Nouveau workflow
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E7E5E4] h-48 animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-20">
          <GitBranch size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="font-body text-slate-500">Aucun workflow configuré.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 text-sm text-terracotta hover:text-terracotta-dark font-medium"
          >
            + Créer votre premier workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onDelete={() => handleDelete(wf.id)}
              onSetDefault={() => setDefault.mutate(wf.id)}
              onDuplicate={() => duplicate.mutate(wf.id)}
            />
          ))}
        </div>
      )}

      <CreateWorkflowModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
