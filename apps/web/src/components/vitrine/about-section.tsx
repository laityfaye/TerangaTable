import Image from 'next/image';

interface Props {
  restaurantName: string;
  aboutText?: string | undefined;
  aboutChef?: string | undefined;
  aboutImage: string | null;
  primaryColor: string;
}

export default function AboutSection({ restaurantName, aboutText, aboutChef, aboutImage, primaryColor }: Props) {
  return (
    <section className="py-20 px-4 sm:px-6 bg-[#FAFAF8]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Text — 60% */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="h-px w-12" style={{ backgroundColor: primaryColor }} />
              <span className="text-sm uppercase tracking-widest font-semibold" style={{ color: primaryColor }}>
                Notre histoire
              </span>
            </div>

            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1C1917] leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              À propos de <br />
              <span style={{ color: primaryColor }}>{restaurantName}</span>
            </h2>

            {aboutText && (
              <p className="text-[#57534E] text-base leading-relaxed">
                {aboutText}
              </p>
            )}

            {aboutChef && (
              <blockquote
                className="relative pl-6 py-2 italic text-lg font-medium leading-relaxed"
                style={{
                  color: primaryColor,
                  fontFamily: 'var(--font-heading)',
                  borderLeft: `3px solid ${primaryColor}`,
                }}
              >
                {aboutChef}
              </blockquote>
            )}
          </div>

          {/* Image — 40% */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            {aboutImage ? (
              <div
                className="relative w-full max-w-sm aspect-[3/4] rounded-lg overflow-hidden shadow-lg"
                style={{ transform: 'rotate(1.5deg)' }}
              >
                <Image
                  src={aboutImage}
                  alt={`À propos de ${restaurantName}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 80vw, 320px"
                />
              </div>
            ) : (
              <div
                className="w-full max-w-sm aspect-[3/4] rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  transform: 'rotate(1.5deg)',
                  background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}30)`,
                }}
              >
                <svg className="w-20 h-20 opacity-30" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
