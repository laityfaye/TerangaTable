'use client';

import { motion } from 'framer-motion';
import { DAY_LABELS, type DayKey } from '@/types/vitrine';

interface Props {
  openingHours: Record<string, { open: string; close: string } | 'closed'>;
  address?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
}

// ── Variants ─────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const headerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

const lineReveal = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.9, ease: EASE } },
};

const slideLeft = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE } },
};

const slideRight = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE, delay: 0.1 } },
};

const rowContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const rowItem = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

const contactContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const contactItem = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HorairesSection({ openingHours, address, phone, email }: Props) {
  const days = Object.keys(DAY_LABELS) as DayKey[];

  return (
    <section className="py-24 px-4 sm:px-6 bg-white overflow-hidden">
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
              Infos pratiques
            </span>
            <motion.div
              variants={lineReveal}
              className="h-px w-12 origin-left bg-[--color-primary]"
            />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Horaires &amp; Contact
          </motion.h2>
        </motion.div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Horaires card ── */}
          <motion.div
            className="bg-[#FAFAF8] rounded-2xl p-7 border border-[#E7E5E4] shadow-sm"
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <h3 className="font-semibold text-[#1C1917] text-lg mb-5 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#F5EAE7] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Nos horaires
            </h3>

            <motion.ul
              className="space-y-0"
              variants={rowContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              {days.map((day) => {
                const hours = openingHours[day];
                const isClosed = !hours || hours === 'closed';
                return (
                  <motion.li
                    key={day}
                    variants={rowItem}
                    className="flex justify-between items-center py-2.5 border-b border-[#E7E5E4]/70 last:border-0"
                  >
                    <span className="font-medium text-[#1C1917] capitalize text-sm">
                      {DAY_LABELS[day]}
                    </span>
                    {isClosed ? (
                      <span className="text-xs text-[#57534E] bg-[#F0EFED] px-3 py-0.5 rounded-full">
                        Fermé
                      </span>
                    ) : (
                      <span className="text-sm text-[#1C1917] font-mono tabular-nums">
                        {(hours as { open: string; close: string }).open}
                        {' '}–{' '}
                        {(hours as { open: string; close: string }).close}
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>

          {/* ── Contact + Maps column ── */}
          <motion.div
            className="flex flex-col gap-5"
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {/* Contact card */}
            <div className="bg-[#FAFAF8] rounded-2xl p-7 border border-[#E7E5E4] shadow-sm">
              <h3 className="font-semibold text-[#1C1917] text-lg mb-5 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#F5EAE7] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                Nous contacter
              </h3>

              <motion.ul
                className="space-y-3.5"
                variants={contactContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
              >
                {address && (
                  <motion.li variants={contactItem} className="flex items-start gap-3 text-[#57534E] text-sm">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-[--color-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{address}</span>
                  </motion.li>
                )}

                {phone && (
                  <motion.li variants={contactItem}>
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 text-[#57534E] text-sm hover:text-[--color-primary] transition-colors group"
                    >
                      <svg className="w-4 h-4 shrink-0 text-[--color-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="group-hover:underline">{phone}</span>
                    </a>
                  </motion.li>
                )}

                {email && (
                  <motion.li variants={contactItem}>
                    <a
                      href={`mailto:${email}`}
                      className="flex items-center gap-3 text-[#57534E] text-sm hover:text-[--color-primary] transition-colors group"
                    >
                      <svg className="w-4 h-4 shrink-0 text-[--color-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="group-hover:underline">{email}</span>
                    </a>
                  </motion.li>
                )}
              </motion.ul>
            </div>

            {/* Map */}
            {address && (
              <motion.div
                className="rounded-2xl overflow-hidden shadow-sm border border-[#E7E5E4]"
                style={{ height: 192 }}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              >
                <iframe
                  title="Localisation"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                  className="border-0 grayscale-[0.2]"
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
