'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  X,
  Image as ImageIcon,
  UtensilsCrossed,
  Package,
  Settings2,
} from 'lucide-react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
  type Category,
  type CategoryPayload,
} from '@/hooks/menu/use-categories';
import { useProducts, useDeleteProduct, useToggleAvailability } from '@/hooks/menu/use-products';
import { useUpload } from '@/hooks/menu/use-upload';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'categories' | 'products' | 'options';

interface CategoryFormData {
  name: string;
  description: string;
  parent_id: string;
  is_active: boolean;
}

// ── Switch ─────────────────────────────────────────────────────────────────────

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
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
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

// ── Context Menu ──────────────────────────────────────────────────────────────

function ContextMenu({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1 rounded hover:bg-slate-100 transition-colors"
        aria-label="Plus d'actions"
      >
        <MoreHorizontal size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-lg shadow-md border border-[#E7E5E4] overflow-hidden py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
          >
            <Pencil size={14} className="text-slate-400" /> Modifier
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
          >
            <Copy size={14} className="text-slate-400" /> Dupliquer
          </button>
          <div className="my-1 border-t border-[#E7E5E4]" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

// ── Category Card ─────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  dragHandleProps,
  onEdit,
  onDelete,
  onToggle,
  onClick,
}: {
  category: Category;
  dragHandleProps?: Record<string, unknown> | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-lg border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${category.is_active ? 'border-[#E7E5E4]' : 'border-[#E7E5E4] opacity-60'}`}
    >
      {/* Cover image */}
      <div className="aspect-video bg-slate-100 relative overflow-hidden rounded-t-lg">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed size={28} className="text-slate-300" />
          </div>
        )}
        <div
          {...dragHandleProps}
          className="absolute top-2 left-2 p-1 rounded bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          aria-label="Réordonner"
        >
          <GripVertical size={14} className="text-slate-500" />
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-base font-semibold text-[#1C1917] truncate">
              {category.name}
            </h3>
            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F4F2] text-[#57534E]">
              {category.product_count ?? 0} produit{(category.product_count ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <ContextMenu
            onEdit={onEdit}
            onDuplicate={() => {
              /* TODO: duplicate */
            }}
            onDelete={onDelete}
          />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Switch
            checked={category.is_active}
            onChange={onToggle}
            label={category.is_active ? 'Désactiver' : 'Activer'}
          />
          <span className="text-xs text-slate-500">
            {category.is_active ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Sortable Category Card ────────────────────────────────────────────────────

function SortableCategoryCard(props: Omit<React.ComponentProps<typeof CategoryCard>, 'dragHandleProps'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 0,
        position: 'relative',
      }}
      {...attributes}
    >
      <CategoryCard {...props} dragHandleProps={listeners} />
    </div>
  );
}

// ── Add Category Card ─────────────────────────────────────────────────────────

function AddCategoryCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2.5 text-slate-400 hover:border-terracotta hover:bg-terracotta/5 hover:text-terracotta transition-all duration-200 min-h-[180px]"
    >
      <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center">
        <Plus size={18} />
      </div>
      <span className="text-sm font-body font-medium">Ajouter une catégorie</span>
    </button>
  );
}

// ── Image Drop Zone ───────────────────────────────────────────────────────────

function ImageDropZone({
  value,
  onChange,
  uploading,
  progress,
}: {
  value: string | null;
  onChange: (file: File) => void;
  uploading?: boolean;
  progress?: number;
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
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-colors ${
        isDragging
          ? 'border-terracotta bg-terracotta-50'
          : 'border-slate-300 hover:border-terracotta hover:bg-terracotta/5'
      }`}
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
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{progress}%</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
            <span className="text-white text-xs font-medium">Changer l&apos;image</span>
          </div>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
          <ImageIcon size={24} />
          <p className="text-sm">Glissez une image ou cliquez pour sélectionner</p>
          <p className="text-xs text-slate-300">PNG, JPG, WebP — max 5 Mo</p>
        </div>
      )}
    </div>
  );
}

// ── Category Modal ─────────────────────────────────────────────────────────────

