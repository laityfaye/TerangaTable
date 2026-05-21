import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/vitrine-api';
import type { VitrineProduct } from '@/types/vitrine';

interface Props {
  products: VitrineProduct[];
  currencySymbol: string;
  slug: string;
  primaryColor: string;
}

export default function SpecialitesSection({ products, currencySymbol, slug, primaryColor }: Props) {
  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12" style={{ backgroundColor: primaryColor }} />
            <span className="text-sm uppercase tracking-widest font-semibold" style={{ color: primaryColor }}>
              Notre sélection
            </span>
            <div className="h-px w-12" style={{ backgroundColor: primaryColor }} />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Nos Spécialités
          </h2>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currencySymbol={currencySymbol}
              slug={slug}
              primaryColor={primaryColor}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href={`/${slug}/menu`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Voir tout le menu
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  currencySymbol,
  slug,
  primaryColor,
}: {
  product: VitrineProduct;
  currencySymbol: string;
  slug: string;
  primaryColor: string;
}) {
  const imageSrc = product.imageUrl ?? (Array.isArray(product.images) ? product.images[0] : null) ?? null;

  return (
    <div className="group relative rounded-lg overflow-hidden bg-[#F5F4F2] shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#C8553D]/20 to-[#D4A843]/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#C8553D]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <Link
            href={`/${slug}/menu`}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
            style={{ backgroundColor: primaryColor }}
          >
            Commander
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-[#1C1917] text-lg mb-1 line-clamp-1" style={{ fontFamily: 'var(--font-heading)' }}>
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[#57534E] text-sm leading-relaxed line-clamp-2 mb-3">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-mono font-semibold text-[#1C1917]">
            {formatPrice(product.basePrice, currencySymbol)}
          </span>
          {product.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-white border border-[#E7E5E4] text-[#57534E]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
