'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/menu/use-categories';
import {
  useCreateProduct,
  useUpdateProduct,
  type Product,
  type ProductPayload,
} from '@/hooks/menu/use-products';
import { useUpload } from '@/hooks/menu/use-upload';
import { DynamicForm } from '@/components/custom-fields/dynamic-form';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLERGENS = [
  'Gluten',
  'Lait',
  'Œufs',
  'Arachides',
  'Soja',
  'Fruits à coque',
  'Poisson',
  'Crustacés',
  'Sésame',
  'Moutarde',
  'Céleri',
  'Lupin',
  'Mollusques',
  'Sulfites',
];

// ── Validation schema ─────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'La catégorie est requise'),
  base_price: z.coerce.number().min(0, 'Le prix doit être positif'),
  sku: z.string().optional(),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  calories: z.coerce.number().optional(),
  proteins: z.coerce.number().optional(),
  carbs: z.coerce.number().optional(),
  fats: z.coerce.number().optional(),
  serving_size: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface OptionItem {
  _key: string;
  id?: string;
  name: string;
  price_delta: number;
  is_default: boolean;
}

interface OptionGroup {
  _key: string;
  id?: string;
  name: string;
  type: 'single' | 'multiple';
  is_required: boolean;
  min_select: number;
  max_select: number;
  options: OptionItem[];
  expanded: boolean;
}

// ── Switch ────────────────────────────────────────────────────────────────────

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
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

// ── Image Upload Zone ─────────────────────────────────────────────────────────

function ImageUploadZone({
  value,
  onChange,
  uploading,
  progress,
}: {
  value: string | null;
  onChange: (file: File) => void;
  uploading: boolean;
  progress: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    if (file.type.startsWith('image/')) onChange(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-colors ${
        isDragging
          ? 'border-terracotta bg-terracotta-50'
          : 'border-slate-200 hover:border-terracotta hover:bg-terracotta/5'
      } ${uploading ? 'pointer-events-none' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value ? (
        <div className="relative aspect-video">
          <img src={value} alt="Aperçu" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="text-white animate-spin" />
              <span className="text-white text-sm font-medium">{progress}%</span>
            </div>
          )}
          {!uploading && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
              <span className="text-white text-sm font-medium px-3 py-1.5 rounded-md bg-black/40">
                Changer
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
          <ImageIcon size={28} />
          <p className="text-sm font-medium">Glissez une photo ou cliquez</p>
          <p className="text-xs text-slate-300">PNG, JPG, WebP — max 5 Mo</p>
        </div>
      )}
    </div>
  );
}

// ── Tag Input ─────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInput('');
  };

  return (
    <div className="flex flex-wrap gap-2 p-2.5 rounded-md border border-[#E7E5E4] min-h-[42px] focus-within:ring-2 focus-within:ring-terracotta/20 focus-within:border-terracotta transition-colors">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-terracotta/10 text-terracotta text-xs font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="hover:text-terracotta-dark"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
          }
          if (e.key === 'Backspace' && !input && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] outline-none text-sm text-[#1C1917] placeholder:text-slate-400 bg-transparent"
      />
    </div>
  );
}

// ── Allergen Selector ─────────────────────────────────────────────────────────

function AllergenSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (allergen: string) =>
    onChange(
      selected.includes(allergen)
        ? selected.filter((a) => a !== allergen)
        : [...selected, allergen],
    );

  return (
    <div className="flex flex-wrap gap-2">
      {ALLERGENS.map((allergen) => {
        const active = selected.includes(allergen);
        return (
          <button
            key={allergen}
            type="button"
            onClick={() => toggle(allergen)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'border-terracotta bg-terracotta text-white'
                : 'border-[#E7E5E4] bg-white text-slate-600 hover:border-terracotta hover:text-terracotta'
            }`}
          >
            {allergen}
          </button>
        );
      })}
    </div>
  );
}

// ── Option Item Row ───────────────────────────────────────────────────────────

function OptionItemRow({
  item,
  onUpdate,
  onRemove,
  dragHandleProps,
}: {
  item: OptionItem;
  onUpdate: (patch: Partial<OptionItem>) => void;
  onRemove: () => void;
  dragHandleProps?: Record<string, unknown> | undefined;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div {...dragHandleProps} className="cursor-grab text-slate-300 hover:text-slate-400">
        <GripVertical size={14} />
      </div>
      <input
        value={item.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Nom de l'option"
        className="flex-1 h-8 px-2.5 rounded border border-[#E7E5E4] text-sm focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/20"
      />
      <input
        type="number"
        value={item.price_delta || ''}
        onChange={(e) => onUpdate({ price_delta: parseFloat(e.target.value) || 0 })}
        placeholder="+prix"
        className="w-24 h-8 px-2.5 rounded border border-[#E7E5E4] text-sm text-right focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/20"
      />
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function SortableOptionItem(props: React.ComponentProps<typeof OptionItemRow>) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.item._key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
    >
      <OptionItemRow {...props} dragHandleProps={listeners} />
    </div>
  );
}

// ── Option Group Card ─────────────────────────────────────────────────────────

function OptionGroupCard({
  group,
  onUpdate,
  onRemove,
}: {
  group: OptionGroup;
  onUpdate: (patch: Partial<OptionGroup>) => void;
  onRemove: () => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function addOption() {
    onUpdate({
      options: [
        ...group.options,
        { _key: crypto.randomUUID(), name: '', price_delta: 0, is_default: false },
      ],
    });
  }

  function updateOption(key: string, patch: Partial<OptionItem>) {
    onUpdate({
      options: group.options.map((o) => (o._key === key ? { ...o, ...patch } : o)),
    });
  }

  function removeOption(key: string) {
    onUpdate({ options: group.options.filter((o) => o._key !== key) });
  }

  function handleOptionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = group.options.findIndex((o) => o._key === active.id);
    const newIndex = group.options.findIndex((o) => o._key === over.id);
    onUpdate({ options: arrayMove(group.options, oldIndex, newIndex) });
  }

  return (
    <div className="border border-[#E7E5E4] rounded-lg overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-3 p-3 bg-[#FAFAF8]">
        <input
          value={group.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nom du groupe (ex: Taille)"
          className="flex-1 h-8 px-2.5 rounded border border-[#E7E5E4] bg-white text-sm font-medium focus:outline-none focus:border-terracotta"
        />
        <select
          value={group.type}
          onChange={(e) => onUpdate({ type: e.target.value as 'single' | 'multiple' })}
          className="h-8 px-2 rounded border border-[#E7E5E4] bg-white text-xs focus:outline-none focus:border-terracotta"
        >
          <option value="single">Choix unique</option>
          <option value="multiple">Choix multiple</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={group.is_required}
            onChange={(e) => onUpdate({ is_required: e.target.checked })}
            className="accent-terracotta"
          />
          Requis
        </label>
        <button
          type="button"
          onClick={() => onUpdate({ expanded: !group.expanded })}
          className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-400"
        >
          {group.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Options list */}
      {group.expanded && (
        <div className="p-3 space-y-0.5 border-t border-[#E7E5E4]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleOptionDragEnd}
          >
            <SortableContext
              items={group.options.map((o) => o._key)}
              strategy={verticalListSortingStrategy}
            >
              {group.options.map((item) => (
                <SortableOptionItem
                  key={item._key}
                  item={item}
                  onUpdate={(patch) => updateOption(item._key, patch)}
                  onRemove={() => removeOption(item._key)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={addOption}
            className="mt-2 flex items-center gap-1.5 text-xs text-terracotta hover:text-terracotta-dark font-medium transition-colors"
          >
            <Plus size={13} /> Ajouter une option
          </button>
        </div>
      )}
    </div>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFAF8] transition-colors"
      >
        <h2 className="font-heading text-base font-semibold text-[#1C1917]">{title}</h2>
        {open ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-[#E7E5E4] pt-4">{children}</div>}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────────────────────────

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCategoryId = searchParams.get('category') ?? '';

  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { upload, progress, loading: uploading } = useUpload();

  const isEdit = !!product;

  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [allergens, setAllergens] = useState<string[]>(product?.allergens ?? []);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      category_id: product?.category_id ?? defaultCategoryId,
      base_price: product?.base_price ?? 0,
      sku: product?.sku ?? '',
      is_available: product?.is_available ?? true,
      is_featured: product?.is_featured ?? false,
      calories: product?.calories,
      proteins: product?.proteins,
      carbs: product?.carbs,
      fats: product?.fats,
      serving_size: product?.serving_size ?? '',
    },
  });

  function addOptionGroup() {
    setOptionGroups((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        name: '',
        type: 'single',
        is_required: false,
        min_select: 0,
        max_select: 1,
        options: [],
        expanded: true,
      },
    ]);
  }

  function updateOptionGroup(key: string, patch: Partial<OptionGroup>) {
    setOptionGroups((prev) =>
      prev.map((g) => (g._key === key ? { ...g, ...patch } : g)),
    );
  }

  function removeOptionGroup(key: string) {
    setOptionGroups((prev) => prev.filter((g) => g._key !== key));
  }

  const onSubmit = async (formData: FormData, addAnother = false) => {
    try {
      const payload: ProductPayload = {
        name: formData.name,
        category_id: formData.category_id,
        base_price: formData.base_price,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        tags,
        allergens,
        calories: formData.calories,
        proteins: formData.proteins,
        carbs: formData.carbs,
        fats: formData.fats,
      };
      if (formData.description) payload.description = formData.description;
      if (formData.sku) payload.sku = formData.sku;
      if (formData.serving_size) payload.serving_size = formData.serving_size;

      let savedProduct: Product;
      if (isEdit) {
        savedProduct = await updateProduct.mutateAsync({ id: product.id, payload });
      } else {
        savedProduct = await createProduct.mutateAsync(payload);
      }

      if (imageFile) {
        await upload(imageFile, savedProduct.id);
      }

      toast.success(isEdit ? 'Produit mis à jour' : 'Produit créé');

      if (addAnother) {
        router.push(`/dashboard/menu/products/new?category=${formData.category_id}`);
        router.refresh();
      } else {
        router.push(`/dashboard/menu/${formData.category_id}`);
      }
    } catch {
      toast.error('Une erreur est survenue');
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending || uploading;
  const isAvailable = watch('is_available');
  const isFeatured = watch('is_featured');

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Informations */}
          <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm p-5 space-y-4">
            <h2 className="font-heading text-base font-semibold text-[#1C1917]">
              Informations
            </h2>

            <Field label="Nom du produit" required error={errors.name?.message}>
              <input
                {...register('name')}
                placeholder="Ex : Thiéboudienne royale"
                className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
              />
            </Field>

            <Field label="Description">
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Décrivez votre plat…"
                className="w-full px-3 py-2 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Catégorie" required error={errors.category_id?.message}>
                <select
                  {...register('category_id')}
                  className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
                >
                  <option value="">Sélectionner…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="SKU" hint="Code article interne (optionnel)">
                <input
                  {...register('sku')}
                  placeholder="EX-001"
                  className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm font-mono text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
                />
              </Field>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold text-[#1C1917]">Options</h2>
              <button
                type="button"
                onClick={addOptionGroup}
                className="flex items-center gap-1.5 text-sm text-terracotta hover:text-terracotta-dark font-medium transition-colors"
              >
                <Plus size={15} /> Ajouter un groupe
              </button>
            </div>

            {optionGroups.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                Pas d&apos;options pour ce produit.{' '}
                <button
                  type="button"
                  onClick={addOptionGroup}
                  className="text-terracotta hover:underline"
                >
                  Ajouter un groupe
                </button>
              </p>
            ) : (
              <div className="space-y-2">
                {optionGroups.map((group) => (
                  <OptionGroupCard
                    key={group._key}
                    group={group}
                    onUpdate={(patch) => updateOptionGroup(group._key, patch)}
                    onRemove={() => removeOptionGroup(group._key)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Nutritional info */}
          <CollapsibleSection title="Informations nutritionnelles">
            <Field label="Portion">
              <input
                {...register('serving_size')}
                placeholder="Ex : 350g"
                className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
              />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'calories' as const, label: 'Calories (kcal)' },
                { name: 'proteins' as const, label: 'Protéines (g)' },
                { name: 'carbs' as const, label: 'Glucides (g)' },
                { name: 'fats' as const, label: 'Lipides (g)' },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-xs text-slate-500 mb-1">{label}</label>
                  <input
                    {...register(name)}
                    type="number"
                    min={0}
                    step="0.1"
                    className="w-full h-9 px-2.5 rounded-md border border-[#E7E5E4] text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Allergens */}
          <CollapsibleSection title="Allergènes">
            <AllergenSelector selected={allergens} onChange={setAllergens} />
          </CollapsibleSection>

          {/* Tags */}
          <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm p-5">
            <h2 className="font-heading text-base font-semibold text-[#1C1917] mb-3">Tags</h2>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="vegan, halal, épicé… (Entrée pour valider)"
            />
          </div>

          {/* Informations additionnelles (custom fields) */}
          {isEdit && product?.id && (
            <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm p-5 space-y-4">
              <h2 className="font-heading text-base font-semibold text-[#1C1917]">
                Informations additionnelles
              </h2>
              <DynamicForm entityType="product" entityId={product.id} />
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Photo */}
          <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm p-5 space-y-3">
            <h2 className="font-heading text-base font-semibold text-[#1C1917]">Photo</h2>
            <ImageUploadZone
              value={imagePreview}
              onChange={(file) => {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
              uploading={uploading}
              progress={progress}
            />
            {imagePreview && (
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="text-xs text-red-400 hover:text-red-500 transition-colors"
              >
                Supprimer la photo
              </button>
            )}
          </div>

          {/* Prix & Disponibilité */}
          <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm p-5 space-y-4">
            <h2 className="font-heading text-base font-semibold text-[#1C1917]">
              Prix &amp; Disponibilité
            </h2>

            <Field label="Prix de base" required error={errors.base_price?.message}>
              <div className="relative">
                <input
                  {...register('base_price')}
                  type="number"
                  min={0}
                  step="50"
                  placeholder="0"
                  className="w-full h-10 pl-3 pr-14 rounded-md border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  F CFA
                </span>
              </div>
            </Field>

            <div className="space-y-3">
              <Controller
                name="is_available"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1C1917]">Disponible</p>
                      <p className="text-xs text-slate-400">Visible et commandable</p>
                    </div>
                    <Switch checked={field.value} onChange={field.onChange} />
                  </div>
                )}
              />

              <Controller
                name="is_featured"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1C1917]">Mis en avant</p>
                      <p className="text-xs text-slate-400">Affiché en priorité sur la vitrine</p>
                    </div>
                    <Switch checked={field.value} onChange={field.onChange} />
                  </div>
                )}
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-lg bg-terracotta text-white font-medium text-sm hover:bg-terracotta-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                {isPending ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
              </button>

              {!isEdit && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSubmit((data) => onSubmit(data, true))}
                  className="w-full h-10 rounded-lg border border-[#E7E5E4] text-[#1C1917] font-medium text-sm hover:bg-[#F5F4F2] transition-colors disabled:opacity-60"
                >
                  Enregistrer et ajouter un autre
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