function CategoryModal({
  open,
  category,
  categories,
  onClose,
}: {
  open: boolean;
  category: Category | null;
  categories: Category[];
  onClose: () => void;
}) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const { upload, progress, loading: uploading } = useUpload();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    defaultValues: { name: '', description: '', parent_id: '', is_active: true },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? '',
        description: category?.description ?? '',
        parent_id: category?.parent_id ?? '',
        is_active: category?.is_active ?? true,
      });
      setImagePreview(category?.image_url ?? null);
      setImageFile(null);
    }
  }, [open, category, reset]);

  const onSubmit = async (formData: CategoryFormData) => {
    const payload: CategoryPayload = {
      name: formData.name,
      parent_id: formData.parent_id || null,
      is_active: formData.is_active,
    };
    if (formData.description) payload.description = formData.description;

    try {
      let savedCategory: Category;
      if (category) {
        savedCategory = await updateCategory.mutateAsync({ id: category.id, payload });
      } else {
        savedCategory = await createCategory.mutateAsync(payload);
      }

      if (imageFile) {
        const imageUrl = await upload(imageFile, undefined);
        await updateCategory.mutateAsync({
          id: savedCategory.id,
          payload: { image_url: imageUrl },
        });
      }

      onClose();
    } catch {
      // error handled by mutation
    }
  };

  const isPending =
    createCategory.isPending || updateCategory.isPending || uploading;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4]">
          <h2 className="font-heading text-lg font-semibold text-[#1C1917]">
            {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: 'Le nom est requis' })}
              placeholder="Ex : Plats principaux"
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Décrivez cette catégorie..."
              className="w-full px-3 py-2 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Image de couverture
            </label>
            <ImageDropZone
              value={imagePreview}
              onChange={(file) => {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
              uploading={uploading}
              progress={progress}
            />
          </div>

          {/* Catégorie parente */}
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Catégorie parente
            </label>
            <select
              {...register('parent_id')}
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
            >
              <option value="">Aucune (catégorie racine)</option>
              {categories
                .filter((c) => c.id !== category?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Actif */}
          <div className="flex items-center gap-3">
            <Switch
              checked={watch('is_active')}
              onChange={(v) => setValue('is_active', v)}
              label="Actif"
            />
            <span className="text-sm text-slate-600">Visible sur la vitrine</span>
          </div>

          {/* Actions */}
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
              disabled={isPending}
              className="flex-1 h-10 rounded-md bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-60"
            >
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  category,
  onConfirm,
  onClose,
  isPending,
}: {
  category: Category;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-[#1C1917] text-center mb-2">
            Supprimer la catégorie ?
          </h2>
          <p className="text-sm text-slate-500 text-center">
            La catégorie{' '}
            <span className="font-medium text-[#1C1917]">«&nbsp;{category.name}&nbsp;»</span>{' '}
            sera supprimée définitivement. Cette action est irréversible.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-md border border-[#E7E5E4] text-sm font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-10 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── All Products Tab ──────────────────────────────────────────────────────────

function AllProductsTab() {
  const { data: products = [], isLoading } = useProducts({});
  const toggleAvailability = useToggleAvailability();
  const deleteProduct = useDeleteProduct();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-white rounded-lg border border-[#E7E5E4] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-16">
        <Package size={40} className="mx-auto text-slate-200 mb-3" />
        <p className="text-slate-500 font-body">Aucun produit pour l&apos;instant.</p>
        <Link
          href="/dashboard/menu/products/new"
          className="mt-4 inline-flex items-center gap-2 px-4 h-10 rounded-md bg-terracotta text-white text-sm font-body hover:bg-terracotta-dark transition-colors"
        >
          <Plus size={16} />
          Ajouter un plat
        </Link>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm overflow-hidden">
      <table className="w-full text-sm font-body">
        <thead>
          <tr className="border-b border-[#E7E5E4] text-xs text-slate-400 uppercase tracking-wide">
            <th className="text-left px-5 py-3 font-medium">Produit</th>
            <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Catégorie</th>
            <th className="text-right px-5 py-3 font-medium">Prix</th>
            <th className="text-center px-5 py-3 font-medium">Dispo</th>
            <th className="text-right px-3 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr
              key={p.id}
              className={`border-b border-[#E7E5E4] hover:bg-[#FAFAF8] transition-colors ${
                i === products.length - 1 ? 'border-0' : ''
              }`}
            >
              {/* Produit */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-9 h-9 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed size={14} className="text-slate-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/menu/products/${p.id}/edit`}
                      className="font-medium text-[#1C1917] hover:text-terracotta transition-colors truncate block"
                    >
                      {p.name}
                    </Link>
                    {p.sku && (
                      <span className="text-xs text-slate-400 font-mono">{p.sku}</span>
                    )}
                  </div>
                </div>
              </td>

              {/* Catégorie */}
              <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                {p.category_name ?? <span className="text-slate-300 italic">—</span>}
              </td>

              {/* Prix */}
              <td className="px-5 py-3.5 text-right font-mono text-xs font-medium text-[#1C1917]">
                {new Intl.NumberFormat('fr-SN').format(p.base_price)} F
              </td>

              {/* Toggle disponibilité */}
              <td className="px-5 py-3.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTogglingId(p.id);
                    toggleAvailability.mutate(
                      { id: p.id, is_available: !p.is_available },
                      { onSettled: () => setTogglingId(null) },
                    );
                  }}
                  disabled={togglingId === p.id}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                    p.is_available
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  {p.is_available ? 'Disponible' : 'Non dispo'}
                </button>
              </td>

              {/* Actions */}
              <td className="px-3 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/dashboard/menu/products/${p.id}/edit`}
                    className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-[#1C1917]"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeletingId(p.id)}
                    className="p-1.5 rounded hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Modal suppression — hors du conteneur overflow-hidden */}
    {deletingId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
        <div className="relative bg-white rounded-xl shadow-lg w-full max-w-sm p-6 animate-fade-in-up">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-[#1C1917] text-center mb-2">
            Supprimer ce produit ?
          </h2>
          <p className="text-sm text-slate-500 text-center mb-6">
            Le produit sera désactivé et retiré de la vitrine.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="flex-1 h-10 rounded-md border border-[#E7E5E4] text-sm font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={deleteProduct.isPending}
              onClick={() => deleteProduct.mutate(deletingId!, { onSuccess: () => setDeletingId(null) })}
              className="flex-1 h-10 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {deleteProduct.isPending ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── Options Tab ───────────────────────────────────────────────────────────────

function OptionsTab() {
  return (
    <div className="text-center py-16">
      <Settings2 size={40} className="mx-auto text-slate-200 mb-3" />
      <p className="text-slate-500 font-body">Gestion des groupes d&apos;options globaux</p>
      <p className="text-xs text-slate-400 mt-1">
        Les options sont configurables depuis chaque fiche produit.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'categories', label: 'Catégories' },
  { id: 'products', label: 'Tous les produits' },
  { id: 'options', label: 'Options' },
];

export default function MenuPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const reorderDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: categories, isLoading } = useCategories();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();

  useEffect(() => {
    const sorted = [...(categories ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    setLocalCategories(sorted);
    // Prefetch toutes les pages de catégorie dès qu'elles sont visibles
    sorted.forEach((cat) => router.prefetch(`/dashboard/menu/${cat.id}`));
  }, [categories, router]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalCategories((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);

      if (reorderDebounceRef.current) clearTimeout(reorderDebounceRef.current);
      reorderDebounceRef.current = setTimeout(() => {
        reorderCategories.mutate(next.map((c, i) => ({ id: c.id, sort_order: i })));
      }, 500);

      return next;
    });
  }

  function openCreate() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setModalOpen(true);
  }

  function handleDelete(cat: Category) {
    setDeletingCategory(cat);
  }

  function confirmDelete() {
    if (!deletingCategory) return;
    deleteCategory.mutate(deletingCategory.id, {
      onSuccess: () => setDeletingCategory(null),
    });
  }

  function handleToggleActive(cat: Category, active: boolean) {
    updateCategory.mutate({ id: cat.id, payload: { is_active: active } });
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Menu</h1>
        {activeTab === 'categories' && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 h-10 rounded-md bg-terracotta text-white text-sm font-body hover:bg-terracotta-dark transition-colors"
          >
            <Plus size={16} />
            Nouvelle catégorie
          </button>
        )}
        {activeTab === 'products' && (
          <Link
            href="/dashboard/menu/products/new"
            className="flex items-center gap-2 px-4 h-10 rounded-md bg-terracotta text-white text-sm font-body hover:bg-terracotta-dark transition-colors"
          >
            <Plus size={16} />
            Nouveau plat
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E7E5E4] -mb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium font-body border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-slate-500 hover:text-[#1C1917]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'categories' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-[#E7E5E4] animate-pulse overflow-hidden"
                >
                  <div className="aspect-video bg-slate-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localCategories.map((c) => c.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {localCategories.map((cat) => (
                    <SortableCategoryCard
                      key={cat.id}
                      category={cat}
                      onEdit={() => openEdit(cat)}
                      onDelete={() => handleDelete(cat)}
                      onToggle={(active) => handleToggleActive(cat, active)}
                      onClick={() => router.push(`/dashboard/menu/${cat.id}`)}
                    />
                  ))}
                  <AddCategoryCard onClick={openCreate} />
                </div>
              </SortableContext>
            </DndContext>
          )}

          {!isLoading && localCategories.length === 0 && (
            <div className="text-center py-16">
              <UtensilsCrossed size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="font-body text-slate-500">Aucune catégorie pour l&apos;instant.</p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 text-sm text-terracotta hover:text-terracotta-dark font-medium"
              >
                + Créer votre première catégorie
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'products' && <AllProductsTab />}
      {activeTab === 'options' && <OptionsTab />}

      <CategoryModal
        open={modalOpen}
        category={editingCategory}
        categories={categories ?? []}
        onClose={() => setModalOpen(false)}
      />

      {deletingCategory && (
        <DeleteConfirmModal
          category={deletingCategory}
          onConfirm={confirmDelete}
          onClose={() => setDeletingCategory(null)}
          isPending={deleteCategory.isPending}
        />
      )}
    </div>
  );
}
