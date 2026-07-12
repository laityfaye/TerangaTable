'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReviewStatus = 'published' | 'flagged' | 'hidden';

export interface Review {
  id: string;
  order_id: string;
  order_number: string | null;
  customer: { first_name: string; last_name: string | null } | null;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  response: string | null;
  responded_at: string | null;
  report_count: number;
  created_at: string;
}

export interface ReviewsResponse {
  data: Review[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    avg_rating: number;
    review_count: number;
  };
}

export interface ListReviewsQuery {
  status?: ReviewStatus;
  rating?: number;
  page?: number;
  limit?: number;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const REVIEWS_QKEY = {
  list: (q?: ListReviewsQuery) => ['reviews', q ?? {}] as const,
};

// ── List ───────────────────────────────────────────────────────────────────────

export function useReviews(query?: ListReviewsQuery) {
  return useQuery({
    queryKey: REVIEWS_QKEY.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get<ReviewsResponse>('/reviews', { params: query });
      return data;
    },
    staleTime: 30_000,
  });
}

// ── Répondre à un avis ───────────────────────────────────────────────────────

export function useRespondToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { data } = await apiClient.post<Review>(`/reviews/${id}/respond`, { response });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}
