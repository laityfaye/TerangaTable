'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/vitrine-api';
import type { VitrineCategory, VitrineProduct } from '@/types/vitrine';

// ── Types ─────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'vegan' | 'sans-gluten' | 'halal' | 'vegetarien';
type OrderType = 'takeaway' | 'online' | 'dine_in';

interface CartItem {
  product: VitrineProduct;
  quantity: number;
}

interface Props {
  categories: VitrineCategory[];
  currencySymbol: string;
  slug: string;
  primaryColor: string;
  restaurantName: string;
  heroImageUrl: string | null;
  logoUrl: string | null;
  /** Numéro de table issu du QR code — ex: "12" ou "Terrasse A" */
  tableNumber?: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all',         label: 'Tout',        icon: '✦'  },
  { key: 'halal',       label: 'Halal',       icon: '☽'  },
  { key: 'vegan',       label: 'Vegan',       icon: '🌿' },
  { key: 'vegetarien',  label: 'Végétarien',  icon: '🥗' },
  { key: 'sans-gluten', label: 'Sans gluten', icon: '⚡' },
];

const ALLERGEN_LABELS: Record<string, { icon: string; label: string }> = {
  gluten:        { icon: '🌾', label: 'Gluten' },
  lait:          { icon: '🥛', label: 'Lait' },
  oeufs:         { icon: '🥚', label: 'Œufs' },
  arachides:     { icon: '🥜', label: 'Arachides' },
  poisson:       { icon: '🐟', label: 'Poisson' },
  soja:          { icon: '🫘', label: 'Soja' },
  fruits_de_mer: { icon: '🦐', label: 'Fruits de mer' },
  noix:          { icon: '🌰', label: 'Noix' },
};

function matchesFilter(product: VitrineProduct, filter: Filter): boolean {
  if (filter === 'all') return true;
  const tags = product.tags.map((t) => t.toLowerCase());
  const mapping: Record<Exclude<Filter, 'all'>, string[]> = {
    vegan:         ['vegan', 'végétalien'],
    'sans-gluten': ['sans gluten', 'gluten free', 'gluten-free'],
    halal:         ['halal'],
    vegetarien:    ['végétarien', 'vegetarien', 'végé'],
  };
  return mapping[filter].some((kw) => tags.some((t) => t.includes(kw)));
}

function matchesSearch(product: VitrineProduct, catName: string, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase().trim();
  return (
    product.name.toLowerCase().includes(lower) ||
    (product.description ?? '').toLowerCase().includes(lower) ||
    product.tags.some((t) => t.toLowerCase().includes(lower)) ||
    catName.toLowerCase().includes(lower)
  );
}

// Highlight matching text within a string
function Highlight({ text, query, color }: { text: string; query: string; color: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ backgroundColor: `${color}35`, color, borderRadius: 3, padding: '0 1px' }}>
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

