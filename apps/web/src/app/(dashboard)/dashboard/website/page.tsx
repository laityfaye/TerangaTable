'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Palette,
  Image as ImageIcon,
  LayoutGrid,
  Search as SearchIcon,
  Globe2,
  Link2,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Upload,
  X,
  Check,
  GripVertical,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageCircle,
  Loader2,
  Play,
  Camera,
  Share2,
  FileText,
  Plus,
  Twitter,
} from 'lucide-react';
import {
  useWebsiteSettings,
  useThemes,
  useUpdateWebsiteSettings,
  usePublishWebsite,
  useUnpublishWebsite,
  useCheckDomain,
  uploadLogo,
  uploadHero,
  uploadFavicon,
  uploadAbout,
  uploadGallery,
  DEFAULT_SECTIONS_CONFIG,
  type WebsiteSettingsPatch,
  type WebsiteSettingsData,
  type SectionsConfig,
  type SectionItem,
  type ContentConfig,
} from '@/hooks/website/use-website-settings';

// ── Constants ─────────────────────────────────────────────────────────────────

type ActiveSection = 'apparence' | 'contenu' | 'medias' | 'sections' | 'seo' | 'social' | 'domaine';

const NAV_ITEMS: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
  { id: 'apparence', label: 'Apparence',           icon: <Palette size={16} /> },
  { id: 'contenu',   label: 'Contenu',             icon: <FileText size={16} /> },
  { id: 'medias',    label: 'Médias',              icon: <ImageIcon size={16} /> },
  { id: 'sections',  label: 'Sections',            icon: <LayoutGrid size={16} /> },
  { id: 'seo',       label: 'SEO',                 icon: <SearchIcon size={16} /> },
  { id: 'social',    label: 'Réseaux sociaux',     icon: <Globe2 size={16} /> },
  { id: 'domaine',   label: 'Domaine personnalisé',icon: <Link2 size={16} /> },
];

const HEADING_FONTS = [
  'Playfair Display',
  'Sora',
  'Cormorant Garamond',
  'Abril Fatface',
  'Libre Baskerville',
  'Plus Jakarta Sans',
  'Josefin Sans',
  'Raleway',
];

const BODY_FONTS = [
  'DM Sans',
  'Inter',
  'Lato',
  'Nunito',
  'Open Sans',
  'Source Sans 3',
];

const COLOR_PRESETS = [
  '#C8553D', '#D4A843', '#2D6A4F', '#1A1A18',
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#6B7280',
];

const SECTION_META: Record<string, { label: string; emoji: string }> = {
  hero:       { label: 'Hero',       emoji: '🏔️' },
  specialites:{ label: 'Spécialités',emoji: '⭐' },
  about:      { label: 'À propos',   emoji: '👨‍🍳' },
  horaires:   { label: 'Horaires',   emoji: '🕐' },
  galerie:    { label: 'Galerie',    emoji: '📷' },
  contact:    { label: 'Contact',    emoji: '📍' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function injectGoogleFont(family: string) {
  if (typeof document === 'undefined') return;
  const id = `gf-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'il y a quelques secondes';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  return `il y a ${Math.floor(diff / 3600)}h`;
}

// ── Color Picker ──────────────────────────────────────────────────────────────

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [hex, setHex] = useState(value);

  useEffect(() => setHex(value), [value]);

  function commitHex(v: string) {
    const cleaned = v.startsWith('#') ? v : `#${v}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      onChange(cleaned);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#1C1917]">{label}</label>
      <div className="flex items-center gap-3">
        <label className="cursor-pointer">
          <div
            className="w-10 h-10 rounded-lg border-2 border-white shadow-md ring-1 ring-[#E7E5E4]"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => {
              setHex(e.target.value);
              onChange(e.target.value);
            }}
            className="sr-only"
          />
        </label>
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commitHex(hex)}
          maxLength={7}
          placeholder="#C8553D"
          className="w-28 h-9 px-3 rounded-md border border-[#E7E5E4] text-sm font-mono text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
        />
      </div>
      {/* Presets */}
      <div className="flex gap-1.5 flex-wrap">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => { setHex(preset); onChange(preset); }}
            title={preset}
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: preset,
              borderColor: value === preset ? '#1C1917' : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Color Mini Preview ────────────────────────────────────────────────────────

