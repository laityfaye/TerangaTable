'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/vitrine-api';
import type { VitrineCategory, VitrineProduct } from '@/types/vitrine';

type Filter = 'all' | 'vegan' | 'sans-gluten' | 'halal' | 'vegetarien';

interface Props {
  categories: VitrineCategory[];
  currencySymbol: string;
  slug: string;
  primaryColor: string;
  restaurantName: string;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'halal', label: 'Halal' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'vegetarien', label: 'Végétarien' },
  { key: 'sans-gluten', label: 'Sans gluten' },
];

function matchesFilter(product: VitrineProduct, filter: Filter): boolean {
  if (filter === 'all') return true;
  const tags = product.tags.map((t) => t.toLowerCase());
  const mapping: Record<Exclude<Filter, 'all'>, string[]> = {
    vegan: ['vegan', 'végétalien'],
    'sans-gluten': ['sans gluten', 'gluten free', 'gluten-free'],
    halal: ['halal'],
    vegetarien: ['végétarien', 'vegetarien', 'végé'],
  };
  return mapping[filter].some((kw) => tags.some((t) => t.includes(kw)));
}

const ALLERGEN_ICONS: Record<string, string> = {
  gluten: '🌾',
  lait: '🥛',
  oeufs: '🥚',
  arachides: '🥜',
  poisson: '🐟',
  soja: '🫘',
  fruits_de_mer: '🦐',
  noix: '🌰',
};

export default function MenuClient({ categories, currencySymbol, primaryColor, restaurantName }: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id ?? '');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToCategory = useCallback((id: string) => {
    setActiveCategoryId(id);
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      products: cat.products.filter((p) => matchesFilter(p, activeFilter)),
    }))
    .filter((cat) => cat.products.length > 0);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Page header */}
      <div className="bg-[#1A1A18] py-14 px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="h-px w-8" style={{ backgroundColor: primaryColor }} />
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: primaryColor }}>
            Notre carte
          </span>
          <div className="h-px w-8" style={{ backgroundColor: primaryColor }} />
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold text-white"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Menu — {restaurantName}
        </h1>
      </div>

      {/* Sticky nav: categories + filters */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4] shadow-sm">
        {/* Filters */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeFilter === f.key
                  ? 'text-white border-transparent'
                  : 'text-[#57534E] border-[#E7E5E4] bg-white hover:border-[--color-primary]'
              }`}
              style={activeFilter === f.key ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-hide pb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeCategoryId === cat.id
                  ? 'font-semibold'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
              style={activeCategoryId === cat.id ? { color: primaryColor } : {}}
            >
              {cat.name}
              {activeCategoryId === cat.id && (
                <div className="h-0.5 mt-1 rounded-full" style={{ backgroundColor: primaryColor }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-16">
        {filteredCategories.length === 0 && (
          <div className="text-center py-16 text-[#57534E]">
            <p className="text-lg font-medium">Aucun plat ne correspond à ce filtre.</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-4 text-sm underline"
              style={{ color: primaryColor }}
            >
              Voir tous les plats
            </button>
          </div>
        )}

        {filteredCategories.map((cat) => (
          <section
            key={cat.id}
            ref={(el) => { sectionRefs.current[cat.id] = el; }}
            id={`cat-${cat.id}`}
          >
            {/* Category header */}
            <div className="flex items-center gap-4 mb-6">
              <h2
                className="text-2xl font-bold text-[#1C1917]"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}
              >
                {cat.name}
              </h2>
              <div className="flex-1 h-px bg-[#E7E5E4]" />
              <span className="text-sm text-[#57534E]">{cat.products.length} plat{cat.products.length > 1 ? 's' : ''}</span>
            </div>

            {cat.description && (
              <p className="text-[#57534E] text-sm mb-6 italic">{cat.description}</p>
            )}

            {/* Products grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.products.map((product) => (
                <MenuProductCard
                  key={product.id}
                  product={product}
                  currencySymbol={currencySymbol}
                  primaryColor={primaryColor}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MenuProductCard({
  product,
  currencySymbol,
  primaryColor,
}: {
  product: VitrineProduct;
  currencySymbol: string;
  primaryColor: string;
}) {
  const imageSrc = product.imageUrl ?? (Array.isArray(product.images) ? product.images[0] : null) ?? null;

  return (
    <article className="bg-white rounded-lg overflow-hidden border border-[#E7E5E4] shadow-sm hover:shadow-md transition-shadow">
      {imageSrc && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          />
        </div>
      )}

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-semibold text-[#1C1917] leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {product.name}
          </h3>
          <span className="font-mono text-sm font-semibold shrink-0" style={{ color: primaryColor }}>
            {formatPrice(product.basePrice, currencySymbol)}
          </span>
        </div>

        {product.description && (
          <p className="text-[#57534E] text-sm leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: `${primaryColor}CC` }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Allergens */}
        {product.allergens?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-[#57534E]">Allergènes :</span>
            <div className="flex gap-1">
              {product.allergens.map((a) => (
                <span
                  key={a}
                  title={a}
                  className="text-sm"
                >
                  {ALLERGEN_ICONS[a.toLowerCase()] ?? '⚠️'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
