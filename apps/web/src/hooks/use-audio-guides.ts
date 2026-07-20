'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface AudioGuideListItem {
  key: string;
  label: string;
  path: string | null;
  url: string | null;
  updated_at: string | null;
}

const LIST_QUERY_KEY = ['super-admin', 'audio-guides'] as const;

// ── Public : consommé par les widgets (CityAudioGuide, LandingAudioGuide,
// RoleAudioGuide) pour savoir si un enregistrement wolof existe pour leur
// clé. Pas d'auth requise — ces guides sont affichés sur des pages publiques
// (et le dashboard, où le token est de toute façon présent mais pas requis
// ici).
export function useAudioGuideUrl(key: string) {
  return useQuery({
    queryKey: ['audio-guides', key],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { key: string; url: string | null } }>(
        `/audio-guides/${key}`,
      );
      return data.data.url;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── SuperAdmin ─────────────────────────────────────────────────────────────

export function useAudioGuidesList() {
  return useQuery({
    queryKey: LIST_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: AudioGuideListItem[] }>('/audio-guides');
      return data.data;
    },
  });
}

export function useUploadAudioGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, file }: { key: string; file: File | Blob }) => {
      const form = new FormData();
      form.append('file', file, file instanceof File ? file.name : `${key}.webm`);
      const { data } = await apiClient.post(`/audio-guides/${key}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_data, { key }) => {
      void queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['audio-guides', key] });
    },
  });
}

export function useDeleteAudioGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await apiClient.delete(`/audio-guides/${key}`);
      return data;
    },
    onSuccess: (_data, key) => {
      void queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['audio-guides', key] });
    },
  });
}
