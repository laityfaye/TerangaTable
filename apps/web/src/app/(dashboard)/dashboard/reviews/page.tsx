'use client';

import { useState } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { useReviews, useRespondToReview, type Review, type ReviewStatus } from '@/hooks/reviews/use-reviews';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
        />
      ))}
    </div>
  );
}

const STATUS_META: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  published: { label: 'Publié', color: '#15803D', bg: '#DCFCE7' },
  flagged: { label: 'Signalé', color: '#B45309', bg: '#FEF3C7' },
  hidden: { label: 'Masqué', color: '#64748B', bg: '#F1F5F9' },
};

// ── Response form ──────────────────────────────────────────────────────────────

function ResponseForm({ review, onDone }: { review: Review; onDone: () => void }) {
  const [text, setText] = useState('');
  const { mutate: respond, isPending } = useRespondToReview();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    respond({ id: review.id, response: text.trim() }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Répondre publiquement à ce client…"
        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
      />
      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-50"
      >
        <Send size={14} />
        {isPending ? 'Envoi…' : 'Répondre'}
      </button>
    </form>
  );
}

// ── Review card ────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const [showForm, setShowForm] = useState(false);
  const statusMeta = STATUS_META[review.status];
  const customerName = review.customer
    ? `${review.customer.first_name} ${review.customer.last_name ?? ''}`.trim()
    : 'Client';

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StarRow rating={review.rating} />
            <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
          </div>
          <p className="text-sm font-medium text-slate-800 mt-1">
            {customerName}
            {review.order_number && (
              <span className="text-slate-400 font-normal"> · commande {review.order_number}</span>
            )}
          </p>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0"
          style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
        >
          {statusMeta.label}
        </span>
      </div>

      {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}

      {review.response ? (
        <div className="mt-2 pl-3 border-l-2 border-terracotta/30">
          <p className="text-xs font-semibold text-terracotta">Votre réponse</p>
          <p className="text-sm text-slate-600">{review.response}</p>
        </div>
      ) : showForm ? (
        <ResponseForm review={review} onDone={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-terracotta hover:text-terracotta-dark"
        >
          <MessageSquare size={13} />
          Répondre publiquement
        </button>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const RATING_TABS = [5, 4, 3, 2, 1] as const;

export default function ReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);

  const { data, isLoading } = useReviews({ rating: ratingFilter, limit: 50 });
  const reviews = data?.data ?? [];
  const avgRating = data?.meta.avg_rating ?? 0;
  const reviewCount = data?.meta.review_count ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Avis clients</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Chaque avis provient d&apos;une commande réellement passée chez vous — vous pouvez y répondre,
          mais pas le masquer.
        </p>
      </div>

      {/* Résumé */}
      <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-6">
        <div>
          <p className="text-3xl font-bold text-slate-900">{avgRating.toFixed(1)}</p>
          <StarRow rating={Math.round(avgRating)} size={16} />
        </div>
        <div className="text-sm text-slate-500">
          {reviewCount} avis{reviewCount !== 1 ? '' : ''} publié{reviewCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtre par note */}
      <div className="flex gap-1 border-b border-slate-100">
        <button
          onClick={() => setRatingFilter(undefined)}
          className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            ratingFilter === undefined
              ? 'border-terracotta text-terracotta'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Toutes
        </button>
        {RATING_TABS.map((r) => (
          <button
            key={r}
            onClick={() => setRatingFilter(r)}
            className={`flex items-center gap-1 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              ratingFilter === r
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {r} <Star size={12} className="fill-amber-400 text-amber-400" />
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse space-y-2">
              <div className="h-4 bg-slate-100 rounded w-32" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100">
          <Star size={40} className="text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Aucun avis pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
