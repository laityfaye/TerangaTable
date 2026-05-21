import { DAY_LABELS, type DayKey } from '@/types/vitrine';

interface Props {
  openingHours: Record<string, { open: string; close: string } | 'closed'>;
  address?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
}

export default function HorairesSection({ openingHours, address, phone, email }: Props) {
  const days = Object.keys(DAY_LABELS) as DayKey[];

  return (
    <section className="py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[--color-primary]" />
            <span className="text-sm uppercase tracking-widest font-semibold text-[--color-primary]">
              Infos pratiques
            </span>
            <div className="h-px w-12 bg-[--color-primary]" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Horaires & Contact
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Horaires */}
          <div className="bg-[#FAFAF8] rounded-lg p-6 border border-[#E7E5E4]">
            <h3 className="font-semibold text-[#1C1917] text-lg mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[--color-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nos horaires
            </h3>
            <ul className="space-y-2">
              {days.map((day) => {
                const hours = openingHours[day];
                const isClosed = !hours || hours === 'closed';
                return (
                  <li key={day} className="flex justify-between items-center py-2 border-b border-[#E7E5E4] last:border-0">
                    <span className="font-medium text-[#1C1917] capitalize">{DAY_LABELS[day]}</span>
                    {isClosed ? (
                      <span className="text-sm text-[#57534E] bg-[#F5F4F2] px-3 py-0.5 rounded-full">Fermé</span>
                    ) : (
                      <span className="text-sm text-[#1C1917] font-mono">
                        {(hours as { open: string; close: string }).open} – {(hours as { open: string; close: string }).close}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact + Maps */}
          <div className="flex flex-col gap-4">
            {/* Contact info */}
            <div className="bg-[#FAFAF8] rounded-lg p-6 border border-[#E7E5E4]">
              <h3 className="font-semibold text-[#1C1917] text-lg mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[--color-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Nous contacter
              </h3>
              <ul className="space-y-3">
                {address && (
                  <li className="flex items-start gap-3 text-[#57534E] text-sm">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-[--color-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {address}
                  </li>
                )}
                {phone && (
                  <li>
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 text-[#57534E] text-sm hover:text-[--color-primary] transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0 text-[--color-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="flex items-center gap-3 text-[#57534E] text-sm hover:text-[--color-primary] transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0 text-[--color-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {email}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Google Maps embed */}
            {address && (
              <div className="rounded-lg overflow-hidden h-48 bg-[#E7E5E4]">
                <iframe
                  title="Localisation"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                  className="border-0"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
