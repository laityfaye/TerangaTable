import { notFound } from 'next/navigation';
import { fetchVitrineData } from '@/lib/vitrine-api';
import ReservationForm from '@/components/vitrine/reservation-form';

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const data = await fetchVitrineData(slug);
    return {
      title: `Réserver une table — ${data.name}`,
      description: `Réservez votre table chez ${data.name}. Remplissez le formulaire en ligne et recevez une confirmation.`,
    };
  } catch {
    return { title: 'Réservation' };
  }
}

export default async function ReservationsPage({ params }: Props) {
  const { slug } = await params;

  let data;
  try {
    data = await fetchVitrineData(slug);
  } catch {
    notFound();
  }

  if (!data.modules.includes('reservations')) {
    notFound();
  }

  const settings = (data.settings ?? {}) as { opening_hours?: Record<string, { open: string; close: string } | 'closed'> };

  return (
    <div className="pt-16 min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-[#1A1A18] py-14 px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="h-px w-8" style={{ backgroundColor: data.website_settings?.primary_color ?? '#C8553D' }} />
          <span
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: data.website_settings?.primary_color ?? '#C8553D' }}
          >
            Réservation en ligne
          </span>
          <div className="h-px w-8" style={{ backgroundColor: data.website_settings?.primary_color ?? '#C8553D' }} />
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold text-white"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Réserver une table
        </h1>
        <p className="text-white/60 mt-2 text-sm">{data.name}</p>
      </div>

      {/* Form */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <ReservationForm
          slug={slug}
          primaryColor={data.website_settings?.primary_color ?? '#C8553D'}
          openingHours={settings.opening_hours ?? null}
        />
      </div>
    </div>
  );
}
