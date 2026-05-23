'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Props {
  restaurantName: string;
  aboutText?: string | undefined;
  aboutChef?: string | undefined;
  aboutImage: string | null;
  primaryColor: string;
}

// ── Variants ─────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const textCol = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

const fadeLeft = {
  hidden:  { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE } },
};

const fadeRight = {
  hidden:  { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.85, ease: EASE } },
};

const lineExpand = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.0, ease: EASE } },
};

const quoteVariants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE, delay: 0.1 } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AboutSection({
  restaurantName,
  aboutText,
  aboutChef,
  aboutImage,
  primaryColor,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  /* Subtle image parallax */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 bg-[#FAFAF8] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">

          {/* ── Text column ── */}
          <motion.div
            className="lg:col-span-3 flex flex-col gap-6"
            variants={textCol}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {/* Label + line */}
            <motion.div variants={fadeLeft} className="flex items-center gap-4">
              <motion.div
                variants={lineExpand}
                className="h-px w-12 origin-left"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="text-[11px] uppercase tracking-[0.3em] font-semibold"
                style={{ color: primaryColor }}
              >
                Notre histoire
              </span>
            </motion.div>

            {/* Title */}
            <motion.h2
              variants={fadeLeft}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] leading-[1.1]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              À propos de{' '}
              <br />
              <span style={{ color: primaryColor }}>{restaurantName}</span>
            </motion.h2>

            {/* Body text */}
            {aboutText && (
              <motion.p variants={fadeLeft} className="text-[#57534E] text-base leading-[1.85]">
                {aboutText}
              </motion.p>
            )}

            {/* Chef quote */}
            {aboutChef && (
              <motion.blockquote
                variants={quoteVariants}
                className="relative pl-6 py-3 italic text-lg font-medium leading-relaxed"
                style={{
                  color: primaryColor,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {/* Animated left border */}
                <motion.span
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full origin-top"
                  style={{ backgroundColor: primaryColor }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
                />
                &ldquo;{aboutChef}&rdquo;
              </motion.blockquote>
            )}

            {/* Decorative dots */}
            <motion.div variants={fadeLeft} className="flex items-center gap-2 pt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  style={{
                    backgroundColor: primaryColor,
                    width: i === 0 ? 28 : 6,
                    height: 6,
                    opacity: i === 0 ? 1 : 0.35,
                  }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease: EASE }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* ── Image column ── */}
          <motion.div
            className="lg:col-span-2 flex justify-center lg:justify-end"
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <div
              className="relative w-full max-w-sm overflow-hidden"
              style={{ transform: 'rotate(1.5deg)' }}
            >
              {/* Decorative frame */}
              <div
                className="absolute -inset-2 rounded-2xl opacity-20 -z-10"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}80, transparent)`,
                  transform: 'rotate(-1.5deg)',
                }}
              />

              <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-2xl">
                {/* Parallax wrapper */}
                <motion.div
                  className="absolute inset-[-8%] w-[116%] h-[116%]"
                  style={{ y: imgY }}
                >
                  {aboutImage ? (
                    <Image
                      src={aboutImage}
                      alt={`À propos de ${restaurantName}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 80vw, 320px"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}35)`,
                      }}
                    >
                      <svg
                        className="w-20 h-20 opacity-25"
                        style={{ color: primaryColor }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 22V12h6v10"
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>

                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating accent badge */}
              <motion.div
                className="absolute -bottom-4 -left-4 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-lg"
                style={{ backgroundColor: primaryColor }}
                initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
                whileInView={{ opacity: 1, scale: 1, rotate: -6 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.55, ease: EASE }}
              >
                {restaurantName}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
