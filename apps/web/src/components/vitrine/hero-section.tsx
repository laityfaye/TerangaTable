import Link from 'next/link';

interface Props {
  restaurantName: string;
  tagline?: string | undefined;
  heroImageUrl: string | null;
  slug: string;
  hasReservations: boolean;
  primaryColor: string;
}

export default function HeroSection({ restaurantName, tagline, heroImageUrl, slug, hasReservations, primaryColor }: Props) {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center text-white overflow-hidden"
      style={{ minHeight: '92vh' }}
    >
      {/* Background image */}
      {heroImageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A18] to-[#3D2B1F]" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A18]/40 via-[#1A1A18]/50 to-[#1A1A18]/80" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 flex flex-col items-center gap-6">
        {/* Decorative line */}
        <div
          className="w-16 h-px"
          style={{ backgroundColor: primaryColor }}
        />

        <h1
          className="font-heading font-bold leading-tight"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          }}
        >
          {restaurantName}
        </h1>

        {tagline && (
          <p
            className="text-white/80 italic text-lg sm:text-xl max-w-xl leading-relaxed"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {tagline}
          </p>
        )}

        <div
          className="w-16 h-px"
          style={{ backgroundColor: primaryColor }}
        />

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href={`/${slug}/menu`}
            className="px-8 py-3.5 rounded-full font-semibold text-white text-sm tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Voir le menu
          </Link>
          {hasReservations && (
            <Link
              href={`/${slug}/reservations`}
              className="px-8 py-3.5 rounded-full font-semibold text-white text-sm tracking-wide border-2 border-white/70 hover:border-white hover:bg-white/10 transition-all"
            >
              Réserver une table
            </Link>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
        <span className="text-white/50 text-xs tracking-widest uppercase">Défiler</span>
        <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
