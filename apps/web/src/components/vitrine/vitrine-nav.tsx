'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  restaurantName: string;
  logoUrl: string | null;
  slug: string;
  hasReservations: boolean;
  primaryColor: string;
}

export default function VitrineNav({ restaurantName, logoUrl, slug, hasReservations, primaryColor }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { href: `/${slug}`, label: 'Accueil' },
    { href: `/${slug}/menu`, label: 'Menu' },
    ...(hasReservations ? [{ href: `/${slug}/reservations`, label: 'Réserver' }] : []),
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E7E5E4]' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo / Nom */}
          <Link href={`/${slug}`} className="flex items-center gap-3 font-heading">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={restaurantName}
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span
                className={`text-xl font-bold tracking-tight transition-colors ${
                  scrolled ? 'text-[#1C1917]' : 'text-white'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {restaurantName}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[--color-primary] ${
                  scrolled ? 'text-[#1C1917]' : 'text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {hasReservations && (
              <Link
                href={`/${slug}/reservations`}
                className="text-sm font-semibold px-5 py-2 rounded-full text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Réserver une table
              </Link>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden p-2 rounded-md transition-colors ${scrolled ? 'text-[#1C1917]' : 'text-white'}`}
            aria-label="Menu"
          >
            <span className="sr-only">Menu</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <nav className="absolute top-0 right-0 h-full w-72 bg-white shadow-lg flex flex-col p-6 gap-4">
            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} className="p-2 text-[#57534E]" aria-label="Fermer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="font-heading font-bold text-lg text-[#1C1917]" style={{ fontFamily: 'var(--font-heading)' }}>
              {restaurantName}
            </p>
            <div className="flex flex-col gap-2 mt-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-[#1C1917] font-medium py-3 px-4 rounded-lg hover:bg-[#F5F4F2] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {hasReservations && (
                <Link
                  href={`/${slug}/reservations`}
                  onClick={() => setOpen(false)}
                  className="mt-4 text-center font-semibold px-5 py-3 rounded-full text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Réserver une table
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
