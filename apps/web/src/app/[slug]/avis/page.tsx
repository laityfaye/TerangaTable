import { notFound } from 'next/navigation';
import { fetchVitrineData, fetchVitrineReviews } from '@/lib/vitrine-api';
import ReviewReportButton from '@/components/vitrine/review-report-button';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const data = await fetchVitrineData(slug);
    const title = `Avis clients — ${data.name}`;
    const baseUrl = process.env['NEXT_PUBLIC_BASE_URL'] ?? 'https://terangatable.cloud';
    return {
      title,
      description: `Découvrez les avis clients de ${data.name}.`,
      alternates: { canonical: `${baseUrl}/${slug}/avis` },
    };
  } catch {
    return { title: 'Avis clients' };
  }
}

function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill={i < rating ? color : 'none'}
          stroke={i < rating ? color : '#D6D3D1'}
          strokeWidth={1.5}
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default async function AvisPage({ params }: Props) {
  const { slug } = await params;

  let data;
  try {
    data = await fetchVitrineData(slug);
  } catch {
    notFound();
  }

  if (!data.modules.includes('reviews')) {
    notFound();
  }

  const primaryColor = data.website_settings?.primary_color ?? '#C8553D';
  const reviewsPage = await fetchVitrineReviews(slug).catch(() => ({
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  }));
  const reviews = reviewsPage.data;

  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="pt-16 min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-[#1A1A18] py-14 px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="h-px w-8" style={{ backgroundColor: primaryColor }} />
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: primaryColor }}>
            Avis clients
          </span>
          <div className="h-px w-8" style={{ backgroundColor: primaryColor }} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          {data.name}
        </h1>
        {reviewsPage.meta.total > 0 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <Stars rating={Math.round(avgRating)} color={primaryColor} />
            <span className="text-white/70 text-sm">
              {avgRating.toFixed(1)} · {reviewsPage.meta.total} avis
            </span>
          </div>
        )}
      </div>

      {/* Liste */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-5">
        {reviews.length === 0 ? (
          <p className="text-center text-slate-400 text-sm">
            Aucun avis publié pour le moment — soyez le premier à noter {data.name} après votre commande.
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-[#E7E5E4] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <Stars rating={review.rating} color={primaryColor} />
                <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
              </div>
              <p className="text-sm font-medium text-[#1C1917]">
                {review.customer_first_name ?? 'Client'}
              </p>
              {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
              {review.response && (
                <div className="pl-3 border-l-2" style={{ borderColor: primaryColor }}>
                  <p className="text-xs font-semibold" style={{ color: primaryColor }}>
                    Réponse de {data.name}
                  </p>
                  <p className="text-sm text-slate-600">{review.response}</p>
                </div>
              )}
              <div className="flex justify-end">
                <ReviewReportButton reviewId={review.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
