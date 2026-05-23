'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  GripVertical,
  UtensilsCrossed,
  AlertCircle,
} from 'lucide-react';
import {
  useCategories,
} from '@/hooks/menu/use-categories';
import {
  useProducts,
  useToggleAvailability,
  useDeleteProduct,
  useReorderProducts,
  type Product,
} from '@/hooks/menu/use-products';

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

// ── Product Context Menu ──────────────────────────────────────────────────────

function ProductContextMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
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
        <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-lg shadow-md border border-[#E7E5E4] overflow-hidden py-1">
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

// ── Product Grid Card ─────────────────────────────────────────────────────────

function ProductGridCard({
  product,
  dragHandleProps,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product;
  dragHandleProps?: Record<string, unknown> | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (available: boolean) => void;
}) {
  const fmt = (n: number) => new Intl.NumberFormat('fr-SN').format(n) + ' F';

  return (
    <div
      onClick={onEdit}
      className={`group relative bg-white rounded-xl border border-[#E7E5E4] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
        !product.is_available ? 'opacity-70' : ''
      }`}
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden rounded-t-xl">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed size={28} className="text-slate-300" />
          </div>
        )}

        {/* Unavailable overlay */}
        {!product.is_available && (
          <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
            <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">
              Non dispo
            </span>
          </div>
        )}

        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="absolute top-2 left-2 p-1 rounded bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          aria-label="Réordonner"
        >
          <GripVertical size={14} className="text-slate-500" />
        </div>

        {/* Featured badge */}
        {product.is_featured && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gold text-white text-[10px] font-semibold">
            Mis en avant
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-sm font-semibold text-[#1C1917] truncate">
              {product.name}
            </h3>
            <p className="mt-0.5 font-mono text-sm font-semibold text-[#1C1917]">
              {fmt(product.base_price)}
            </p>
          </div>
          <ProductContextMenu onEdit={onEdit} onDelete={onDelete} />
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <Switch
            checked={product.is_available}
            onChange={onToggle}
            label={product.is_available ? 'Rendre indisponible' : 'Rendre disponible'}
          />
          <span className="text-xs text-slate-500">
            {product.is_available ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Sortable Grid Card ────────────────────────────────────────────────────────

function SortableProductGridCard(
  props: Omit<React.ComponentProps<typeof ProductGridCard>, 'dragHandleProps'>,
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.product.id,
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
      <ProductGridCard {...props} dragHandleProps={listeners} />
    </div>
  );
}

// ── Product List Row ──────────────────────────────────────────────────────────

function ProductListRow({
  product,
  dragHandleProps,
  onEdit,
  onDelete,
  onToggle,
  trRef,
  trStyle,
  trAttributes,
}: {
  product: Product;
  dragHandleProps?: Record<string, unknown> | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (available: boolean) => void;
  trRef?: React.Ref<HTMLTableRowElement>;
  trStyle?: React.CSSProperties;
  trAttributes?: Record<string, unknown>;
}) {
  const fmt = (n: number) => new Intl.NumberFormat('fr-SN').format(n) + ' F';

  return (
    <tr
      ref={trRef}
      style={trStyle}
      {...trAttributes}
      className="border-b border-[#E7E5E4] last:border-0 hover:bg-[#FAFAF8] transition-colors group"
    >
      <td className="px-4 py-3 w-8">
        <div
          {...dragHandleProps}
          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={14} className="text-slate-400" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-9 h-9 rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed size={14} className="text-slate-300" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[#1C1917]">{product.name}</p>
            {product.sku && <p className="text-xs text-slate-400 font-mono">{product.sku}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-sm font-medium text-[#1C1917] text-right">
        {fmt(product.base_price)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Switch checked={product.is_available} onChange={onToggle} />
          {!product.is_available && (
            <AlertCircle size={13} className="text-red-400" />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors"
            aria-label="Modifier"
          >
            <Pencil size={14} className="text-slate-400" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-50 transition-colors"
            aria-label="Supprimer"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SortableProductListRow(
  props: Omit<React.ComponentProps<typeof ProductListRow>, 'dragHandleProps' | 'trRef' | 'trStyle' | 'trAttributes'>,
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.product.id,
  });

  return (
    <ProductListRow
      {...props}
      dragHandleProps={listeners}
      trRef={setNodeRef as React.Ref<HTMLTableRowElement>}
      trStyle={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      trAttributes={attributes as Record<string, unknown>}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoryProductsPage({
  params,
}: {
  params: { categoryId: string };
}) {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const reorderDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: categories = [] } = useCategories();
  const category = categories.find((c) => c.id === params.categoryId);

  const { data: products = [], isLoading } = useProducts({
    category_id: params.categoryId,
  });

  const toggleAvailability = useToggleAvailability();
  const deleteProduct = useDeleteProduct();
  const reorderProducts = useReorderProducts();

  useEffect(() => {
    setLocalProducts([...products].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
  }, [products]);

  const filteredProducts =
    search.trim()
      ? localProducts.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()),
        )
      : localProducts;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalProducts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);

      if (reorderDebounceRef.current) clearTimeout(reorderDebounceRef.current);
      reorderDebounceRef.current = setTimeout(() => {
        reorderProducts.mutate(next.map((p, i) => ({ id: p.id, sort_order: i })));
      }, 500);

      return next;
    });
  }

  function handleDelete(id: string) {
    if (window.confirm('Supprimer ce produit ?')) {
      deleteProduct.mutate(id);
    }
  }

  function handleToggle(id: string, current: boolean) {
    toggleAvailability.mutate({ id, is_available: !current });
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm font-body">
        <Link href="/dashboard/menu" className="text-slate-400 hover:text-terracotta transition-colors">
          Menu
        </Link>
        <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
        <span className="text-[#1C1917] font-medium">{category?.name ?? '…'}</span>
      </nav>

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/menu')}
            className="p-2 rounded-lg border border-[#E7E5E4] hover:bg-[#F5F4F2] transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#1C1917]">
              {category?.name ?? '…'}
            </h1>
            {category && (
              <p className="text-sm text-slate-400 font-body mt-0.5">
                {products.length} produit{products.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/dashboard/menu/products/new?category=${params.categoryId}`}
          className="flex items-center gap-2 px-4 h-10 rounded-md bg-terracotta text-white text-sm font-body hover:bg-terracotta-dark transition-colors"
        >
          <Plus size={16} />
          Nouveau produit
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full h-10 pl-9 pr-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
          />
        </div>

        {/* View toggle */}
        <div className="flex border border-[#E7E5E4] rounded-md overflow-hidden flex-shrink-0">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`p-2.5 transition-colors ${
              view === 'grid'
                ? 'bg-terracotta text-white'
                : 'bg-white text-slate-400 hover:bg-[#F5F4F2]'
            }`}
            aria-label="Vue grille"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`p-2.5 transition-colors ${
              view === 'list'
                ? 'bg-terracotta text-white'
                : 'bg-white text-slate-400 hover:bg-[#F5F4F2]'
            }`}
            aria-label="Vue liste"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#E7E5E4] animate-pulse overflow-hidden"
              >
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E7E5E4] animate-pulse h-48" />
        )
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="font-body text-slate-500">
            {search ? 'Aucun résultat pour cette recherche.' : 'Aucun produit dans cette catégorie.'}
          </p>
          {!search && (
            <Link
              href={`/dashboard/menu/products/new?category=${params.categoryId}`}
              className="mt-4 inline-block text-sm text-terracotta hover:text-terracotta-dark font-medium"
            >
              + Ajouter le premier produit
            </Link>
          )}
        </div>
      ) : view === 'grid' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredProducts.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <SortableProductGridCard
                  key={product.id}
                  product={product}
                  onEdit={() =>
                    router.push(`/dashboard/menu/products/${product.id}/edit`)
                  }
                  onDelete={() => handleDelete(product.id)}
                  onToggle={(available) => handleToggle(product.id, !available)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredProducts.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm overflow-hidden">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-[#E7E5E4] text-xs text-slate-400 uppercase tracking-wide">
                    <th className="w-8 px-4 py-3" />
                    <th className="text-left px-4 py-3 font-medium">Produit</th>
                    <th className="text-right px-4 py-3 font-medium">Prix</th>
                    <th className="text-left px-4 py-3 font-medium">Dispo</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <SortableProductListRow
                      key={product.id}
                      product={product}
                      onEdit={() =>
                        router.push(`/dashboard/menu/products/${product.id}/edit`)
                      }
                      onDelete={() => handleDelete(product.id)}
                      onToggle={(available) => handleToggle(product.id, !available)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
