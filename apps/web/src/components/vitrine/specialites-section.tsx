'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { formatPrice } from '@/lib/vitrine-api';
import type { VitrineProduct } from '@/types/vitrine';

interface Props {
  products: VitrineProduct[];
  currencySymbol: string;
  slug: string;
  primaryColor: string;
}

// ── Variants ─────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const headerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

const lineReveal = {
  hidden:  { scaleX: 0, originX: 0.5 },
  visible: { scaleX: 1, transition: { duration: 0.9, ease: EASE } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: EASE } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpecialitesSection({
  products,
  currencySymbol,
  slug,
  primaryColor,
}: Props) {
  return (
    <section className="py-24 px-4 sm:px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              variants={lineReveal}
              className="h-px w-12"
              style={{ backgroundColor: primaryColor }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.3em] font-semibold"
              style={{ color: primaryColor }}
            >
              Notre sélection
            </span>
            <motion.div
              variants={lineReveal}
              className="h-px w-12"
              style={{ backgroundColor: primaryColor, originX: 1 }}
            />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Nos Spécialités
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-3 text-[#57534E] text-base max-w-md mx-auto"
          >
            Des saveurs authentiques soigneusement sélectionnées pour vous
          </motion.p>
        </motion.div>

        {/* Products grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={cardVariants}>
              <ProductCard
                product={product}
                currencySymbol={currencySymbol}
                slug={slug}
                primaryColor={primaryColor}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <Link
            href={`/${slug}/menu`}
            className="group relative inline-flex items-center gap-2 px-9 py-4 rounded-full font-semibold text-sm tracking-wide text-white overflow-hidden transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <span
              className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)' }}
            />
            <span className="relative">Voir tout le menu</span>
            <svg className="relative w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────

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
  const imageSrc =
    product.imageUrl ??
    (Array.isArray(product.images) ? product.images[0] : null) ??
    null;

  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden bg-[#F5F4F2] shadow-sm"
      whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(0,0,0,0.13)' }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `radial-gradient(ellipse at 40% 40%, ${primaryColor}25, ${primaryColor}10)` }}
          >
            <svg className="w-12 h-12 opacity-30" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-400 flex items-center justify-center">
          <Link
            href={`/${slug}/menu`}
            className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
            style={{ backgroundColor: primaryColor }}
          >
            Commander
          </Link>
        </div>

        {/* Featured badge */}
        {product.isFeatured && (
          <div
            className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Spécialité
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-semibold text-[#1C1917] text-lg mb-1 line-clamp-1"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[#57534E] text-sm leading-relaxed line-clamp-2 mb-3">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-mono font-semibold text-[#1C1917] text-base">
            {formatPrice(product.basePrice, currencySymbol)}
          </span>
          <div className="flex gap-1 flex-wrap">
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
    </motion.div>
  );
}
