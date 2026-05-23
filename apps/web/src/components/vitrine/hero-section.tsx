'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Motion-enhanced Link for instant whileTap feedback
const MotionLink = motion.create(Link);

interface Props {
  restaurantName: string;
  tagline?: string | undefined;
  heroImageUrl: string | null;
  slug: string;
  hasReservations: boolean;
  primaryColor: string;
}

// ── Animation variants ────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const lineVariants = {
  hidden:  { scaleX: 0, originX: 0 },
  visible: { scaleX: 1, originX: 0, transition: { duration: 1.1, ease: EASE } },
};

const buttonVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, delay: i * 0.12, ease: EASE },
  }),
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection({
  restaurantName,
  tagline,
  heroImageUrl,
  slug,
  hasReservations,
  primaryColor,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  /* Parallax: content floats up gently as user scrolls */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const contentY  = useTransform(scrollYProgress, [0, 1], ['0%',  '-22%']);
  const bgY       = useTransform(scrollYProgress, [0, 1], ['0%',   '12%']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center text-center text-white overflow-hidden vitrine-selection"
      style={{ minHeight: '100svh' }}
    >
      {/* ── Background image with Ken Burns ── */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: bgY, opacity: bgOpacity }}
      >
        {heroImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          />
        ) : (
          <div
            className="absolute inset-0 animate-ken-burns"
            style={{
              background: `radial-gradient(ellipse at 30% 40%, #3D2B1F 0%, #1A1A18 60%, #0D0D0B 100%)`,
            }}
          />
        )}
      </motion.div>

      {/* ── Gradient overlays — depth layers ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-[1]" />

      {/* ── Film grain ── */}
      <div className="grain-layer z-[2]" aria-hidden="true" />

      {/* ── Primary color vignette (subtle) ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 z-[2] opacity-20"
        style={{
          background: `linear-gradient(to top, ${primaryColor}60, transparent)`,
        }}
      />

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center gap-7"
        style={{ y: contentY }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Decorative top element */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <motion.div
            variants={lineVariants}
            className="h-px w-10"
            style={{ backgroundColor: primaryColor }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.35em] font-semibold"
            style={{ color: primaryColor }}
          >
            Restaurant
          </span>
          <motion.div
            variants={lineVariants}
            className="h-px w-10"
            style={{ backgroundColor: primaryColor, originX: 1, scaleX: 0 }}
          />
        </motion.div>

        {/* Restaurant name */}
        <motion.h1
          variants={itemVariants}
          className="font-heading font-bold leading-[0.95] tracking-tight"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(3rem, 8vw, 6.5rem)',
            textShadow: '0 4px 32px rgba(0,0,0,0.5)',
          }}
        >
          {restaurantName}
        </motion.h1>

        {/* Tagline */}
        {tagline && (
          <motion.p
            variants={itemVariants}
            className="text-white/75 italic leading-relaxed max-w-lg"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
            }}
          >
            {tagline}
          </motion.p>
        )}

        {/* Separator */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3"
        >
          <div className="h-px w-12 opacity-40 bg-white" />
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="h-px w-12 opacity-40 bg-white" />
        </motion.div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-1">
          <motion.div custom={0} variants={buttonVariants} whileTap={{ scale: 0.94, opacity: 0.88 }}>
            <MotionLink
              href={`/${slug}/menu`}
              prefetch
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm tracking-wide overflow-hidden"
              style={{ backgroundColor: primaryColor }}
            >
              {/* Shimmer on hover */}
              <span
                className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
              />
              <span className="relative">Voir le menu</span>
              <svg className="relative w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </MotionLink>
          </motion.div>

          {hasReservations && (
            <motion.div custom={1} variants={buttonVariants} whileTap={{ scale: 0.94, opacity: 0.88 }}>
              <MotionLink
                href={`/${slug}/reservations`}
                prefetch
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm tracking-wide border border-white/40 hover:border-white hover:bg-white/10 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Réserver une table
              </MotionLink>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        <span className="text-white/40 text-[10px] tracking-[0.3em] uppercase">Découvrir</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-0.5"
        >
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
          <svg className="w-5 h-5 text-white/20 -mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
