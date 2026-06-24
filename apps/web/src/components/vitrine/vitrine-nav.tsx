'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  restaurantName: string;
  logoUrl:        string | null;
  slug:           string;
  hasReservations: boolean;
  hasOrdering:    boolean;
  primaryColor:   string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Nav link icons ────────────────────────────────────────────────────────────

const NAV_ICONS: Record<string, React.ReactNode> = {
  Accueil: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 21V12h6v9" />
    </svg>
  ),
  Menu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Commander: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Réserver: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function VitrineNav({
  restaurantName,
  logoUrl,
  slug,
  hasReservations,
  hasOrdering,
  primaryColor,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const pathname                = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > window.innerHeight * 0.85);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const links = [
    { href: `/${slug}`,              label: 'Accueil'   },
    { href: `/${slug}/menu`,         label: 'Menu'      },
    ...(hasOrdering    ? [{ href: `/${slug}/commande`,     label: 'Commander' }] : []),
    ...(hasReservations ? [{ href: `/${slug}/reservations`, label: 'Réserver'  }] : []),
  ];

  return (
    <>
      {/* ── Header bar ── */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E7E5E4]'
            : 'bg-gradient-to-b from-black/60 to-transparent backdrop-blur-[2px]'
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo / name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.05 }}
          >
            <Link href={`/${slug}`} className="flex items-center gap-3">
              {logoUrl ? (
                <Image src={logoUrl} alt={restaurantName} width={120} height={40}
                  className="h-10 w-auto object-contain" />
              ) : (
                <span
                  className={`text-xl font-bold tracking-tight transition-colors duration-500 ${
                    scrolled ? 'text-[#1C1917]' : 'text-white'
                  }`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {restaurantName}
                </span>
              )}
            </Link>
          </motion.div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link, i) => {
              const isActive = pathname === link.href;
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.08 + i * 0.04, ease: EASE }}
                >
                  <Link
                    href={link.href}
                    onClick={(e) => {
                      if (isActive) {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`relative text-sm font-medium transition-colors duration-200 pb-0.5 active:opacity-60 ${
                      scrolled
                        ? isActive ? 'text-[#1C1917]' : 'text-[#1C1917]/70 hover:text-[#1C1917]'
                        : isActive ? 'text-white'    : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {link.label}
                    {/* Indicateur de page active */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                        style={{ background: scrolled ? '#1C1917' : 'white' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}

            {hasOrdering && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.16, ease: EASE }}
              >
                <Link
                  href={`/${slug}/commande`}
                  className="group relative inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-full text-white overflow-hidden transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span
                    className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
                    style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)' }}
                  />
                  <svg className="relative w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="relative">Commander</span>
                </Link>
              </motion.div>
            )}
          </nav>

          {/* Hamburger — animated lines */}
          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden p-2 rounded-md transition-colors z-[60] relative ${
              open ? 'text-white' : scrolled ? 'text-[#1C1917]' : 'text-white'
            }`}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <div className="flex flex-col gap-[5px] w-6 h-[18px] justify-center">
              <motion.span
                className="block h-[2px] rounded-full bg-current"
                animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              />
              <motion.span
                className="block h-[2px] rounded-full bg-current"
                animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.25, ease: EASE }}
              />
              <motion.span
                className="block h-[2px] rounded-full bg-current"
                animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              />
            </div>
          </button>
        </div>
      </motion.header>

      {/* ── Mobile full-screen overlay ── */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 md:hidden">

            {/* ── Dark backdrop with grain ── */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                background: 'linear-gradient(160deg, #0D0D0B 0%, #1A0E08 50%, #0D0D0B 100%)',
              }}
            >
              {/* Grain texture */}
              <div className="grain-layer" aria-hidden="true" />

              {/* Primary color glow top-right */}
              <div
                className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />
              {/* Secondary glow bottom-left */}
              <div
                className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[100px] opacity-10 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />
            </motion.div>

            {/* ── Content panel ── */}
            <motion.nav
              className="relative z-10 h-full flex flex-col px-8 pt-24 pb-10"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: EASE, delay: 0 }}
            >

              {/* ── Navigation links ── */}
              <ul className="flex flex-col gap-1 flex-1">
                {links.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.28, ease: EASE, delay: 0.06 + i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={isActive
                        ? (e) => { e.preventDefault(); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
                        : () => setOpen(false)
                      }
                      className="group flex items-center gap-5 py-4 border-b border-white/8"
                    >
                      {/* Index number */}
                      <span
                        className="text-xs font-mono tabular-nums w-6 shrink-0 opacity-50 group-hover:opacity-100 transition-all duration-300"
                        style={{ color: primaryColor }}
                      >
                        0{i + 1}
                      </span>

                      {/* Label — big heading */}
                      <span
                        className="text-white/90 group-hover:text-white font-bold leading-none transition-all duration-300
                                   group-hover:translate-x-2"
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: 'clamp(2rem, 7vw, 2.8rem)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {link.label}
                      </span>

                      {/* Icon — appears on hover */}
                      <span
                        className="ml-auto text-white/0 group-hover:text-white/60 transition-all duration-300
                                   translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100"
                        style={{ color: primaryColor }}
                      >
                        {NAV_ICONS[link.label]}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Link>
                  </motion.li>
                  );
                })}
              </ul>

              {/* ── Bottom section ── */}
              <motion.div
                className="mt-8 flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: EASE, delay: 0.18 }}
              >
                {/* CTAs */}
                {hasOrdering && (
                  <Link
                    href={`/${slug}/commande`}
                    onClick={() => setOpen(false)}
                    className="group relative flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-semibold text-base overflow-hidden"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span
                      className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
                      style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)' }}
                    />
                    <svg className="relative w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="relative">Commander en ligne</span>
                  </Link>
                )}

                {hasReservations && (
                  <Link
                    href={`/${slug}/reservations`}
                    onClick={() => setOpen(false)}
                    className="group relative flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base overflow-hidden border border-white/20 hover:border-white/40 transition-colors"
                  >
                    <span
                      className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300"
                    />
                    <svg className="relative w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="relative text-white/80">Réserver une table</span>
                  </Link>
                )}

                {/* Footer label */}
                <p className="text-center text-white/25 text-xs tracking-[0.2em] uppercase">
                  {restaurantName}
                </p>
              </motion.div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
