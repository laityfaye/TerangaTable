'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface Props {
  images: string[];
  restaurantName: string;
}

// ── Variants ─────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const headerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const lineReveal = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.9, ease: EASE } },
};

const gridContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const imgReveal = {
  hidden:  { opacity: 0, scale: 0.88, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.75, ease: EASE },
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function GalerieSection({ images, restaurantName }: Props) {
  const display = images.slice(0, 6);
  if (display.length === 0) return null;

  return (
    <section className="py-24 px-4 sm:px-6 bg-[#1A1A18] overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          variants={headerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              variants={lineReveal}
              className="h-px w-12 origin-right bg-[--color-primary]"
            />
            <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[--color-primary]">
              Galerie
            </span>
            <motion.div
              variants={lineReveal}
              className="h-px w-12 origin-left bg-[--color-primary]"
            />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            L&apos;ambiance{' '}
            <span className="text-[--color-primary]">{restaurantName}</span>
          </motion.h2>
        </motion.div>

        {/* Grid layouts */}
        {display.length === 1 ? (
          <motion.div
            variants={imgReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            <GalImage
              src={display[0]!}
              alt={`${restaurantName} — ambiance`}
              className="relative overflow-hidden rounded-2xl aspect-[16/7]"
              sizes="100vw"
              featured
            />
          </motion.div>

        ) : display.length <= 3 ? (
          <motion.div
            className={`grid gap-4 ${display.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
            variants={gridContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            {display.map((src, i) => (
              <motion.div key={i} variants={imgReveal}>
                <GalImage
                  src={src}
                  alt={`${restaurantName} — photo ${i + 1}`}
                  className="relative overflow-hidden rounded-2xl aspect-[4/3]"
                  sizes="(max-width:640px) 100vw, 33vw"
                />
              </motion.div>
            ))}
          </motion.div>

        ) : (
          /* 4–6 images: featured + grid */
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            variants={gridContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            {/* Featured — spans 2 rows */}
            <motion.div
              variants={imgReveal}
              className="sm:row-span-2"
            >
              <GalImage
                src={display[0]!}
                alt={`${restaurantName} — photo principale`}
                className="relative overflow-hidden rounded-2xl aspect-[3/4] sm:aspect-auto sm:h-full"
                sizes="(max-width:640px) 50vw, 33vw"
                featured
              />
            </motion.div>

            {display.slice(1).map((src, i) => (
              <motion.div key={i} variants={imgReveal}>
                <GalImage
                  src={src}
                  alt={`${restaurantName} — photo ${i + 2}`}
                  className="relative overflow-hidden rounded-2xl aspect-[4/3]"
                  sizes="(max-width:640px) 50vw, 33vw"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ── Gallery image tile with hover overlay ────────────────────────────────────

function GalImage({
  src,
  alt,
  className,
  sizes,
  featured = false,
}: {
  src: string;
  alt: string;
  className: string;
  sizes: string;
  featured?: boolean;
}) {
  return (
    <motion.div
      className={`group ${className}`}
      whileHover={{ scale: featured ? 1.015 : 1.02 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {/* Image */}
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        sizes={sizes}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500" />

      {/* Zoom icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center
                     scale-75 group-hover:scale-100 transition-transform duration-500"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      {/* Bottom gradient for featured image */}
      {featured && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      )}
    </motion.div>
  );
}
