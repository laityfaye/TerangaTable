'use client';

import Link from 'next/link';
import { ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { ProductForm } from '../../_components/product-form';
import { useProduct } from '@/hooks/menu/use-products';
import { useCategories } from '@/hooks/menu/use-categories';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { data: product, isLoading, isError } = useProduct(params.id);
  const { data: categories = [] } = useCategories();

  const category = product ? categories.find((c) => c.id === product.category_id) : undefined;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm font-body flex-wrap">
        <Link
          href="/dashboard/menu"
          className="text-slate-400 hover:text-terracotta transition-colors"
        >
          Menu
        </Link>
        <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
        {category && (
          <>
            <Link
              href={`/dashboard/menu/${category.id}`}
              className="text-slate-400 hover:text-terracotta transition-colors"
            >
              {category.name}
            </Link>
            <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
          </>
        )}
        <span className="text-[#1C1917] font-medium">
          {product?.name ?? 'Modifier le produit'}
        </span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1C1917]">
          {product?.name ?? 'Modifier le produit'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 font-body">
          Modifiez les informations du produit puis enregistrez.
        </p>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-terracotta" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertTriangle size={32} className="text-amber-400" />
          <p className="text-slate-500 font-body">Impossible de charger ce produit.</p>
          <Link
            href="/dashboard/menu"
            className="text-sm text-terracotta hover:text-terracotta-dark font-medium"
          >
            ← Retour au menu
          </Link>
        </div>
      )}

      {product && <ProductForm product={product} />}
    </div>
  );
}
