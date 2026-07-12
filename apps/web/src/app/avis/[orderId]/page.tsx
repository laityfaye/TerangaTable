'use client';

import { useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';

function LeaveReviewContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;

    setStatus('sending');
    setError('');
    try {
      const res = await fetch(`${API_URL}/public/orders/${orderId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment: comment || undefined }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Impossible d\'enregistrer votre avis');
      }
      setStatus('sent');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF8]">
        <p className="text-slate-500 text-sm text-center max-w-xs">
          Lien invalide — utilisez le lien reçu après votre commande pour laisser un avis.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAF8]">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {status === 'sent' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-success" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#1C1917]">Merci pour votre avis !</h2>
              <p className="mt-3 text-sm text-slate-500">Votre note a bien été enregistrée.</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-[#E7E5E4] p-6 sm:p-8"
            >
              <h1 className="font-heading text-2xl font-bold text-[#1C1917] text-center">
                Comment était votre commande ?
              </h1>
              <p className="mt-2 text-sm text-slate-500 text-center">
                Votre avis aide les autres clients et le restaurant.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHovered(value)}
                      onMouseLeave={() => setHovered(0)}
                      className="p-1"
                      aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={32}
                        className={
                          value <= (hovered || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Un commentaire à ajouter ? (optionnel)"
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta resize-none"
                />

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={rating === 0 || status === 'sending'}
                  className="w-full h-12 rounded-md bg-terracotta text-white font-semibold text-sm hover:bg-terracotta-dark active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    'Envoyer mon avis'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LeaveReviewPage() {
  return (
    <Suspense>
      <LeaveReviewContent />
    </Suspense>
  );
}