function ColorsMiniPreview({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="rounded-lg border border-[#E7E5E4] overflow-hidden">
      <div className="h-8 flex items-center px-3 gap-2" style={{ backgroundColor: '#1A1A18' }}>
        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: primary }} />
        <div className="flex-1 h-2 rounded-full bg-white/20" />
        <div
          className="px-2 py-0.5 rounded text-white text-[10px] font-bold"
          style={{ backgroundColor: primary }}
        >
          Réserver
        </div>
      </div>
      <div className="h-6 flex items-center px-3 gap-2" style={{ backgroundColor: secondary + '22' }}>
        <div className="w-16 h-2 rounded-full" style={{ backgroundColor: secondary }} />
      </div>
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function UploadZone({
  label,
  hint,
  currentUrl,
  accept,
  maxMB,
  onUpload,
  onRemove,
}: {
  label: string;
  hint?: string;
  currentUrl: string | null;
  accept: string;
  maxMB: number;
  onUpload: (file: File, onProgress: (p: number) => void) => Promise<string>;
  onRemove: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > maxMB * 1024 * 1024) {
      setError(`Le fichier dépasse ${maxMB} Mo`);
      return;
    }
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      await onUpload(file, setProgress);
    } catch {
      setError("Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#1C1917]">{label}</label>
      {currentUrl ? (
        <div className="relative rounded-lg border border-[#E7E5E4] overflow-hidden bg-[#F5F4F2]">
          <img
            src={currentUrl}
            alt={label}
            className="w-full max-h-32 object-contain p-2"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#E7E5E4] hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            <X size={12} className="text-slate-500 hover:text-red-500" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center gap-2 transition-colors ${
            isDragging
              ? 'border-terracotta bg-terracotta/5'
              : 'border-[#E7E5E4] hover:border-terracotta/50 hover:bg-[#F5F4F2]'
          }`}
        >
          <Upload size={24} className="text-slate-400" />
          <p className="text-sm text-slate-500 text-center">
            <span className="text-terracotta font-medium">Choisir</span> ou glisser-déposer
          </p>
          {hint && <p className="text-xs text-slate-400 text-center">{hint}</p>}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="sr-only"
      />
      {loading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Upload…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Logo Upload with dual background ─────────────────────────────────────────

function LogoUploadZone({
  currentUrl,
  onUploadDone,
  onRemove,
}: {
  currentUrl: string | null;
  onUploadDone: (url: string) => void;
  onRemove: () => void;
}) {
  const [darkBg, setDarkBg] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[#1C1917]">Logo</label>
        {currentUrl && (
          <button
            type="button"
            onClick={() => setDarkBg(!darkBg)}
            className="text-xs text-slate-500 hover:text-[#1C1917] flex items-center gap-1"
          >
            <Eye size={12} />
            {darkBg ? 'Fond clair' : 'Fond sombre'}
          </button>
        )}
      </div>

      {currentUrl ? (
        /* Preview mode with dual background toggle */
        <div
          className="relative rounded-lg border border-[#E7E5E4] overflow-hidden h-28 flex items-center justify-center transition-colors"
          style={{ backgroundColor: darkBg ? '#1A1A18' : '#FFFFFF' }}
        >
          <img src={currentUrl} alt="Logo" className="max-h-20 max-w-[180px] object-contain" />
          <button
            type="button"
            onClick={onRemove}
            title="Supprimer le logo"
            className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#E7E5E4] hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            <X size={12} className="text-slate-500" />
          </button>
        </div>
      ) : (
        <UploadZone
          label=""
          hint="SVG ou PNG transparent recommandé — max 2 Mo"
          currentUrl={null}
          accept="image/svg+xml,image/png,image/webp"
          maxMB={2}
          onUpload={async (file, onProgress) => {
            const url = await uploadLogo(file, onProgress);
            onUploadDone(url);
            return url;
          }}
          onRemove={onRemove}
        />
      )}

      <p className="text-xs text-slate-400">Recommandation : SVG ou PNG transparent</p>
    </div>
  );
}

// ── Panel: Contenu ────────────────────────────────────────────────────────────

function ContenuPanel({
  form,
  onChange,
}: {
  form: Partial<WebsiteSettingsData>;
  onChange: (patch: Partial<WebsiteSettingsData>) => void;
}) {
  const cc: ContentConfig = form.content_config ?? {};

  function patchContent(partial: Partial<ContentConfig>) {
    onChange({ content_config: { ...cc, ...partial } });
  }

  return (
    <div className="space-y-8">
      {/* Tagline / Description */}
      <section>
        <h3 className="text-sm font-semibold text-[#1C1917] mb-1">Tagline</h3>
        <p className="text-xs text-slate-400 mb-3">
          Sous-titre affiché dans le hero de la page d&apos;accueil.
        </p>
        <input
          type="text"
          value={cc.description ?? ''}
          onChange={(e) => patchContent({ description: e.target.value || null })}
          placeholder="Le meilleur restaurant africain de la ville…"
          className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
        />
      </section>

      {/* À propos */}
      <section>
        <h3 className="text-sm font-semibold text-[#1C1917] mb-4">Section « À propos »</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Texte de présentation
            </label>
            <textarea
              rows={4}
              value={cc.about_text ?? ''}
              onChange={(e) => patchContent({ about_text: e.target.value || null })}
              placeholder="Racontez l'histoire de votre restaurant, vos valeurs, votre cuisine…"
              className="w-full px-3 py-2.5 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Citation du chef <span className="text-xs text-slate-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              rows={2}
              value={cc.about_chef ?? ''}
              onChange={(e) => patchContent({ about_chef: e.target.value || null })}
              placeholder="« Ma cuisine, c'est l'âme de l'Afrique dans chaque assiette… »"
              className="w-full px-3 py-2.5 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta resize-none italic"
            />
          </div>

          <UploadZone
            label="Photo (chef ou restaurant)"
            hint="Recommandé format portrait 3/4 — max 3 Mo"
            currentUrl={cc.about_image_url ?? null}
            accept="image/jpeg,image/png,image/webp"
            maxMB={3}
            onUpload={async (file, onProgress) => {
              const url = await uploadAbout(file, onProgress);
              patchContent({ about_image_url: url });
              return url;
            }}
            onRemove={() => patchContent({ about_image_url: null })}
          />
        </div>
      </section>

      {/* Coordonnées */}
      <section>
        <h3 className="text-sm font-semibold text-[#1C1917] mb-1">Coordonnées</h3>
        <p className="text-xs text-slate-400 mb-4">
          Affichées dans la section Horaires &amp; Contact de la vitrine.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Adresse</label>
            <input
              type="text"
              value={cc.address ?? ''}
              onChange={(e) => patchContent({ address: e.target.value || null })}
              placeholder="12 rue des Almadies, Dakar"
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Téléphone</label>
            <input
              type="tel"
              value={cc.phone ?? ''}
              onChange={(e) => patchContent({ phone: e.target.value || null })}
              placeholder="+221 77 000 00 00"
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Email de contact</label>
            <input
              type="email"
              value={cc.email ?? ''}
              onChange={(e) => patchContent({ email: e.target.value || null })}
              placeholder="contact@monrestaurant.sn"
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sortable Section Item ─────────────────────────────────────────────────────

function SortableSectionItem({
  sectionKey,
  item,
  onToggle,
}: {
  sectionKey: string;
  item: SectionItem;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta = SECTION_META[sectionKey] ?? { label: sectionKey, emoji: '📄' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white rounded-lg border border-[#E7E5E4] px-4 py-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>

      <span className="text-base">{meta.emoji}</span>
      <span className="flex-1 text-sm font-medium text-[#1C1917]">{meta.label}</span>

      {/* Toggle switch */}
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
          item.visible ? 'bg-terracotta' : 'bg-slate-200'
        }`}
        role="switch"
        aria-checked={item.visible}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            item.visible ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

// ── SEO Preview (Google snippet) ──────────────────────────────────────────────

function SeoPreview({
  title,
  description,
  slug,
}: {
  title: string;
  description: string;
  slug: string;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://terangatable.com';
  const url = `${origin}/${slug}`;

  return (
    <div className="rounded-lg border border-[#E7E5E4] bg-white p-4">
      <p className="text-[10px] text-slate-400 font-medium mb-2 uppercase tracking-wide">
        Aperçu Google
      </p>
      <div className="space-y-1">
        <p className="text-xs text-green-700 truncate">{url}</p>
        <p className="text-base font-medium text-blue-700 leading-tight line-clamp-1 hover:underline cursor-pointer">
          {title || 'Titre de votre site'}
        </p>
        <p className="text-sm text-slate-600 leading-snug line-clamp-2">
          {description || 'La méta description de votre site apparaîtra ici dans les résultats de recherche Google.'}
        </p>
      </div>
    </div>
  );
}

// ── Panel: Apparence ──────────────────────────────────────────────────────────

function ApparencePanel({
  form,
  onChange,
}: {
  form: Partial<WebsiteSettingsData>;
  onChange: (patch: Partial<WebsiteSettingsData>) => void;
}) {
  const { data: themes = [], isLoading: themesLoading } = useThemes();

  useEffect(() => {
    if (form.font_heading) injectGoogleFont(form.font_heading);
    if (form.font_body) injectGoogleFont(form.font_body);
  }, [form.font_heading, form.font_body]);

  return (
    <div className="space-y-8">
      {/* Theme selector */}
      <section>
        <h3 className="text-sm font-semibold text-[#1C1917] mb-3">Thème</h3>
        {themesLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-lg bg-[#F5F4F2] animate-pulse" />
            ))}
          </div>
        ) : themes.length === 0 ? (
          <div className="rounded-lg border border-[#E7E5E4] bg-[#F5F4F2] p-8 text-center">
            <p className="text-sm text-slate-500">Aucun thème disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => {
              const isActive = form.theme_id === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onChange({ theme_id: theme.id })}
                  className={`relative rounded-lg border-2 overflow-hidden text-left transition-all ${
                    isActive
                      ? 'border-terracotta ring-2 ring-terracotta/20'
                      : 'border-[#E7E5E4] hover:border-slate-300'
                  }`}
                >
                  {/* Preview image or placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-[#F5F4F2] to-[#E7E5E4] flex items-center justify-center">
                    {theme.preview_url ? (
                      <img
                        src={theme.preview_url}
                        alt={theme.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🎨</span>
                    )}
                  </div>
                  <div className="px-2 py-1.5 flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-[#1C1917] truncate">{theme.name}</span>
                    {theme.is_premium && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Premium
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-terracotta rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Colors */}
      <section>
        <h3 className="text-sm font-semibold text-[#1C1917] mb-4">Couleurs</h3>
        <div className="space-y-5">
          <ColorPicker
            label="Couleur principale"
            value={form.primary_color ?? '#C8553D'}
            onChange={(v) => onChange({ primary_color: v })}
          />
          <ColorPicker
            label="Couleur secondaire"
            value={form.secondary_color ?? '#D4A843'}
            onChange={(v) => onChange({ secondary_color: v })}
          />
          <div>
            <p className="text-xs text-slate-400 mb-2">Aperçu</p>
            <ColorsMiniPreview
              primary={form.primary_color ?? '#C8553D'}
              secondary={form.secondary_color ?? '#D4A843'}
            />
          </div>
        </div>
      </section>

      {/* Fonts */}
      <section>
        <h3 className="text-sm font-semibold text-[#1C1917] mb-4">Polices</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Police des titres
            </label>
            <select
              value={form.font_heading ?? 'Plus Jakarta Sans'}
              onChange={(e) => onChange({ font_heading: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
            >
              {HEADING_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
              Police du corps
            </label>
            <select
              value={form.font_body ?? 'DM Sans'}
              onChange={(e) => onChange({ font_body: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
            >
              {BODY_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Font preview */}
          <div className="rounded-lg border border-[#E7E5E4] bg-[#F5F4F2] p-4 space-y-1">
            <p
              className="text-lg font-bold text-[#1C1917]"
              style={{ fontFamily: `'${form.font_heading ?? 'Plus Jakarta Sans'}', sans-serif` }}
            >
              TérangaTable
            </p>
            <p
              className="text-sm text-slate-500"
              style={{ fontFamily: `'${form.font_body ?? 'DM Sans'}', sans-serif` }}
            >
              Le meilleur restaurant de Dakar
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Panel: Médias ─────────────────────────────────────────────────────────────

function GalleryManager({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const [uploading, setUploading] = useState<number | null>(null);
  const MAX_SLOTS = 6;
  const slots = [...images, ...Array(Math.max(0, Math.min(1, MAX_SLOTS - images.length))).fill('')];

  async function handleFile(file: File, index: number) {
    setUploading(index);
    try {
      const url = await uploadGallery(file);
      const next = [...images];
      if (index < next.length) next[index] = url;
      else next.push(url);
      onChange(next);
    } finally {
      setUploading(null);
    }
  }

  function remove(index: number) {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#1C1917]">
        Images de galerie <span className="text-xs text-slate-400 font-normal">(max {MAX_SLOTS})</span>
      </label>
      <p className="text-xs text-slate-400">
        Ces images s&apos;affichent en priorité dans la section Galerie. Si vide, les photos de vos produits sont utilisées.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((src, i) => {
          const isFilled = !!src;
          const isLoading = uploading === i;
          return (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#E7E5E4] bg-[#F5F4F2]">
              {isFilled ? (
                <>
                  <img src={src} alt={`Galerie ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#E7E5E4] transition-colors">
                  {isLoading ? (
                    <Loader2 size={20} className="text-slate-400 animate-spin" />
                  ) : (
                    <>
                      <Plus size={18} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">Ajouter</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isLoading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file, i);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
        {images.length < MAX_SLOTS && images.length > 0 && uploading === null && (
          /* Extra "add" slot after filled ones */
          <div />
        )}
      </div>
    </div>
  );
}

function MediasPanel({
  form,
  onChange,
}: {
  form: Partial<WebsiteSettingsData>;
  onChange: (patch: Partial<WebsiteSettingsData>) => void;
}) {
  const cc: ContentConfig = form.content_config ?? {};

  function patchContent(partial: Partial<ContentConfig>) {
    onChange({ content_config: { ...cc, ...partial } });
  }

  return (
    <div className="space-y-8">
      <LogoUploadZone
        currentUrl={form.logo_url ?? null}
        onUploadDone={(url) => onChange({ logo_url: url })}
        onRemove={() => onChange({ logo_url: null })}
      />

      <UploadZone
        label="Favicon (32×32)"
        hint="Format ICO, PNG ou SVG — 32×32 px"
        currentUrl={form.favicon_url ?? null}
        accept="image/x-icon,image/png,image/svg+xml"
        maxMB={0.5}
        onUpload={async (file, onProgress) => {
          const url = await uploadFavicon(file, onProgress);
          onChange({ favicon_url: url });
          return url;
        }}
        onRemove={() => onChange({ favicon_url: null })}
      />

      <UploadZone
        label="Image hero"
        hint="Recommandé 1920×1080 px — max 5 Mo"
        currentUrl={form.hero_image_url ?? null}
        accept="image/jpeg,image/png,image/webp"
        maxMB={5}
        onUpload={async (file, onProgress) => {
          const url = await uploadHero(file, onProgress);
          onChange({ hero_image_url: url });
          return url;
        }}
        onRemove={() => onChange({ hero_image_url: null })}
      />

      <GalleryManager
        images={cc.gallery_images ?? []}
        onChange={(imgs) => patchContent({ gallery_images: imgs })}
      />
    </div>
  );
}

// ── Panel: Sections ───────────────────────────────────────────────────────────

function SectionsPanel({
  form,
  onChange,
}: {
  form: Partial<WebsiteSettingsData>;
  onChange: (patch: Partial<WebsiteSettingsData>) => void;
}) {
  const sectionsConfig = form.sections_config ?? DEFAULT_SECTIONS_CONFIG;

  const orderedKeys = useMemo(
    () =>
      Object.keys(sectionsConfig).sort(
        (a, b) =>
          (sectionsConfig[a as keyof typeof sectionsConfig]?.order ?? 0) -
          (sectionsConfig[b as keyof typeof sectionsConfig]?.order ?? 0),
      ),
    [sectionsConfig],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedKeys.indexOf(active.id as string);
    const newIndex = orderedKeys.indexOf(over.id as string);
    const newOrder = arrayMove(orderedKeys, oldIndex, newIndex);

    const updated = { ...sectionsConfig };
    newOrder.forEach((key, idx) => {
      (updated[key as keyof typeof updated] as SectionItem).order = idx;
    });
    onChange({ sections_config: updated as SectionsConfig });
  }

  function toggleSection(key: string) {
    const updated = {
      ...sectionsConfig,
      [key]: {
        ...(sectionsConfig[key as keyof typeof sectionsConfig] as SectionItem),
        visible: !(sectionsConfig[key as keyof typeof sectionsConfig] as SectionItem).visible,
      },
    };
    onChange({ sections_config: updated as SectionsConfig });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Activez, désactivez et réordonnez les sections de votre vitrine.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedKeys} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedKeys.map((key) => (
              <SortableSectionItem
                key={key}
                sectionKey={key}
                item={(sectionsConfig[key as keyof typeof sectionsConfig] as SectionItem) ?? { visible: true, order: 0 }}
                onToggle={() => toggleSection(key)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ── Panel: SEO ────────────────────────────────────────────────────────────────

function SeoPanel({
  form,
  slug,
  onChange,
}: {
  form: Partial<WebsiteSettingsData>;
  slug: string;
  onChange: (patch: Partial<WebsiteSettingsData>) => void;
}) {
  const title       = form.seo_title ?? '';
  const description = form.seo_description ?? '';
  const keywords    = form.seo_keywords ?? '';
  const ga          = form.google_analytics ?? '';

  const gaValid = ga === '' || /^G-[A-Z0-9]{6,12}$/.test(ga);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-[#1C1917]">
            Titre SEO
          </label>
          <span className={`text-xs ${title.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>
            {title.length}/60
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => onChange({ seo_title: e.target.value })}
          maxLength={70}
          placeholder="Restaurant TérangaTable — Dakar"
          className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-[#1C1917]">
            Méta description
          </label>
          <span className={`text-xs ${description.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
            {description.length}/160
          </span>
        </div>
        <textarea
          value={description}
          onChange={(e) => onChange({ seo_description: e.target.value })}
          rows={3}
          maxLength={180}
          placeholder="Découvrez notre cuisine africaine authentique au cœur de Dakar…"
          className="w-full px-3 py-2.5 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
          Mots-clés
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => onChange({ seo_keywords: e.target.value })}
          placeholder="restaurant dakar, cuisine africaine, thiéboudienne…"
          className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
          Google Analytics ID
        </label>
        <input
          type="text"
          value={ga}
          onChange={(e) => onChange({ google_analytics: e.target.value })}
          placeholder="G-XXXXXXXXXX"
          className={`w-full h-10 px-3 rounded-md border text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 transition-colors ${
            ga && !gaValid
              ? 'border-red-300 focus:border-red-400'
              : 'border-[#E7E5E4] focus:border-terracotta'
          }`}
        />
        {ga && !gaValid && (
          <p className="mt-1 text-xs text-red-500">
            Format attendu : G-XXXXXXXX (ex: G-ABC123DEF)
          </p>
        )}
      </div>

      {/* Google snippet preview */}
      <SeoPreview title={title} description={description} slug={slug} />
    </div>
  );
}

// ── Panel: Réseaux Sociaux ────────────────────────────────────────────────────

function SocialPanel({
  form,
  onChange,
}: {
  form: Partial<WebsiteSettingsData>;
  onChange: (patch: Partial<WebsiteSettingsData>) => void;
}) {
  const links = form.social_links ?? {};

  function updateLink(key: string, value: string) {
    onChange({ social_links: { ...links, [key]: value || undefined } });
  }

  const FIELDS = [
    { key: 'facebook',  label: 'Facebook URL',     icon: <Share2 size={16} />,         placeholder: 'https://facebook.com/monrestaurant' },
    { key: 'instagram', label: 'Instagram URL',    icon: <Camera size={16} />,         placeholder: 'https://instagram.com/monrestaurant' },
    { key: 'twitter',   label: 'Twitter / X URL',  icon: <Twitter size={16} />,        placeholder: 'https://x.com/monrestaurant' },
    { key: 'tiktok',    label: 'TikTok URL',       icon: <Play size={16} />,           placeholder: 'https://tiktok.com/@monrestaurant' },
    { key: 'whatsapp',  label: 'WhatsApp (numéro)',icon: <MessageCircle size={16} />,  placeholder: '+221 77 000 00 00' },
    { key: 'youtube',   label: 'YouTube URL',      icon: <Play size={16} />,           placeholder: 'https://youtube.com/@monrestaurant' },
  ];

  return (
    <div className="space-y-4">
      {FIELDS.map(({ key, label, icon, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-[#1C1917] mb-1.5">{label}</label>
          <div className="flex items-center gap-2">
            <div className="w-9 h-10 rounded-md border border-[#E7E5E4] bg-[#F5F4F2] flex items-center justify-center flex-shrink-0 text-slate-500">
              {icon}
            </div>
            <input
              type={key === 'whatsapp' ? 'tel' : 'url'}
              value={(links as Record<string, string>)[key] ?? ''}
              onChange={(e) => updateLink(key, e.target.value)}
              placeholder={placeholder}
              className="flex-1 h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Panel: Domaine ────────────────────────────────────────────────────────────

function DomainePanel({
  form,
  onChange,
}: {
  form: Partial<WebsiteSettingsData>;
  onChange: (patch: Partial<WebsiteSettingsData>) => void;
}) {
  const domain      = form.custom_domain ?? '';
  const checkDomain = useCheckDomain();

  const [checkResult, setCheckResult] = useState<{
    status: 'active' | 'pending' | 'error';
    message: string;
  } | null>(null);

  async function handleCheck() {
    if (!domain) return;
    setCheckResult(null);
    try {
      const result = await checkDomain.mutateAsync(domain);
      setCheckResult(result);
    } catch {
      setCheckResult({ status: 'error', message: 'Impossible de vérifier le domaine.' });
    }
  }

  const domainStatus = checkResult?.status ?? form.domain_status ?? null;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
          Domaine personnalisé
        </label>
        <input
          type="text"
          value={domain}
          onChange={(e) => onChange({ custom_domain: e.target.value || null })}
          placeholder="www.monrestaurant.sn"
          className="w-full h-10 px-3 rounded-md border border-[#E7E5E4] text-sm text-[#1C1917] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
        />
      </div>

      {/* CNAME instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Globe2 size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Configuration DNS</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Pointez votre enregistrement CNAME vers :
            </p>
          </div>
        </div>
        <div className="bg-white rounded-md border border-blue-200 px-3 py-2 flex items-center justify-between gap-2">
          <code className="text-sm font-mono text-blue-800">vitrine.terangatable.com</code>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText('vitrine.terangatable.com')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Copier
          </button>
        </div>
        <p className="text-xs text-blue-500">
          La propagation DNS peut prendre jusqu&apos;à 48 heures.
        </p>
      </div>

      {/* DNS status + check button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleCheck()}
          disabled={!domain || checkDomain.isPending}
          className="flex items-center gap-2 px-4 h-9 rounded-md border border-[#E7E5E4] text-sm font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors disabled:opacity-50"
        >
          {checkDomain.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Vérifier la configuration
        </button>

        {domainStatus && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              domainStatus === 'active'
                ? 'bg-green-100 text-green-700'
                : domainStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {domainStatus === 'active' ? (
              <CheckCircle2 size={12} />
            ) : domainStatus === 'error' ? (
              <AlertCircle size={12} />
            ) : (
              <Clock size={12} />
            )}
            {domainStatus === 'active'
              ? 'Actif'
              : domainStatus === 'error'
              ? 'Erreur DNS'
              : 'En attente'}
          </span>
        )}
      </div>

      {checkResult?.message && (
        <p className={`text-xs ${checkResult.status === 'error' ? 'text-red-500' : 'text-slate-500'}`}>
          {checkResult.message}
        </p>
      )}
    </div>
  );
}

// ── Preview Panel ─────────────────────────────────────────────────────────────

type PreviewSize = 375 | 768 | 1280;

function PreviewPanel({
  tenantSlug,
  previewKey,
  onRefresh,
}: {
  tenantSlug: string;
  previewKey: number;
  onRefresh: () => void;
}) {
  const [size, setSize] = useState<PreviewSize>(1280);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const vitrineUrl = tenantSlug ? `${origin}/${tenantSlug}` : '';

  const SIZE_BUTTONS: { value: PreviewSize; icon: React.ReactNode; label: string }[] = [
    { value: 375,  icon: <Smartphone size={14} />, label: 'Mobile' },
    { value: 768,  icon: <Tablet size={14} />,     label: 'Tablette' },
    { value: 1280, icon: <Monitor size={14} />,    label: 'Desktop' },
  ];

  return (
    <div className="flex flex-col h-full border-l border-[#E7E5E4] bg-[#F5F4F2]">
      {/* Preview toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E7E5E4] bg-white flex-shrink-0">
        <div className="flex gap-0.5 bg-[#F5F4F2] rounded-md p-0.5">
          {SIZE_BUTTONS.map(({ value, icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSize(value)}
              title={label}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                size === value
                  ? 'bg-white text-[#1C1917] shadow-sm'
                  : 'text-slate-500 hover:text-[#1C1917]'
              }`}
            >
              {icon}
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Rafraîchir"
          className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
        >
          <RefreshCw size={14} />
        </button>

        {vitrineUrl && (
          <a
            href={vitrineUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir dans un onglet"
            className="ml-auto w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-[#1C1917] hover:bg-[#F5F4F2] transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* iframe container */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-3">
        {vitrineUrl ? (
          <div
            className="bg-white shadow-md rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300"
            style={{ width: size === 1280 ? '100%' : size, minHeight: '100%' }}
          >
            <iframe
              key={previewKey}
              src={vitrineUrl}
              title="Aperçu vitrine"
              className="w-full border-0"
              style={{ height: '100%', minHeight: 600 }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
            <Globe2 size={40} strokeWidth={1} />
            <p className="text-sm">Aperçu non disponible</p>
            <p className="text-xs">Sauvegardez vos paramètres pour voir la vitrine</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Action Bar ────────────────────────────────────────────────────────────────

function ActionBar({
  isPublished,
  isMaintenance,
  isSaving,
  lastSaved,
  onSave,
  onToggleMaintenance,
  onPublish,
}: {
  isPublished: boolean;
  isMaintenance: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onToggleMaintenance: () => void;
  onPublish: () => void;
}) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceUpdate((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-[#E7E5E4] flex-shrink-0">
      {/* Last saved */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
        <Clock size={12} />
        <span className="truncate">
          {lastSaved
            ? `Dernière sauvegarde ${formatRelativeTime(lastSaved)}`
            : 'Modifications non sauvegardées'}
        </span>
      </div>

      <div className="flex-1" />

      {/* Maintenance toggle */}
      <button
        type="button"
        onClick={onToggleMaintenance}
        className={`flex items-center gap-2 px-3 h-9 rounded-md border text-sm font-medium transition-colors ${
          isMaintenance
            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-[#E7E5E4] text-slate-600 hover:bg-[#F5F4F2]'
        }`}
      >
        {isMaintenance ? <EyeOff size={14} /> : <Eye size={14} />}
        <span className="hidden sm:inline">
          {isMaintenance ? 'Fin maintenance' : 'Maintenance'}
        </span>
      </button>

      {/* Save */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-2 px-4 h-9 rounded-md border border-[#E7E5E4] text-sm font-medium text-[#1C1917] hover:bg-[#F5F4F2] transition-colors disabled:opacity-60"
      >
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Sauvegarder
      </button>

      {/* Publish */}
      <button
        type="button"
        onClick={onPublish}
        disabled={isSaving}
        className={`flex items-center gap-2 px-4 h-9 rounded-md text-sm font-semibold transition-colors disabled:opacity-60 ${
          isPublished
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-terracotta text-white hover:bg-terracotta-dark'
        }`}
      >
        {isPublished ? <CheckCircle2 size={14} /> : <Globe2 size={14} />}
        {isPublished ? 'En ligne' : 'Publier'}
      </button>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-fade-in-up ${
        type === 'success' ? 'bg-green-600' : 'bg-red-500'
      }`}
    >
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      {message}
      <button type="button" onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WebsitePage() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('apparence');
  const [form, setForm] = useState<Partial<WebsiteSettingsData>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const initializedRef = useRef(false);

  const { data: settings, isLoading } = useWebsiteSettings();
  const updateSettings = useUpdateWebsiteSettings();
  const publishWebsite = usePublishWebsite();
  const unpublishWebsite = useUnpublishWebsite();

  // Populate form once settings load
  useEffect(() => {
    if (settings && !initializedRef.current) {
      setForm(settings);
      initializedRef.current = true;
    }
  }, [settings]);

  function patchForm(patch: Partial<WebsiteSettingsData>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  const tenantSlug = settings?.tenant_slug ?? '';
  const isPublished   = form.is_published ?? false;
  const isMaintenance = form.is_maintenance ?? false;

  // After save → refresh preview after 1s debounce
  const debouncedPreviewRefresh = useDebounce(lastSaved, 1000);
  useEffect(() => {
    if (debouncedPreviewRefresh) {
      setPreviewKey((k) => k + 1);
    }
  }, [debouncedPreviewRefresh]);

  async function handleSave() {
    try {
      await updateSettings.mutateAsync(form as WebsiteSettingsPatch);
      setLastSaved(new Date());
      setToast({ message: 'Paramètres sauvegardés', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la sauvegarde', type: 'error' });
    }
  }

  async function handleToggleMaintenance() {
    const next = !isMaintenance;
    patchForm({ is_maintenance: next });
    try {
      await updateSettings.mutateAsync({ is_maintenance: next });
      setLastSaved(new Date());
      setToast({
        message: next ? 'Mode maintenance activé' : 'Mode maintenance désactivé',
        type: 'success',
      });
    } catch {
      patchForm({ is_maintenance: !next });
      setToast({ message: 'Erreur', type: 'error' });
    }
  }

  async function handlePublish() {
    if (isPublished) {
      try {
        await unpublishWebsite.mutateAsync();
        patchForm({ is_published: false });
        setToast({ message: 'Site dépublié', type: 'success' });
      } catch {
        setToast({ message: 'Erreur lors de la dépublication', type: 'error' });
      }
    } else {
      // Save first then publish
      try {
        await updateSettings.mutateAsync(form as WebsiteSettingsPatch);
        await publishWebsite.mutateAsync();
        patchForm({ is_published: true });
        setLastSaved(new Date());
        setToast({ message: 'Votre site est en ligne ! 🎉 Lien : /' + tenantSlug, type: 'success' });
      } catch {
        setToast({ message: 'Erreur lors de la publication', type: 'error' });
      }
    }
  }

  const isSaving = updateSettings.isPending || publishWebsite.isPending || unpublishWebsite.isPending;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <div className="invisible h-[calc(100vh-56px-32px)]" />
        <div className="fixed top-14 left-0 lg:left-[260px] right-0 bottom-0 z-20 flex items-center justify-center bg-[#FAFAF8]">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">Chargement des paramètres…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Height placeholder to avoid empty scroll in main area */}
      <div className="invisible h-[calc(100vh-56px-32px)]" aria-hidden="true" />

      {/* ── Editor overlay ── */}
      <div className="fixed top-14 left-0 lg:left-[260px] right-0 bottom-0 z-20 flex flex-col bg-[#FAFAF8]">

        {/* ── 3-panel area ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── LEFT — Section navigation ── */}
          <nav className="w-56 flex-shrink-0 bg-white border-r border-[#E7E5E4] overflow-y-auto flex flex-col">
            <div className="px-4 py-4 border-b border-[#E7E5E4]">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Site vitrine
              </h2>
              {isPublished && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  En ligne
                </span>
              )}
            </div>
            <div className="flex-1 py-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-terracotta/10 text-terracotta font-medium border-r-2 border-terracotta'
                        : 'text-slate-600 hover:bg-[#F5F4F2] hover:text-[#1C1917]'
                    }`}
                  >
                    <span className={isActive ? 'text-terracotta' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                    {isActive && <ChevronRight size={14} className="ml-auto text-terracotta/60" />}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ── CENTER — Form ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-lg mx-auto px-6 py-6">
              {activeSection === 'apparence' && (
                <ApparencePanel form={form} onChange={patchForm} />
              )}
              {activeSection === 'contenu' && (
                <ContenuPanel form={form} onChange={patchForm} />
              )}
              {activeSection === 'medias' && (
                <MediasPanel form={form} onChange={patchForm} />
              )}
              {activeSection === 'sections' && (
                <SectionsPanel form={form} onChange={patchForm} />
              )}
              {activeSection === 'seo' && (
                <SeoPanel form={form} slug={tenantSlug} onChange={patchForm} />
              )}
              {activeSection === 'social' && (
                <SocialPanel form={form} onChange={patchForm} />
              )}
              {activeSection === 'domaine' && (
                <DomainePanel form={form} onChange={patchForm} />
              )}
            </div>
          </div>

          {/* ── RIGHT — Preview ── */}
          <div className="w-80 flex-shrink-0 hidden xl:flex flex-col">
            <PreviewPanel
              tenantSlug={tenantSlug}
              previewKey={previewKey}
              onRefresh={() => setPreviewKey((k) => k + 1)}
            />
          </div>
        </div>

        {/* ── Action bar ── */}
        <ActionBar
          isPublished={isPublished}
          isMaintenance={isMaintenance}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onSave={() => void handleSave()}
          onToggleMaintenance={() => void handleToggleMaintenance()}
          onPublish={() => void handlePublish()}
        />
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
