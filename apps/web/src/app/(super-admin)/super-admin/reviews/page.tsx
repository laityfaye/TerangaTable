'use client';

import { toast } from 'sonner';
import { Star, Flag, EyeOff, Eye } from 'lucide-react';
import {
  useReviewModerationQueue,
  useModerateReview,
  type ModerationReview,
} from '@/hooks/use-super-admin';

// ── Stars ──────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
        />
      ))}
    </div>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────────

function ModerationRow({
  review,
  onModerate,
  loading,
}: {
  review: ModerationReview;
  onModerate: (id: string, status: 'published' | 'hidden') => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Stars rating={review.rating} />
          <span className="text-xs text-slate-500">{review.tenant.name}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-300">
            <Flag size={10} />
            {review.report_count} signalement{review.report_count > 1 ? 's' : ''}
          </span>
          {review.status === 'hidden' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
              Masqué
            </span>
          )}
        </div>
        {review.comment && <p className="text-sm text-slate-300 mt-1.5">{review.comment}</p>}
        {review.response && (
          <p className="text-xs text-slate-500 mt-1 italic">Réponse du restaurateur : {review.response}</p>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {review.status !== 'hidden' ? (
          <button
            onClick={() => onModerate(review.id, 'hidden')}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <EyeOff size={13} />
            Masquer
          </button>
        ) : (
          <button
            onClick={() => onModerate(review.id, 'published')}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-300 text-xs font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            <Eye size={13} />
            Republier
          </button>
        )}
        <button
          onClick={() => onModerate(review.id, 'published')}
          disabled={loading || review.status === 'published'}
          className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/5 transition-colors disabled:opacity-30"
        >
          Ignorer le signalement
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReviewsModerationPage() {
  const { data, isLoading, isError } = useReviewModerationQueue();
  const moderateMutation = useModerateReview();

  const reviews = data ?? [];

  async function handleModerate(id: string, status: 'published' | 'hidden') {
    try {
      await moderateMutation.mutateAsync({ id, status });
      toast.success(status === 'hidden' ? 'Avis masqué.' : 'Avis republié / signalement levé.');
    } catch {
      toast.error('Erreur lors de la modération');
    }
  }

  return (
    <div className="space-y-5 text-white">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Avis signalés</h1>
        <p className="mt-1 text-sm text-slate-400">
          Le restaurateur ne peut jamais masquer un avis lui-même — seule cette file, alimentée par les
          signalements clients, permet de masquer un contenu abusif.
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500 text-sm py-12">Chargement…</p>
      ) : isError ? (
        <p className="text-center text-red-400 text-sm py-12">Impossible de charger la file de modération.</p>
      ) : reviews.length === 0 ? (
        <div className="bg-slate-800/60 border border-white/10 rounded-xl py-16 text-center">
          <Star size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Aucun avis signalé pour le moment.</p>
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
          {reviews.map((review) => (
            <ModerationRow
              key={review.id}
              review={review}
              onModerate={(id, status) => void handleModerate(id, status)}
              loading={moderateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
