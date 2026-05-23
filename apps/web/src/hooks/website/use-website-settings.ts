'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Theme {
  id: string;
  name: string;
  slug: string;
  preview_url: string | null;
  is_premium: boolean;
  is_active: boolean;
  config: Record<string, unknown>;
}

export interface SectionItem {
  visible: boolean;
  order: number;
  [key: string]: unknown;
}

export interface SectionsConfig {
  hero:       SectionItem;
  specialites: SectionItem;
  about:      SectionItem;
  horaires:   SectionItem;
  galerie:    SectionItem;
  contact:    SectionItem;
}

export interface SocialLinks {
  facebook?:  string;
  instagram?: string;
  twitter?:   string;
  tiktok?:    string;
  youtube?:   string;
  whatsapp?:  string;
}

export interface ContentConfig {
  description?:     string | null;
  about_text?:      string | null;
  about_chef?:      string | null;
  about_image_url?: string | null;
  gallery_images?:  string[];
  phone?:           string | null;
  address?:         string | null;
  email?:           string | null;
}

export interface WebsiteSettingsData {
  id:               string;
  tenant_id:        string;
  tenant_slug:      string;
  theme_id:         string | null;
  custom_domain:    string | null;
  domain_status:    'pending' | 'active' | 'error' | null;
  is_published:     boolean;
  is_maintenance:   boolean;
  primary_color:    string;
  secondary_color:  string;
  logo_url:         string | null;
  favicon_url:      string | null;
  hero_image_url:   string | null;
  seo_title:        string | null;
  seo_description:  string | null;
  seo_keywords:     string | null;
  google_analytics: string | null;
  sections_config:  SectionsConfig;
  social_links:     SocialLinks;
  font_heading:     string;
  font_body:        string;
  content_config:   ContentConfig;
}

export type WebsiteSettingsPatch = Partial<
  Omit<WebsiteSettingsData, 'id' | 'tenant_id' | 'tenant_slug' | 'domain_status'>
>;

// ── Default sections config ───────────────────────────────────────────────────

export const DEFAULT_SECTIONS_CONFIG: SectionsConfig = {
  hero:        { visible: true, order: 0 },
  specialites: { visible: true, order: 1 },
  about:       { visible: true, order: 2 },
  horaires:    { visible: true, order: 3 },
  galerie:     { visible: true, order: 4 },
  contact:     { visible: true, order: 5 },
};

// ── Queries ───────────────────────────────────────────────────────────────────

export function useWebsiteSettings() {
  return useQuery<WebsiteSettingsData>({
    queryKey: ['website-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: WebsiteSettingsData }>('/website/settings');
      const raw = data.data;
      return {
        ...raw,
        is_maintenance:  raw.is_maintenance  ?? false,
        domain_status:   raw.domain_status   ?? null,
        sections_config: { ...DEFAULT_SECTIONS_CONFIG, ...raw.sections_config },
        social_links:    raw.social_links    ?? {},
        content_config:  raw.content_config  ?? {},
      };
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useThemes() {
  return useQuery<Theme[]>({
    queryKey: ['website-themes'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Theme[] }>('/website/themes');
      return data.data ?? [];
    },
    staleTime: 300_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

const READONLY_FIELDS = ['id', 'tenant_id', 'tenant_slug', 'domain_status'] as const;

export function useUpdateWebsiteSettings() {
  const qc = useQueryClient();
  return useMutation<WebsiteSettingsData, Error, WebsiteSettingsPatch>({
    mutationFn: async (patch) => {
      const cleanPatch = { ...patch } as Record<string, unknown>;
      for (const key of READONLY_FIELDS) delete cleanPatch[key];
      const { data } = await apiClient.patch<{ data: WebsiteSettingsData }>(
        '/website/settings',
        cleanPatch,
      );
      return data.data;
    },
    onSuccess: (updated) => {
      qc.setQueryData<WebsiteSettingsData>(['website-settings'], (prev) =>
        prev ? { ...prev, ...updated } : updated,
      );
    },
  });
}

export function usePublishWebsite() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => { await apiClient.post('/website/publish'); },
    onSuccess: () => {
      qc.setQueryData<WebsiteSettingsData>(['website-settings'], (prev) =>
        prev ? { ...prev, is_published: true } : prev,
      );
    },
  });
}

export function useUnpublishWebsite() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => { await apiClient.post('/website/unpublish'); },
    onSuccess: () => {
      qc.setQueryData<WebsiteSettingsData>(['website-settings'], (prev) =>
        prev ? { ...prev, is_published: false } : prev,
      );
    },
  });
}

export function useCheckDomain() {
  return useMutation<{ status: 'active' | 'pending' | 'error'; message: string }, Error, string>({
    mutationFn: async (domain) => {
      const { data } = await apiClient.post<{
        data: { status: 'active' | 'pending' | 'error'; message: string };
      }>('/website/check-domain', { domain });
      return data.data;
    },
  });
}

// ── Upload helpers ────────────────────────────────────────────────────────────

export interface UploadProgressFn {
  (percent: number): void;
}

function makeUploader(endpoint: string, fileField: string, responseField: string) {
  return async (file: File, onProgress?: UploadProgressFn): Promise<string> => {
    const fd = new FormData();
    fd.append(fileField, file);
    const { data } = await apiClient.post<{ data: Record<string, string> }>(
      endpoint,
      fd,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      },
    );
    return data.data[responseField] as string;
  };
}

export const uploadLogo    = makeUploader('/website/upload-logo',    'logo',  'logo_url');
export const uploadHero    = makeUploader('/website/upload-hero',    'hero',  'hero_image_url');
export const uploadFavicon = makeUploader('/website/upload-favicon', 'image', 'image_url');
export const uploadAbout   = makeUploader('/website/upload-about',   'image', 'image_url');
export const uploadGallery = makeUploader('/website/upload-gallery', 'image', 'image_url');
