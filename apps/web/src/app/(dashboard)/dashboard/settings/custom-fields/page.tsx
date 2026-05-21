'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Settings2,
} from 'lucide-react';
import {
  useCustomFields,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
  useReorderCustomFields,
  type CustomField,
  type CustomFieldType,
  type CustomFieldPayload,
} from '@/hooks/custom-fields/use-custom-fields';

// ── Constants ─────────────────────────────────────────────────────────────────

type EntityType = 'product' | 'order' | 'customer';

const ENTITY_TABS: { key: EntityType; label: string }[] = [
  { key: 'product', label: 'Produits' },
  { key: 'order', label: 'Commandes' },
  { key: 'customer', label: 'Clients' },
];

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: 'string', label: 'Texte court' },
  { value: 'text', label: 'Texte long' },
  { value: 'number', label: 'Nombre' },
  { value: 'boolean', label: 'Oui/Non' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste déroulante' },
];

const FIELD_TYPE_COLORS: Record<CustomFieldType, string> = {
  string: 'bg-blue-50 text-blue-700',
  text: 'bg-violet-50 text-violet-700',
  number: 'bg-amber-50 text-amber-700',
  boolean: 'bg-green-50 text-green-700',
  date: 'bg-rose-50 text-rose-700',
  select: 'bg-orange-50 text-orange-700',
};