// ── Animation config ─────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const heroItem = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};
const navContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};
const navItem = {
  hidden:  { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const catHeaderVars = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const catHeaderItem = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const cardGridVars = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const cardItemVars = {
  hidden:  { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

// ── Daily Dishes Carousel ─────────────────────────────────────────────────────

const CARD_W   = 200;
const CARD_H   = Math.round(CARD_W * 4 / 3); // 267 px — portrait 3:4
const CARD_GAP = 14;

function DailyDishesCarousel({
  products,
  currencySymbol,
  primaryColor,
  onProductClick,
}: {
  products: VitrineProduct[];
  currencySymbol: string;
  primaryColor: string;
  onProductClick: (product: VitrineProduct) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cw, setCw] = useState(0); // container width — 0 = not yet measured

  /* ── Measure container width (SSR-safe) ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setCw(el.offsetWidth));
    obs.observe(el);
    setCw(el.offsetWidth);
    return () => obs.disconnect();
  }, []);

  /* ── Transform-based centering:
       trackX = center of container  − half a card  − (index × step) ── */
  const trackX = cw > 0
    ? cw / 2 - CARD_W / 2 - activeIndex * (CARD_W + CARD_GAP)
    : 0;

  /* ── Auto-play ── */
  const startAutoPlay = useCallback(() => {
    if (products.length <= 1) return;
    intervalRef.current = setInterval(
      () => setActiveIndex((p) => (p + 1) % products.length),
      3800,
    );
  }, [products.length]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => { startAutoPlay(); return stopAutoPlay; }, [startAutoPlay, stopAutoPlay]);

  if (products.length === 0) return null;

  return (
    <motion.div variants={heroItem} className="w-full select-none">

      {/* ── Pill badge ── */}
      <div className="flex justify-center mb-5">
        <motion.span
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.22em] font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`,
            boxShadow:  `0 4px 22px ${primaryColor}70, inset 0 1px 0 rgba(255,255,255,0.22)`,
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <motion.svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden
            animate={{ rotate: [0, 20, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </motion.svg>
          Plats du jour
          <motion.svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden
            animate={{ rotate: [0, -20, 20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </motion.svg>
        </motion.span>
      </div>

      {/* ── Slider track ── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: CARD_H + 20, opacity: cw > 0 ? 1 : 0, transition: 'opacity 0.3s' }}
        onMouseEnter={stopAutoPlay}
        onMouseLeave={startAutoPlay}
        onTouchStart={stopAutoPlay}
        onTouchEnd={startAutoPlay}
      >
        <motion.div
          className="absolute inset-y-0 flex items-center"
          style={{ gap: CARD_GAP }}
          animate={{ x: trackX }}
          transition={{ type: 'spring', damping: 36, stiffness: 270 }}
        >
          {products.map((product, i) => {
            const imageSrc = product.imageUrl
              ?? (Array.isArray(product.images) ? product.images[0] : null)
              ?? null;
            const isActive = activeIndex === i;

            return (
              <motion.button
                key={product.id}
                /* Active → open modal · Inactive → jump to that slide */
                onClick={() => isActive ? onProductClick(product) : setActiveIndex(i)}
                aria-label={isActive ? `Commander ${product.name}` : `Voir ${product.name}`}
                className="group relative shrink-0 rounded-2xl overflow-hidden focus:outline-none"
                style={{ width: CARD_W, height: CARD_H, flexShrink: 0 }}
                animate={{
                  scale:   isActive ? 1 : 0.84,
                  opacity: isActive ? 1 : 0.45,
                  y:       isActive ? 0 : 10,
                }}
                transition={{ duration: 0.45, ease: EASE }}
                whileTap={isActive ? { scale: 0.96 } : { opacity: 0.65 }}
              >
                {/* ── Card frame ── */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{
                    border: `1.5px solid ${isActive ? primaryColor : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: isActive
                      ? `0 20px 56px ${primaryColor}55, 0 4px 24px rgba(0,0,0,0.7)`
                      : '0 4px 14px rgba(0,0,0,0.45)',
                    transition: 'border-color 0.4s, box-shadow 0.4s',
                  }}
                >
                  {imageSrc ? (
                    <>
                      <Image
                        src={imageSrc}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-600 group-hover:scale-[1.07]"
                        sizes="210px"
                      />

                      {/* Deep bottom gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent"
                        style={{ '--tw-gradient-from-position': '0%', '--tw-gradient-via-position': '52%' } as React.CSSProperties} />

                      {/* Info strip */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
                        <p
                          className="text-white text-sm font-bold leading-tight line-clamp-2 mb-1"
                          style={{ fontFamily: 'var(--font-heading)', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
                        >
                          {product.name}
                        </p>
                        <p className="text-[12px] font-mono font-bold" style={{ color: primaryColor }}>
                          {formatPrice(product.basePrice, currencySymbol)}
                        </p>
                      </div>

                      {/* Hover CTA — active card only */}
                      {isActive && (
                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: 'rgba(0,0,0,0.42)' }}
                        >
                          <span
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold tracking-wide"
                            style={{ background: primaryColor, boxShadow: `0 6px 24px ${primaryColor}70` }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Commander
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── No image fallback ── */
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5"
                      style={{ background: `linear-gradient(160deg, ${primaryColor}22, ${primaryColor}07)` }}
                    >
                      <span className="text-5xl" aria-hidden>🍽️</span>
                      <p
                        className="text-white text-sm font-semibold text-center leading-snug line-clamp-3"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {product.name}
                      </p>
                      <p className="text-xs font-mono font-bold" style={{ color: primaryColor }}>
                        {formatPrice(product.basePrice, currencySymbol)}
                      </p>
                      {isActive && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1">
                          <span
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold"
                            style={{ background: primaryColor }}
                          >
                            Commander
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* ── Navigation dots ── */}
      {products.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => { stopAutoPlay(); setActiveIndex(i); startAutoPlay(); }}
              aria-label={`Plat ${i + 1}`}
              className="rounded-full transition-all duration-300 focus:outline-none"
              style={{
                width:  activeIndex === i ? 22 : 6,
                height: 6,
                background: activeIndex === i ? primaryColor : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Table Banner ──────────────────────────────────────────────────────────────

function TableBanner({ tableNumber, primaryColor }: { tableNumber: string; primaryColor: string }) {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2.5 py-2.5 px-4"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}F0, ${primaryColor}D0)`,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 2px 20px ${primaryColor}50`,
      }}
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260, delay: 0.3 }}
    >
      {/* Icône table */}
      <svg className="w-4 h-4 text-white/90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h18M3 14h18M10 3v18M14 3v18" />
      </svg>
      <span className="text-white font-semibold text-sm tracking-wide">
        Table&nbsp;<span className="font-bold">{tableNumber}</span>
      </span>
      <span className="text-white/70 text-xs ml-1">· Commande sur place</span>
    </motion.div>
  );
}

// ── Product Modal ─────────────────────────────────────────────────────────────

function ProductModal({
  product,
  currencySymbol,
  primaryColor,
  onClose,
  onAddToCart,
}: {
  product: VitrineProduct;
  currencySymbol: string;
  primaryColor: string;
  onClose: () => void;
  onAddToCart: (product: VitrineProduct) => void;
}) {
  const imageSrc = product.imageUrl ?? (Array.isArray(product.images) ? product.images[0] : null) ?? null;
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) onAddToCart(product);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 w-full max-w-lg bg-[#1A1A18] rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        {/* Image */}
        {imageSrc ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image src={imageSrc} alt={product.name} fill className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A18] to-transparent" />
          </div>
        ) : (
          <div
            className="aspect-[16/9] flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}08)` }}
          >
            <svg className="w-16 h-16 opacity-20" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#F7F4F0] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {product.name}
            </h2>
            <span className="text-xl font-mono font-bold shrink-0" style={{ color: primaryColor }}>
              {formatPrice(product.basePrice, currencySymbol)}
            </span>
          </div>

          {product.description && (
            <p className="text-[#B8B4B0] text-sm leading-relaxed">{product.description}</p>
          )}

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor, border: `1px solid ${primaryColor}40` }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.allergens?.length > 0 && (
            <div>
              <p className="text-[#8A8682] text-xs uppercase tracking-widest mb-2">Allergènes</p>
              <div className="flex flex-wrap gap-2">
                {product.allergens.map((a) => {
                  const info = ALLERGEN_LABELS[a.toLowerCase()];
                  return (
                    <div key={a} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/15 text-xs text-[#C8C4C0]">
                      <span>{info?.icon ?? '⚠️'}</span>
                      <span>{info?.label ?? a}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3 pt-2">
            {/* Qty stepper */}
            <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors hover:bg-white/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-8 text-center text-white font-semibold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors hover:bg-white/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Add button */}
            <motion.button
              onClick={handleAdd}
              className="flex-1 group relative flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold overflow-hidden"
              style={{ backgroundColor: primaryColor }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)' }} />
              <svg className="relative w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="relative">
                Ajouter — {formatPrice(parseFloat(product.basePrice.toString()) * qty, currencySymbol)}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Close */}
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({
  cart,
  currencySymbol,
  primaryColor,
  slug,
  tableNumber,
  onClose,
  onUpdateQty,
  onRemove,
  onClearCart,
}: {
  cart: CartItem[];
  currencySymbol: string;
  primaryColor: string;
  slug: string;
  tableNumber?: string | null | undefined;
  onClose: () => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onClearCart: () => void;
}) {
  // Si QR code (dine_in), on force le mode "sur place" et on le verrouille
  const isDineIn = !!tableNumber;
  const [orderType, setOrderType] = useState<OrderType>(isDineIn ? 'dine_in' : 'takeaway');
  const [name, setName]                   = useState('');
  const [phone, setPhone]                 = useState('');
  const [notes, setNotes]                 = useState('');
  const [manualTableNumber, setManualTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    order_number: string;
    total: string;
    orderType: OrderType;
    tableNum: string | undefined;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/v1';

  const total = cart.reduce(
    (sum, item) => sum + parseFloat(item.product.basePrice.toString()) * item.quantity,
    0,
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  // Détermine si le mode actuel nécessite un nom ou un numéro de table
  const needsName       = isDineIn || orderType === 'online';
  const needsTableInput = !isDineIn && (orderType === 'dine_in' || orderType === 'takeaway');

  const handleSubmit = async () => {
    if (needsName && !name.trim()) {
      setError('Veuillez saisir votre nom');
      return;
    }
    if (needsTableInput && !manualTableNumber.trim()) {
      setError('Veuillez saisir le numéro de table');
      return;
    }
    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    const tableNum = isDineIn
      ? (tableNumber ?? undefined)
      : needsTableInput
        ? manualTableNumber.trim()
        : undefined;

    try {
      const res = await fetch(`${API_URL}/public/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:           orderType,
          customer_name:  needsName ? name.trim() : undefined,
          customer_phone: needsName ? (phone.trim() || undefined) : undefined,
          table_number:   tableNum,
          notes:          notes.trim() || undefined,
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity:   item.quantity,
          })),
        }),
      });

      const json = await res.json() as { data?: { order_number: string; total: string }; order_number?: string; total?: string };
      if (!res.ok) throw new Error((json as { message?: string }).message ?? 'Erreur lors de la commande');

      const data = json.data ?? (json as { order_number: string; total: string });
      setConfirmed({
        order_number: data.order_number,
        total: data.total,
        orderType,
        tableNum,
      });
      onClearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className="relative ml-auto w-full max-w-md h-full flex flex-col bg-[#141412] shadow-2xl"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-[#F7F4F0] font-semibold">Mon panier</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}>
              {cart.reduce((n, i) => n + i.quantity, 0)}
            </span>
          </div>
          {/* Badge table dans le header du drawer */}
          {isDineIn && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${primaryColor}25`, color: primaryColor, border: `1px solid ${primaryColor}40` }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
              </svg>
              Table {tableNumber}
            </div>
          )}
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/8 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Confirmation screen ── */}
        <AnimatePresence>
          {confirmed && (
            <motion.div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center"
              style={{ background: '#141412' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 24, stiffness: 240 }}
            >
              {/* Check circle */}
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: `${primaryColor}18`, border: `2px solid ${primaryColor}` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 16, stiffness: 200, delay: 0.1 }}
              >
                <svg className="w-10 h-10" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <motion.h3
                className="text-2xl font-bold text-[#F7F4F0] mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Commande confirmée !
              </motion.h3>

              <motion.p
                className="text-[#9A9692] text-sm mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Votre commande <span className="font-mono font-semibold text-[#F7F4F0]">#{confirmed.order_number}</span> a bien été reçue.
              </motion.p>

              {confirmed.tableNum && (
                <motion.p
                  className="text-[#9A9692] text-sm mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.33 }}
                >
                  {confirmed.orderType === 'online'
                    ? <>Livraison en cours de préparation.</>
                    : <>Elle sera servie à la <span className="font-semibold text-[#F7F4F0]">Table {confirmed.tableNum}</span>.</>
                  }
                </motion.p>
              )}

              <motion.p
                className="text-[#9A9692] text-sm mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                Total : <span className="font-semibold" style={{ color: primaryColor }}>
                  {formatPrice(parseFloat(confirmed.total), currencySymbol)}
                </span>
              </motion.p>

              <motion.button
                onClick={onClose}
                className="px-8 py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: primaryColor }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Fermer
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <span className="text-5xl opacity-30">🛒</span>
              <p className="text-[#6A6A68] text-sm">Votre panier est vide.<br />Ajoutez des plats pour commander.</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              {cart.map((item) => {
                const img = item.product.imageUrl ?? (Array.isArray(item.product.images) ? item.product.images[0] : null) ?? null;
                return (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3 py-3 border-b border-white/6"
                  >
                    {/* Thumbnail */}
                    {img ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                        <Image src={img} alt={item.product.name} width={56} height={56} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ background: `${primaryColor}15` }}>
                        <span style={{ color: primaryColor }} className="text-xl">🍽️</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F7F4F0] text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs font-mono" style={{ color: primaryColor }}>
                        {formatPrice(parseFloat(item.product.basePrice.toString()) * item.quantity, currencySymbol)}
                      </p>
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                      <button
                        onClick={() => item.quantity === 1 ? onRemove(item.product.id) : onUpdateQty(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors hover:bg-white/5 text-lg leading-none"
                      >
                        {item.quantity === 1 ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        ) : '−'}
                      </button>
                      <span className="w-7 text-center text-[#F7F4F0] text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors hover:bg-white/5"
                      >+</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — checkout form */}
        {cart.length > 0 && !confirmed && (
          <div className="border-t border-white/8 px-5 py-5 space-y-4">

            {/* ── Sélecteur de mode de commande ── */}
            {isDineIn ? (
              /* Mode QR code : table verrouillée */
              <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl"
                style={{ backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}>
                <svg className="w-4 h-4" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
                </svg>
                <span className="text-sm font-medium" style={{ color: primaryColor }}>
                  🍽️ Sur place — Table {tableNumber}
                </span>
              </div>
            ) : (
              /* Mode direct : 3 options */
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { type: 'dine_in'  as OrderType, icon: '🍽️', label: 'Sur place'  },
                  { type: 'takeaway' as OrderType, icon: '🥡', label: 'À emporter' },
                  { type: 'online'   as OrderType, icon: '🛵', label: 'Livraison'  },
                ]).map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => { setOrderType(type); setError(null); }}
                    className="py-2.5 rounded-xl text-xs font-medium transition-all duration-200 flex flex-col items-center gap-0.5"
                    style={orderType === type
                      ? { backgroundColor: primaryColor, color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#9A9692', border: '1px solid rgba(255,255,255,0.10)' }
                    }
                  >
                    <span className="text-base leading-none">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Champ numéro de table (Sur place / À emporter sans QR code) ── */}
            {needsTableInput && (
              <div>
                <label className="text-xs text-[#9A9692] mb-1.5 block">Numéro de table *</label>
                <input
                  value={manualTableNumber}
                  onChange={(e) => setManualTableNumber(e.target.value)}
                  placeholder="Ex : 12, Terrasse A…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F7F4F0] placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            )}

            {/* ── Champs Livraison + mode QR code (nom, téléphone, notes) ── */}
            {needsName && (
              <>
                <div>
                  <label className="text-xs text-[#9A9692] mb-1.5 block">Votre nom *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prénom et nom"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F7F4F0] placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#9A9692] mb-1.5 block">Téléphone (optionnel)</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    type="tel"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F7F4F0] placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#9A9692] mb-1.5 block">Note (optionnel)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Allergies, instructions spéciales…"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F7F4F0] placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  />
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs px-1">{error}</p>
            )}

            {/* Total + Submit */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#9A9692] text-sm">Total</span>
              <span className="text-lg font-mono font-bold" style={{ color: primaryColor }}>
                {formatPrice(total, currencySymbol)}
              </span>
            </div>

            <motion.button
              onClick={handleSubmit}
              disabled={loading || (needsName ? !name.trim() : !manualTableNumber.trim())}
              className="w-full group relative flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-base overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)' }} />
              {loading ? (
                <svg className="relative w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="relative w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="relative">{loading ? 'Envoi en cours...' : 'Confirmer la commande'}</span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  currencySymbol,
  primaryColor,
  onClick,
}: {
  product: VitrineProduct;
  currencySymbol: string;
  primaryColor: string;
  onClick: () => void;
}) {
  const imageSrc = product.imageUrl ?? (Array.isArray(product.images) ? product.images[0] : null) ?? null;

  if (imageSrc) {
    return (
      <motion.button
        onClick={onClick}
        className="group w-full text-left rounded-xl overflow-hidden"
        style={{ background: '#1A1A18', border: '1px solid rgba(255,255,255,0.07)' }}
        whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(0,0,0,0.55)' }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src={imageSrc} alt={product.name} fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy" placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-white text-sm font-mono font-semibold"
            style={{ backgroundColor: primaryColor }}>
            {formatPrice(product.basePrice, currencySymbol)}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-400 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-[#F7F4F0] leading-snug line-clamp-1" style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[#A09C98] text-xs leading-relaxed line-clamp-2">{product.description}</p>
          )}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {product.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className="group w-full text-left p-5 rounded-xl"
      style={{ background: '#1A1A18', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${primaryColor}` }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', x: 2 }}
      whileTap={{ scale: 0.98, y: 0, x: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-[#F7F4F0] leading-snug group-hover:text-white transition-colors"
          style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
          {product.name}
        </h3>
        <span className="font-mono text-sm font-bold shrink-0 tabular-nums" style={{ color: primaryColor }}>
          {formatPrice(product.basePrice, currencySymbol)}
        </span>
      </div>
      {product.description && (
        <p className="text-[#A09C98] text-xs leading-relaxed line-clamp-2 mb-2">{product.description}</p>
      )}
      {product.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {product.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}>{tag}</span>
          ))}
        </div>
      )}
    </motion.button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MenuClient({
  categories,
  currencySymbol,
  primaryColor,
  restaurantName,
  heroImageUrl,
  logoUrl,
  slug,
  tableNumber,
}: Props) {
  const [activeFilter, setActiveFilter]         = useState<Filter>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id ?? '');
  const [selectedProduct, setSelectedProduct]   = useState<VitrineProduct | null>(null);
  const [scrolled, setScrolled]                 = useState(false);
  const [navReady, setNavReady]                 = useState(false);
  const [cart, setCart]                         = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]                 = useState(false);
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchOpen, setSearchOpen]             = useState(false);

  const sectionRefs    = useRef<Record<string, HTMLElement | null>>({});
  const navRef         = useRef<HTMLDivElement>(null);
  const observerRef    = useRef<IntersectionObserver | null>(null);
  const isManualScroll = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setNavReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isManualScroll.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategoryId(entry.target.id.replace('menu-cat-', ''));
            break;
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observerRef.current!.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [categories]);

  useEffect(() => {
    if (!navRef.current) return;
    const btn = navRef.current.querySelector<HTMLButtonElement>(`[data-cat="${activeCategoryId}"]`);
    btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeCategoryId]);

  const scrollToCategory = useCallback((id: string) => {
    setActiveCategoryId(id);
    isManualScroll.current = true;
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 128;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => { isManualScroll.current = false; }, 800);
    }
  }, []);

  // ── Cart handlers ──────────────────────────────────────────────────────────

  const addToCart = useCallback((product: VitrineProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  /* ── Plats du jour : produits isFeatured ── */
  const featuredProducts = categories
    .flatMap((cat) => cat.products)
    .filter((p) => p.isFeatured);

  const filteredCategories = categories
    .map((cat) => ({ ...cat, products: cat.products.filter((p) => matchesFilter(p, activeFilter)) }))
    .filter((cat) => cat.products.length > 0);

  const totalVisible = filteredCategories.reduce((n, c) => n + c.products.length, 0);
  const cartCount    = cart.reduce((n, i) => n + i.quantity, 0);
  const cartTotal    = cart.reduce((s, i) => s + parseFloat(i.product.basePrice.toString()) * i.quantity, 0);

  // Search results — flat list across all categories
  const searchResults: Array<{ product: VitrineProduct; catName: string }> =
    searchQuery.trim()
      ? categories.flatMap((cat) =>
          cat.products
            .filter((p) => matchesSearch(p, cat.name, searchQuery))
            .map((p) => ({ product: p, catName: cat.name })),
        )
      : [];

  const isSearching = searchQuery.trim().length > 0;

  // Open search → focus input on next frame
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchQuery('');
    setSearchOpen(false);
  }, []);

  return (
    <>
      {/* ── Bannière table (QR code) ── */}
      {tableNumber && (
        <TableBanner tableNumber={tableNumber} primaryColor={primaryColor} />
      )}

      <div className="min-h-screen" style={{ background: '#0D0D0B' }}>

        {/* ── Page hero ──
             Stratégie : les fonds sont en absolute, le CONTENU est en flux normal (relative z-10).
             Le parent prend la hauteur du contenu → plus jamais de coupure.
        ── */}
        <div
          className="relative overflow-hidden"
          style={{ paddingTop: tableNumber ? '48px' : undefined }}
        >
          {/* Fond photo ou dégradé */}
          {heroImageUrl ? (
            <Image src={heroImageUrl} alt={restaurantName} fill
              className="object-cover animate-ken-burns" sizes="100vw" priority />
          ) : (
            <div className="absolute inset-0 animate-ken-burns"
              style={{ background: `linear-gradient(160deg, #1A1A18 0%, #2A1710 50%, #0D0D0B 100%)` }} />
          )}
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-[#0D0D0B]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          <div className="grain-layer" aria-hidden="true" />

          {/*
           * Contenu en flux NORMAL (relative z-10, pas absolute inset-0).
           * → Le parent s'étire pour l'accueillir, rien n'est jamais coupé.
           * paddingTop = navbar 64px + marge 32px = 96px
           */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-4 text-center"
            style={{
              paddingTop:    tableNumber ? '112px' : '96px',
              paddingBottom: featuredProducts.length > 0 ? '28px' : '56px',
              minHeight:     featuredProducts.length === 0 ? '58svh' : undefined,
            }}
            variants={heroContainer} initial="hidden" animate="visible"
          >
            {/* ── Decorative label ── */}
            <motion.div variants={heroItem} className="flex justify-center mb-3">
              <motion.span
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.22em] font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`,
                  boxShadow:  `0 4px 22px ${primaryColor}70, inset 0 1px 0 rgba(255,255,255,0.22)`,
                }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <motion.svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden
                  animate={{ rotate: [0, 20, -20, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </motion.svg>
                {tableNumber ? `Table ${tableNumber}` : 'Notre Carte'}
                <motion.svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden
                  animate={{ rotate: [0, -20, 20, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </motion.svg>
              </motion.span>
            </motion.div>

            {/* ── Restaurant name ── */}
            <motion.h1 variants={heroItem}
              className="text-4xl sm:text-6xl font-bold text-white leading-tight"
              style={{ fontFamily: 'var(--font-heading)', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
              {restaurantName}
            </motion.h1>

            {/* ── Count ── */}
            <motion.p variants={heroItem} className="text-white/60 text-sm mt-3 tracking-wide">
              {categories.length} catégorie{categories.length > 1 ? 's' : ''}&nbsp;·&nbsp;
              {categories.reduce((n, c) => n + c.products.length, 0)} plat{categories.reduce((n, c) => n + c.products.length, 0) > 1 ? 's' : ''}
            </motion.p>

            {/* ── Espace entre titre et carousel ── */}
            <div style={{ height: 32 }} aria-hidden />

            {/* ── Carousel plats du jour ── */}
            {featuredProducts.length > 0 && (
              <DailyDishesCarousel
                products={featuredProducts}
                currencySymbol={currencySymbol}
                primaryColor={primaryColor}
                onProductClick={setSelectedProduct}
              />
            )}

            {/* ── Scroll indicator ── */}
            <motion.div variants={heroItem}
              className="mt-6 flex flex-col items-center gap-1.5 opacity-55">
              <span className="text-white text-[10px] uppercase tracking-[0.2em]">Parcourir</span>
              <motion.svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Sticky nav ── */}
        <motion.div
          className="sticky top-16 z-30 transition-colors duration-300"
          style={{
            top: tableNumber ? '44px' : undefined,
            background: scrolled ? 'rgba(13,13,11,0.97)' : 'rgba(13,13,11,0.88)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: navReady ? 1 : 0, y: navReady ? 0 : -8 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="max-w-6xl mx-auto">

            {/* ── Search bar (animated expand) ── */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  key="search-bar"
                  className="px-4 sm:px-6 pt-3 pb-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: `1px solid ${isSearching ? primaryColor + '60' : 'rgba(255,255,255,0.12)'}`,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Loupe */}
                    <svg className="w-4 h-4 shrink-0" style={{ color: isSearching ? primaryColor : '#6A6A68' }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>

                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                      placeholder="Rechercher un plat, une catégorie, un tag…"
                      className="flex-1 bg-transparent text-sm text-[#F7F4F0] placeholder-white/30 focus:outline-none"
                    />

                    {/* Count badge */}
                    {isSearching && (
                      <motion.span
                        key={searchResults.length}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xs font-mono px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                      >
                        {searchResults.length}
                      </motion.span>
                    )}

                    {/* Clear */}
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')}
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    {/* Close search mode */}
                    <button onClick={closeSearch}
                      className="shrink-0 text-xs text-white/40 hover:text-white/70 transition-colors ml-1">
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Category tabs + search toggle ── */}
            <div className={`flex items-center ${searchOpen ? 'opacity-40 pointer-events-none' : ''} transition-opacity duration-200`}>
              <motion.div ref={navRef}
                className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide px-4 sm:px-6 pt-3 pb-1"
                variants={navContainer} initial="hidden" animate={navReady ? 'visible' : 'hidden'}>
                {categories.map((cat) => {
                  const isActive = activeCategoryId === cat.id;
                  return (
                    <motion.button key={cat.id} data-cat={cat.id}
                      onClick={() => scrollToCategory(cat.id)} variants={navItem}
                      className="relative shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200"
                      style={{ color: isActive ? primaryColor : '#9A9692' }}
                      whileHover={{ color: '#C8C4C0' }} whileTap={{ scale: 0.95 }}
                    >
                      {cat.name}
                      {isActive && (
                        <motion.span layoutId="tab-indicator"
                          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                          style={{ background: primaryColor }}
                          transition={{ type: 'spring', damping: 24, stiffness: 280 }} />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Search toggle button */}
              <motion.button
                onClick={openSearch}
                className="shrink-0 mr-4 sm:mr-6 w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
                whileHover={{ scale: 1.07, backgroundColor: 'rgba(255,255,255,0.12)' }}
                whileTap={{ scale: 0.93 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: navReady ? 1 : 0 }}
                aria-label="Rechercher"
              >
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>
            </div>

            {/* ── Diet filters (hidden during search) ── */}
            {!searchOpen && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-3">
                {FILTERS.map((f) => {
                  const isActive = activeFilter === f.key;
                  return (
                    <motion.button key={f.key} onClick={() => setActiveFilter(f.key)}
                      className="relative shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium overflow-hidden"
                      style={isActive
                        ? { color: '#fff', border: 'none' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#A8A4A0', border: '1px solid rgba(255,255,255,0.12)' }
                      }
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}
                    >
                      {isActive && (
                        <motion.span layoutId="filter-bg" className="absolute inset-0 rounded-full"
                          style={{ background: primaryColor }}
                          transition={{ type: 'spring', damping: 24, stiffness: 280 }} />
                      )}
                      <span className="relative text-sm leading-none">{f.icon}</span>
                      <span className="relative">{f.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Content ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <AnimatePresence mode="wait">

            {/* ── Search results ── */}
            {isSearching ? (
              <motion.div
                key={`search-${searchQuery}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-1" style={{ color: primaryColor }}>
                      Recherche
                    </p>
                    <h2 className="text-xl font-bold text-[#F7F4F0]" style={{ fontFamily: 'var(--font-heading)' }}>
                      {searchResults.length > 0
                        ? <>{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} pour <span style={{ color: primaryColor }}>&ldquo;{searchQuery}&rdquo;</span></>
                        : <>Aucun résultat pour <span style={{ color: primaryColor }}>&ldquo;{searchQuery}&rdquo;</span></>
                      }
                    </h2>
                  </div>
                </div>

                {searchResults.length === 0 ? (
                  <motion.div
                    className="flex flex-col items-center justify-center py-20 gap-4"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  >
                    <span className="text-5xl opacity-30">🔍</span>
                    <p className="text-[#6A6A68] text-sm text-center max-w-xs">
                      Essayez un autre mot-clé, ou parcourez nos catégories.
                    </p>
                    <motion.button onClick={closeSearch}
                      className="text-sm font-semibold px-5 py-2.5 rounded-full mt-1"
                      style={{ background: `${primaryColor}20`, color: primaryColor }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                      Voir toutes les catégories
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={cardGridVars}
                    initial="hidden"
                    animate="visible"
                  >
                    {searchResults.map(({ product, catName }) => {
                      const imageSrc = product.imageUrl ?? (Array.isArray(product.images) ? product.images[0] : null) ?? null;
                      return (
                        <motion.div key={product.id} variants={cardItemVars}>
                          <motion.button
                            onClick={() => setSelectedProduct(product)}
                            className="group w-full text-left rounded-xl overflow-hidden relative"
                            style={{ background: '#1A1A18', border: '1px solid rgba(255,255,255,0.07)' }}
                            whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(0,0,0,0.55)' }}
                            whileTap={{ scale: 0.97, y: 0 }}
                            transition={{ duration: 0.3, ease: EASE }}
                          >
                            {/* Category badge */}
                            <span
                              className="absolute top-3 left-3 z-10 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm"
                              style={{ backgroundColor: `${primaryColor}30`, color: primaryColor, border: `1px solid ${primaryColor}40` }}
                            >
                              {catName}
                            </span>

                            {imageSrc ? (
                              <>
                                <div className="relative aspect-[4/3] overflow-hidden">
                                  <Image src={imageSrc} alt={product.name} fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    loading="lazy" placeholder="blur"
                                    blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-white text-sm font-mono font-semibold"
                                    style={{ backgroundColor: primaryColor }}>
                                    {formatPrice(product.basePrice, currencySymbol)}
                                  </div>
                                </div>
                                <div className="p-4 space-y-1">
                                  <h3 className="font-semibold text-[#F7F4F0] leading-snug line-clamp-1"
                                    style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                                    <Highlight text={product.name} query={searchQuery} color={primaryColor} />
                                  </h3>
                                  {product.description && (
                                    <p className="text-[#A09C98] text-xs leading-relaxed line-clamp-2">
                                      <Highlight text={product.description} query={searchQuery} color={primaryColor} />
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-2 mt-5">
                                  <h3 className="font-semibold text-[#F7F4F0] leading-snug"
                                    style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                                    <Highlight text={product.name} query={searchQuery} color={primaryColor} />
                                  </h3>
                                  <span className="font-mono text-sm font-bold shrink-0 tabular-nums" style={{ color: primaryColor }}>
                                    {formatPrice(product.basePrice, currencySymbol)}
                                  </span>
                                </div>
                                {product.description && (
                                  <p className="text-[#A09C98] text-xs leading-relaxed line-clamp-2">
                                    <Highlight text={product.description} query={searchQuery} color={primaryColor} />
                                  </p>
                                )}
                              </div>
                            )}
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            ) : filteredCategories.length === 0 ? (
              <motion.div key="empty"
                className="flex flex-col items-center justify-center py-24 gap-4"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}>
                <span className="text-5xl opacity-40">🍽️</span>
                <p className="text-[#8A8682] text-lg font-medium">Aucun plat ne correspond à ce filtre</p>
                <motion.button onClick={() => setActiveFilter('all')}
                  className="text-sm font-semibold px-5 py-2.5 rounded-full"
                  style={{ background: `${primaryColor}20`, color: primaryColor }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  Voir tous les plats
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key={activeFilter} className="space-y-20"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: EASE }}>
                {filteredCategories.map((cat) => (
                  <motion.section key={cat.id} id={`menu-cat-${cat.id}`}
                    ref={(el: HTMLElement | null) => { sectionRefs.current[cat.id] = el; }}
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
                    <motion.div className="flex items-center gap-5 mb-8" variants={catHeaderVars}>
                      <motion.div variants={catHeaderItem}>
                        <div className="flex items-center gap-2 mb-1">
                          <motion.div className="h-4 rounded-full" style={{ background: primaryColor, width: 3 }}
                            initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }} transition={{ duration: 0.4, ease: EASE }} />
                          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: primaryColor }}>
                            {cat.products.length} plat{cat.products.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#F7F4F0]"
                          style={{ fontFamily: 'var(--font-heading)' }}>{cat.name}</h2>
                        {cat.description && (
                          <p className="text-[#8A8682] text-sm mt-1 italic">{cat.description}</p>
                        )}
                      </motion.div>
                      <motion.div className="flex-1 h-px"
                        style={{ background: 'rgba(255,255,255,0.10)', transformOrigin: 'left' }}
                        variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.8, ease: EASE, delay: 0.15 } } }} />
                    </motion.div>

                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={cardGridVars}>
                      {cat.products.map((product) => (
                        <motion.div key={product.id} variants={cardItemVars}>
                          <ProductCard product={product} currencySymbol={currencySymbol}
                            primaryColor={primaryColor} onClick={() => setSelectedProduct(product)} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.section>
                ))}

                {totalVisible > 0 && (
                  <motion.div className="text-center pb-8" initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }} viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}>
                    <div className="inline-flex items-center gap-3 text-xs text-[#6A6A68]">
                      <div className="h-px w-12" style={{ background: 'rgba(255,255,255,0.15)' }} />
                      {totalVisible} plat{totalVisible > 1 ? 's' : ''} au total
                      <div className="h-px w-12" style={{ background: 'rgba(255,255,255,0.15)' }} />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Floating cart button ── */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.button
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white font-semibold shadow-2xl"
            style={{ backgroundColor: primaryColor }}
            initial={{ opacity: 0, y: 32, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ type: 'spring', damping: 22, stiffness: 240 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{cartCount} article{cartCount > 1 ? 's' : ''}</span>
            <span className="font-mono">{formatPrice(cartTotal, currencySymbol)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Product Modal ── */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            key={selectedProduct.id}
            product={selectedProduct}
            currencySymbol={currencySymbol}
            primaryColor={primaryColor}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={addToCart}
          />
        )}
      </AnimatePresence>

      {/* ── Cart Drawer ── */}
      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            cart={cart}
            currencySymbol={currencySymbol}
            primaryColor={primaryColor}
            slug={slug}
            tableNumber={tableNumber}
            onClose={() => setCartOpen(false)}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
            onClearCart={clearCart}
          />
        )}
      </AnimatePresence>
    </>
  );
}
