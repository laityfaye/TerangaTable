'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductForm } from '../_components/product-form';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm font-body">
        <Link href="/dashboard/menu" className="text-slate-400 hover:text-terracotta transition-colors">
          Menu
        </Link>
        <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
        <span className="text-[#1C1917] font-medium">Nouveau produit</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Nouveau produit</h1>
        <p className="mt-1 text-sm text-slate-500 font-body">
          Renseignez les informations du produit puis enregistrez.
        </p>
      </div>

      <Suspense>
        <ProductForm />
      </Suspense>
    </div>
  );
}