function toSnakeCase(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ── Switch ────────────────────────────────────────────────────────────────────

function SwitchToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1 ${
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

// ── Field Modal ───────────────────────────────────────────────────────────────

function FieldModal({
  entityType,
  field,
  onClose,
}: {
  entityType: EntityType;
  field?: CustomField;
  onClose: () => void;
}) {
  const isEdit = !!field;
  const create = useCreateCustomField();
  const update = useUpdateCustomField();
  const isPending = create.isPending || update.isPending;

  const [label, setLabel] = useState(field?.label ?? '');
  const [name, setName] = useState(field?.name ?? '');
  const [fieldType, setFieldType] = useState<CustomFieldType>(field?.field_type ?? 'string');
  const [options, setOptions] = useState<string[]>(
    Array.isArray(field?.options) ? (field.options as string[]) : [''],
  );
  const [isRequired, setIsRequired] = useState(field?.is_required ?? false);
  const [isShownOnVitrine, setIsShownOnVitrine] = useState(field?.is_shown_on_vitrine ?? false);
  const [nameManuallyEdited, setNameManuallyEdited] = useState(isEdit);

  useEffect(() => {
    if (!nameManuallyEdited && !isEdit) {
      setName(toSnakeCase(label));
    }
  }, [label, nameManuallyEdited, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CustomFieldPayload = {
      entity_type: entityType,
      label,
      name,
      field_type: fieldType,
      ...(fieldType === 'select' && { options: options.filter(Boolean) }),
      is_required: isRequired,
      is_shown_on_vitrine: isShownOnVitrine,
    };
    if (isEdit) {
      update.mutate({ id: field.id, payload }, { onSuccess: onClose });
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  const error = create.error || update.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4] sticky top-0 bg-white z-10">
          <h2 className="font-heading font-bold text-[#1C1917] text-lg">
            {isEdit ? 'Modifier le champ' : 'Nouveau champ'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#1C1917] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Label affiché <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex : Numéro de lot"
              className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nom technique{' '}
              <span className="text-slate-400 font-normal">(snake_case)</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => {
                setNameManuallyEdited(true);
                setName(e.target.value);
              }}
              placeholder="numero_lot"
              className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm font-mono outline-none transition-colors"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
                className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none transition-colors bg-white"
              >
                {FIELD_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {fieldType === 'select' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Options</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={(e) =>
                        setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                      }
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 h-8 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none transition-colors"
                    />
                    {options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOptions((prev) => [...prev, ''])}
                  className="flex items-center gap-1.5 text-xs text-terracotta hover:text-terracotta-dark transition-colors"
                >
                  <Plus size={13} /> Ajouter une option
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1C1917]">Obligatoire</p>
              <p className="text-xs text-slate-400">Le champ doit être rempli</p>
            </div>
            <SwitchToggle checked={isRequired} onChange={setIsRequired} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1C1917]">Visible sur la vitrine</p>
              <p className="text-xs text-slate-400">Affiché sur le site public</p>
            </div>
            <SwitchToggle checked={isShownOnVitrine} onChange={setIsShownOnVitrine} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {(error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? 'Une erreur est survenue'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-[#E7E5E4] text-sm font-medium text-slate-600 hover:bg-[#F5F4F2] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sortable Row ──────────────────────────────────────────────────────────────

function SortableFieldRow({
  field,
  onEdit,
  onDelete,
}: {
  field: CustomField;
  onEdit: (f: CustomField) => void;
  onDelete: (f: CustomField) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const updateField = useUpdateCustomField();
  const typeLabel =
    FIELD_TYPE_OPTIONS.find((t) => t.value === field.field_type)?.label ?? field.field_type;
  const typeColor = FIELD_TYPE_COLORS[field.field_type] ?? 'bg-slate-50 text-slate-600';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E7E5E4] rounded-lg hover:border-slate-300 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#1C1917]">{field.label}</span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeColor}`}>
            {typeLabel}
          </span>
          {field.is_required && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
              Obligatoire
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{field.name}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-slate-400">Vitrine</span>
        <SwitchToggle
          checked={field.is_shown_on_vitrine}
          onChange={(v) =>
            updateField.mutate({ id: field.id, payload: { is_shown_on_vitrine: v } })
          }
        />
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(field)}
          className="p-1.5 rounded-md text-slate-400 hover:text-[#1C1917] hover:bg-slate-100 transition-colors"
          title="Modifier"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(field)}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Fields Panel ──────────────────────────────────────────────────────────────

function FieldsPanel({ entityType }: { entityType: EntityType }) {
  const { data: fields = [], isLoading } = useCustomFields(entityType);
  const reorder = useReorderCustomFields();
  const deleteField = useDeleteCustomField();

  const [localFields, setLocalFields] = useState<CustomField[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editField, setEditField] = useState<CustomField | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomField | null>(null);

  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localFields.findIndex((f) => f.id === active.id);
    const newIndex = localFields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(localFields, oldIndex, newIndex);
    setLocalFields(reordered);
    reorder.mutate(reordered.map((f, i) => ({ id: f.id, sort_order: i })));
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {localFields.length} champ{localFields.length !== 1 ? 's' : ''} configuré
          {localFields.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors"
        >
          <Plus size={15} />
          Nouveau champ
        </button>
      </div>

      {localFields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-[#E7E5E4] rounded-lg">
          <Settings2 size={28} className="mb-2 opacity-40" />
          <p className="text-sm font-medium">Aucun champ configuré</p>
          <p className="text-xs mt-1">Créez votre premier champ personnalisé.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-2 px-4 h-9 rounded-lg bg-terracotta text-white text-sm hover:bg-terracotta-dark transition-colors"
          >
            <Plus size={15} /> Nouveau champ
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localFields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localFields.map((field) => (
                <SortableFieldRow
                  key={field.id}
                  field={field}
                  onEdit={setEditField}
                  onDelete={setConfirmDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showModal && <FieldModal entityType={entityType} onClose={() => setShowModal(false)} />}
      {editField && (
        <FieldModal entityType={entityType} field={editField} onClose={() => setEditField(null)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-heading font-bold text-[#1C1917] text-lg">Supprimer ce champ ?</h2>
            <p className="text-sm text-slate-600">
              Le champ{' '}
              <span className="font-medium">&quot;{confirmDelete.label}&quot;</span> et toutes ses
              valeurs seront supprimés définitivement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-9 rounded-lg border border-[#E7E5E4] text-sm font-medium text-slate-600 hover:bg-[#F5F4F2] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  deleteField.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
                }
                disabled={deleteField.isPending}
                className="flex-1 h-9 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleteField.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomFieldsSettingsPage() {
  const [activeTab, setActiveTab] = useState<EntityType>('product');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Champs personnalisés</h1>
        <p className="mt-1 text-sm text-slate-500 font-body">
          Ajoutez des champs supplémentaires à vos produits, commandes et clients.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#E7E5E4]">
          {ENTITY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <FieldsPanel key={activeTab} entityType={activeTab} />
        </div>
      </div>
    </div>
  );
}
