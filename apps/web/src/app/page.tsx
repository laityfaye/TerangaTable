'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowRight, MapPin, Zap, Users, BarChart3,
  Smartphone, Calendar, ShoppingBag, Globe,
  CheckCircle2, Star, Package,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Shared ─────────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Data ───────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: Smartphone,
    title: 'Caisse & POS',
    description: 'Terminal tactile optimisé pour tablettes. Prise de commande rapide, paiements multiples, tickets imprimés.',
    details: ['Prise de commande ultra-rapide', 'Wave, Orange Money & espèces', 'Impression automatique des tickets', 'Mode hors-ligne disponible', 'Gestion multi-tables'],
    color: '#C8553D',
    bg: 'rgba(200,85,61,0.15)',
    gradient: 'linear-gradient(135deg, #C8553D, #A33D28)',
  },
  {
    Icon: Globe,
    title: 'Menu digital',
    description: 'Carte en ligne personnalisable avec photos, allergènes et filtres. Mise à jour instantanée.',
    details: ['Photos et descriptions des plats', 'Filtres allergènes & régimes', 'Mise à jour en temps réel', 'QR code pour les tables', 'Multilingue (FR, EN, AR)'],
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.15)',
    gradient: 'linear-gradient(135deg, #D4A843, #A87E20)',
  },
  {
    Icon: ShoppingBag,
    title: 'Commandes',
    description: 'Kanban en temps réel pour la cuisine. Workflows personnalisables, alertes sonores, suivi statut.',
    details: ['Kanban salle ↔ cuisine', 'Alertes sonores par statut', 'Zéro papier, zéro erreur', 'Historique complet des commandes', 'Tickets de cuisine imprimés'],
    color: '#2D6A4F',
    bg: 'rgba(45,106,79,0.15)',
    gradient: 'linear-gradient(135deg, #2D6A4F, #1A3D2E)',
  },
  {
    Icon: Calendar,
    title: 'Réservations',
    description: 'Formulaire intégré au site vitrine. Plan de salle interactif, confirmation automatique.',
    details: ['Calendrier des réservations', 'Plan de salle interactif', 'Confirmation par SMS/email', 'Gestion des no-shows', 'Rappels automatiques'],
    color: '#C8553D',
    bg: 'rgba(200,85,61,0.15)',
    gradient: 'linear-gradient(135deg, #C8553D, #A33D28)',
  },
  {
    Icon: Users,
    title: 'CRM & Fidélité',
    description: 'Base clients centralisée, historique des commandes, programme de fidélité points.',
    details: ['Fiche client complète', 'Historique des visites', 'Programme de points fidélité', 'Segmentation clients', 'Campagnes SMS ciblées'],
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.15)',
    gradient: 'linear-gradient(135deg, #D4A843, #A87E20)',
  },
  {
    Icon: BarChart3,
    title: 'Analytics',
    description: "Chiffre d'affaires, produits phares, heures de pointe. Tableaux de bord en temps réel.",
    details: ["CA journalier, hebdomadaire, mensuel", 'Plats les plus vendus', 'Heures de pointe identifiées', 'Comparatifs de périodes', 'Export PDF & Excel'],
    color: '#2D6A4F',
    bg: 'rgba(45,106,79,0.15)',
    gradient: 'linear-gradient(135deg, #2D6A4F, #1A3D2E)',
  },
  {
    Icon: Package,
    title: 'Site vitrine',
    description: 'Votre propre page restaurant avec domaine personnalisé. SEO, réservations, menu public.',
    details: ['Domaine personnalisé inclus', 'Menu public en ligne', 'Réservations intégrées', 'Optimisé SEO local', 'Galerie photos'],
    color: '#C8553D',
    bg: 'rgba(200,85,61,0.15)',
    gradient: 'linear-gradient(135deg, #C8553D, #A33D28)',
  },
  {
    Icon: Zap,
    title: 'Livraison',
    description: 'Gestion des chauffeurs, zones de livraison et frais. Suivi en temps réel.',
    details: ['Zones et frais configurables', 'Suivi chauffeur en temps réel', 'Notification client à la livraison', 'Rapports de livraison', 'Intégration Yango & autres'],
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.15)',
    gradient: 'linear-gradient(135deg, #D4A843, #A87E20)',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '15 000',
    currency: 'XOF',
    description: 'Pour les petits restaurants qui démarrent',
    color: '#D4A843',
    features: [
      "Jusqu'à 2 utilisateurs",
      'Caisse POS',
      'Menu digital',
      'Gestion commandes',
      'Site vitrine de base',
      'Support email',
    ],
    cta: 'Démarrer gratuitement',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '35 000',
    currency: 'XOF',
    description: 'Pour les restaurants en croissance',
    color: '#C8553D',
    features: [
      "Jusqu'à 10 utilisateurs",
      'Tout Starter inclus',
      'Réservations en ligne',
      'CRM & Fidélité',
      'Analytics avancés',
      'Livraison & Zones',
      'Site vitrine + domaine',
      'Support prioritaire',
    ],
    cta: 'Commencer avec Growth',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '75 000',
    currency: 'XOF',
    description: 'Pour les chaînes et franchises',
    color: '#2D6A4F',
    features: [
      'Utilisateurs illimités',
      'Tout Growth inclus',
      'Multi-établissements',
      'Champs personnalisés',
      'Workflows sur mesure',
      'API & Intégrations',
      'SLA 99.9% garanti',
      'Gestionnaire dédié',
    ],
    cta: "Contacter l'équipe",
    highlight: false,
  },
];

const REGIONS = [
  { city: 'Dakar', country: 'Sénégal', code: 'SN', currency: 'XOF', status: 'active', primary: '#009A44', stripes: ['#009A44', '#FDEF42', '#CE1126'] },
  { city: 'Thiès', country: 'Sénégal', code: 'SN', currency: 'XOF', status: 'active', primary: '#009A44', stripes: ['#009A44', '#FDEF42', '#CE1126'] },
  { city: 'Saint-Louis', country: 'Sénégal', code: 'SN', currency: 'XOF', status: 'active', primary: '#009A44', stripes: ['#009A44', '#FDEF42', '#CE1126'] },
  { city: 'Abidjan', country: "Côte d'Ivoire", code: 'CI', currency: 'XOF', status: 'active', primary: '#F77F00', stripes: ['#F77F00', '#FFFFFF', '#009A00'] },
  { city: 'Casablanca', country: 'Maroc', code: 'MA', currency: 'MAD', status: 'active', primary: '#C1272D', stripes: ['#C1272D', '#FFFFFF', '#006233'] },
  { city: 'Paris', country: 'France', code: 'FR', currency: 'EUR', status: 'soon', primary: '#002395', stripes: ['#002395', '#FFFFFF', '#ED2939'] },
];

const STATS = [
  { value: 500, suffix: '+', label: 'Restaurants actifs' },
  { value: 5, suffix: '', label: 'Pays couverts' },
  { value: 99, suffix: '.9%', label: 'Disponibilité garantie' },
  { value: 24, suffix: '/7', label: 'Support client' },
];

const TESTIMONIALS = [
  {
    quote:
      "TérangaTable a transformé la gestion de mon restaurant. Les commandes sont mieux organisées, et mes clients adorent réserver en ligne.",
    author: 'Ibrahima Diallo',
    role: 'Propriétaire, Restaurant La Teranga',
    city: 'Dakar',
    rating: 5,
    initials: 'ID',
    color: '#C8553D',
  },
  {
    quote:
      "La caisse POS est intuitive, mon équipe a pris en main le logiciel en une heure. Le support est réactif et toujours disponible.",
    author: 'Fatou Konaté',
    role: 'Gérante, Maquis Chez Fatou',
    city: 'Abidjan',
    rating: 5,
    initials: 'FK',
    color: '#D4A843',
  },
  {
    quote:
      "Les analytics m'ont permis de comprendre mes meilleures heures et mes plats les plus vendus. J'ai augmenté mon CA de 30% en 3 mois.",
    author: 'Omar Benjelloun',
    role: 'Directeur, Riad Saveurs',
    city: 'Casablanca',
    rating: 5,
    initials: 'OB',
    color: '#2D6A4F',
  },
];

// ── Hero slides data ───────────────────────────────────────────────────────────

// Remplacez ces URLs par vos propres photos de restaurants
const HERO_SLIDES = [
  {
    badge: 'Plateforme tout-en-un',
    title: 'Tout pour votre restaurant, en un seul outil.',
    sub: 'Caisse, commandes, réservations et analytics — enfin réunis.',
    chips: ['Temps réel', 'Multi-sites'],
    accent: '#C8553D',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80',
  },
  {
    badge: 'Caisse & POS',
    title: 'Encaissez sans friction.',
    sub: 'Wave, Orange Money, espèces — tickets imprimés instantanément.',
    chips: ['Hors-ligne', 'Impression auto'],
    accent: '#D4A843',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80',
  },
  {
    badge: 'Gestion commandes',
    title: 'La cuisine toujours dans la boucle.',
    sub: 'Kanban temps réel, alertes sonores, zéro papier.',
    chips: ['Temps réel', 'Zéro papier'],
    accent: '#2D6A4F',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80',
  },
  {
    badge: 'Analytics & Rapports',
    title: 'Décidez grâce aux données.',
    sub: "CA, plats stars, heures de pointe — tout en temps réel.",
    chips: ['Rapports auto', 'Prévisions CA'],
    accent: '#C8553D',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80',
  },
];

// ── Counter ────────────────────────────────────────────────────────────────────

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const steps = 55;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({
  tag,
  title,
  sub,
  light = false,
}: {
  tag: string;
  title: React.ReactNode;
  sub?: string;
  light?: boolean;
}) {
  return (
    <motion.div
      className="text-center mb-16"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="h-px w-10 bg-[#C8553D]" />
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#C8553D]">{tag}</span>
        <div className="h-px w-10 bg-[#C8553D]" />
      </div>
      <h2
        className={`text-3xl sm:text-4xl font-bold mb-4 ${light ? 'text-[#1C1917]' : 'text-white'}`}
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </h2>
      {sub && (
        <p className={`text-base max-w-xl mx-auto ${light ? 'text-[#57534E]' : 'text-white/45'}`}>{sub}</p>
      )}
    </motion.div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { href: '/decouvrir', label: 'Découvrir', accent: true },
    { href: '#fonctionnalites', label: 'Fonctionnalités', accent: false },
    { href: '#tarifs', label: 'Tarifs', accent: false },
    { href: '#regions', label: 'Régions', accent: false },
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0C0C0A]/95 backdrop-blur-xl border-b border-white/8 shadow-2xl shadow-black/30'
            : 'bg-transparent'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#C8553D] flex items-center justify-center shadow-lg shadow-[#C8553D]/30 group-hover:shadow-[#C8553D]/50 transition-shadow duration-300">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>T</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              TérangaTable
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  l.accent
                    ? 'text-[#E8826F] hover:text-[#C8553D] font-semibold'
                    : 'text-white/55 hover:text-white'
                }`}
              >
                {l.accent && <MapPin className="w-3.5 h-3.5" />}
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <a href="https://terangatable.cloud/login" className="hidden sm:block text-sm text-white/55 hover:text-white transition-colors">
              Se connecter
            </a>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/register"
                className="text-sm font-bold px-5 py-2.5 rounded-full text-white bg-[#C8553D] hover:bg-[#A33D28] transition-colors shadow-lg shadow-[#C8553D]/25"
              >
                Essai gratuit
              </Link>
            </motion.div>

            {/* Hamburger */}
            <button
              className="md:hidden p-2 text-white/70 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <div className="flex flex-col gap-[5px] w-5 h-4 justify-center">
                <motion.span className="block h-0.5 bg-current rounded-full" animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.3 }} />
                <motion.span className="block h-0.5 bg-current rounded-full" animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.2 }} />
                <motion.span className="block h-0.5 bg-current rounded-full" animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.3 }} />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden flex flex-col items-center justify-center gap-7"
            style={{ background: 'linear-gradient(160deg, #0C0C0A 0%, #1A0A06 50%, #0C0C0A 100%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grain-layer" aria-hidden />
            <div className="absolute -top-32 right-0 w-80 h-80 bg-[#C8553D]/10 rounded-full blur-3xl pointer-events-none" />

            {navLinks.map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block text-4xl font-bold tracking-tight transition-colors ${
                    l.accent ? 'text-[#C8553D]' : 'text-white/75 hover:text-white'
                  }`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 flex flex-col gap-3 items-center"
            >
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="px-10 py-4 rounded-full bg-[#C8553D] text-white font-bold text-lg shadow-2xl shadow-[#C8553D]/30"
              >
                Essai gratuit →
              </Link>
              <a href="https://terangatable.cloud/login" onClick={() => setMenuOpen(false)} className="text-white/35 text-sm">
                Se connecter
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function HeroSection() {
  const SLIDE_DURATION = 6000;
  const TICK = 80;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number, dir?: number) => {
    const d = dir ?? (idx > current ? 1 : -1);
    setDirection(d);
    setCurrent(idx);
    setProgress(0);
  }, [current]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (TICK / SLIDE_DURATION) * 100, 100));
    }, TICK);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [current]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      goTo((current + 1) % HERO_SLIDES.length, 1);
    }, SLIDE_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, goTo]);

  const slide = HERO_SLIDES[current];

  const textVariants = {
    enter: (d: number) => ({ opacity: 0, y: d > 0 ? 28 : -28 }),
    center: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
    exit: (d: number) => ({ opacity: 0, y: d > 0 ? -18 : 18, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }),
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col overflow-hidden bg-[#0C0C0A]">

      {/* ── Background images — toutes dans le DOM, crossfade par opacity ── */}
      {HERO_SLIDES.map((s, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 z-0"
          initial={false}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        >
          <motion.img
            src={s.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.04 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 20, ease: 'linear' }}
          />
        </motion.div>
      ))}

      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/90 via-black/65 sm:via-black/50 to-black/10" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
      {/* Accent color tint en bas à gauche */}
      <motion.div
        key={`tint-${current}`}
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none z-[1]"
        style={{ background: `radial-gradient(circle, ${slide.accent}22 0%, transparent 70%)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      <div className="grain-layer z-[2]" aria-hidden />

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex items-end sm:items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-6 w-full">

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`copy-${current}`}
              custom={direction}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-5 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left"
            >
              {/* Badge */}
              <motion.span
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border self-center lg:self-start text-xs font-semibold tracking-wide backdrop-blur-sm"
                style={{
                  borderColor: `${slide.accent}55`,
                  backgroundColor: `${slide.accent}22`,
                  color: slide.accent,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: slide.accent }} />
                {slide.badge}
              </motion.span>

              {/* Titre */}
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}
              >
                {slide.title}
              </h1>

              {/* Sous-titre */}
              <p
                className="text-white/65 text-sm sm:text-base leading-relaxed max-w-md"
                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.7)' }}
              >
                {slide.sub}
              </p>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {slide.chips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/85 text-xs font-medium backdrop-blur-md"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.38)',
                      border: `1px solid ${slide.accent}45`,
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: slide.accent }} />
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* CTAs — statiques, ne changent pas avec le slide */}
          <div className="flex flex-col sm:flex-row gap-3 mt-7 sm:mt-8 items-center justify-center lg:justify-start">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-white text-sm transition-colors shadow-2xl shadow-black/40"
                style={{ backgroundColor: '#C8553D' }}
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <a
                href="#fonctionnalites"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white text-sm backdrop-blur-sm transition-all hover:bg-white/15"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)' }}
              >
                Voir les fonctionnalités
              </a>
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center gap-5 mt-5 justify-center lg:justify-start">
            {['14 jours gratuits', 'Aucune CB requise', 'Résiliation facile'].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="text-[#2D6A4F] font-bold text-sm">✓</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contrôles en bas ── */}
      <div className="relative z-10 pb-8 sm:pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">

          {/* Barres de progression */}
          <div className="flex-1 flex gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="flex-1 rounded-full overflow-hidden relative focus:outline-none"
                style={{ height: 3, minHeight: 20, display: 'flex', alignItems: 'center' }}
                aria-label={`Slide ${i + 1}`}
              >
                <div className="w-full rounded-full overflow-hidden" style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.22)' }}>
                  {i === current && (
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: slide.accent, width: `${progress}%` }}
                      transition={{ duration: 0 }}
                    />
                  )}
                  {i < current && (
                    <div className="h-full rounded-full opacity-75" style={{ backgroundColor: slide.accent }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Compteur */}
          <span className="text-white/40 text-xs font-mono tabular-nums shrink-0">
            {String(current + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(HERO_SLIDES.length).padStart(2, '0')}
          </span>

          {/* Flèches */}
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => goTo((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length, -1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors focus:outline-none backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goTo((current + 1) % HERO_SLIDES.length, 1)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors focus:outline-none backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────────

function StatsSection() {
  const bgImages = [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=65',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=65',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=65',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=65',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=65',
    'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=900&q=65',
  ];

  return (
    <section className="relative py-12 sm:py-16 px-4 sm:px-6 overflow-hidden">
      <style>{`
        @keyframes img-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .img-marquee-track { animation: img-marquee 28s linear infinite; }
      `}</style>

      {/* Images qui défilent en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="img-marquee-track flex h-full w-max">
          {[...bgImages, ...bgImages].map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-full object-cover"
              style={{ minWidth: 320, width: 'auto' }}
            />
          ))}
        </div>
      </div>

      {/* Overlay dégradé de marque */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(200,85,61,0.88) 0%, rgba(212,168,67,0.84) 50%, rgba(45,106,79,0.88) 100%)' }}
      />
      {/* Assombrissement supplémentaire pour lisibilité */}
      <div className="absolute inset-0 bg-black/25" />
      <div className="grain-layer opacity-[0.05]" aria-hidden />

      {/* Contenu */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              className="text-white"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
              }}
            >
              <div
                className="text-4xl sm:text-5xl font-bold mb-1.5 text-white drop-shadow-lg"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-white/80 text-sm font-medium">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const [selected, setSelected] = useState<typeof FEATURES[0] | null>(null);

  return (
    <section id="fonctionnalites" className="py-14 px-4 sm:px-6 bg-[#0C0C0A]">
      <div className="max-w-2xl mx-auto">
        <SectionHeader
          tag="Fonctionnalités"
          title="Tout ce dont votre restaurant a besoin"
          sub="Appuyez sur une fonctionnalité pour découvrir les détails."
        />

        {/* ── Grille icônes style app ── */}
        <motion.div
          className="grid grid-cols-4 gap-3 sm:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {FEATURES.map((f) => (
            <motion.button
              key={f.title}
              onClick={() => setSelected(f)}
              className="flex flex-col items-center gap-2.5 group focus:outline-none"
              variants={{
                hidden: { opacity: 0, scale: 0.85 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE } },
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
            >
              {/* Icône app */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg relative overflow-hidden"
                style={{ background: f.gradient }}
              >
                <div className="absolute inset-0 bg-white/10 rounded-inherit" />
                <f.Icon className="w-7 h-7 sm:w-9 sm:h-9 text-white relative z-10" />
              </div>
              <span className="text-white/65 text-[11px] sm:text-xs text-center leading-tight font-medium group-hover:text-white transition-colors">
                {f.title}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* ── Modal détail ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setSelected(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Panel */}
            <motion.div
              className="relative bg-[#161614] rounded-3xl w-full max-w-md border border-white/10 overflow-hidden"
              initial={{ y: 80, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header coloré */}
              <div className="relative px-6 pt-7 pb-6" style={{ background: selected.gradient }}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <selected.Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-heading)' }}>
                      {selected.title}
                    </h3>
                    <p className="text-white/70 text-sm mt-0.5">{selected.description}</p>
                  </div>
                </div>
              </div>

              {/* Détails */}
              <div className="px-6 py-5">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Inclus</p>
                <ul className="flex flex-col gap-3">
                  {selected.details.map((d) => (
                    <li key={d} className="flex items-center gap-3 text-sm text-white/80">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: selected.bg }}
                      >
                        <CheckCircle2 className="w-3 h-3" style={{ color: selected.color }} />
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6 pt-1">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                  style={{ background: selected.gradient }}
                  onClick={() => setSelected(null)}
                >
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setSelected(null)}
                  className="w-full mt-2.5 py-2.5 text-white/35 text-sm hover:text-white/60 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
// ── Marketplace CTA ────────────────────────────────────────────────────────────

function MarketplaceCtaSection() {
  const cities = [
    { name: 'Dakar', slug: 'dakar', count: '200+' },
    { name: 'Abidjan', slug: 'abidjan', count: '80+' },
    { name: 'Casablanca', slug: 'casablanca', count: '60+' },
    { name: 'Thiès', slug: 'thies', count: '45+' },
    { name: 'Saint-Louis', slug: 'saint-louis', count: '30+' },
  ];

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden">
      {/* Image de fond */}
      <img
        src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1920&q=80"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      <div className="grain-layer" aria-hidden />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-14"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.75, ease: EASE }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D4A843]/40 bg-[#D4A843]/12 text-[#D4A843] text-xs font-bold uppercase tracking-widest mb-7 backdrop-blur-sm">
            <MapPin className="w-3.5 h-3.5" />
            Marketplace
          </div>

          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.06] tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-heading)', textShadow: '0 2px 32px rgba(0,0,0,0.6)' }}
          >
            Vos futurs clients vous cherchent déjà.
          </h2>
          <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            TérangaTable est aussi une marketplace de découverte — référencez votre restaurant et touchez des milliers de nouveaux clients chaque mois.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/decouvrir"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C8553D] text-white font-bold text-sm shadow-2xl shadow-[#C8553D]/30 hover:bg-[#A33D28] transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Explorer la marketplace
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm backdrop-blur-sm transition-all hover:bg-white/15"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                Référencer mon restaurant
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Villes */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        >
          <span className="text-white/35 text-xs font-semibold uppercase tracking-widest self-center mr-1">Disponible à</span>
          {cities.map((city) => (
            <motion.div key={city.slug} whileHover={{ scale: 1.07, y: -2 }} whileTap={{ scale: 0.96 }}>
              <Link
                href={`/decouvrir/${city.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border border-white/15 bg-white/8 text-white/75 text-sm font-medium hover:bg-white/16 hover:border-white/30 hover:text-white transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]" />
                {city.name}
                <span className="text-white/35 text-xs font-mono">{city.count}</span>
              </Link>
            </motion.div>
          ))}
          <motion.div whileHover={{ scale: 1.07, y: -2 }}>
            <Link
              href="/decouvrir"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-white/20 text-white/35 text-sm hover:text-white/60 hover:border-white/35 transition-all"
            >
              + d&apos;autres villes
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const doubled = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="py-14 bg-[#111110] overflow-hidden">
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        .marquee-track { animation: marquee-scroll 22s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <SectionHeader tag="Témoignages" title="Ils nous font confiance" />
      </div>

      <div className="relative">
        {/* Fade bords */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-[#111110] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-[#111110] to-transparent z-10 pointer-events-none" />

        {/* Piste défilante */}
        <div className="marquee-track flex gap-5 w-max">
          {doubled.map((t, i) => (
            <div
              key={i}
              className="w-80 shrink-0 rounded-2xl border border-white/8 bg-[#161614] p-6 flex flex-col gap-4"
            >
              <div className="text-5xl font-serif leading-none" style={{ color: `${t.color}30` }}>&ldquo;</div>

              <div className="flex gap-1 -mt-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#D4A843] text-[#D4A843]" />
                ))}
              </div>

              <blockquote className="text-white/60 text-sm leading-relaxed flex-1 italic">
                {t.quote}
              </blockquote>

              <div className="flex items-center gap-3 pt-2 border-t border-white/6">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{t.author}</div>
                  <div className="text-white/35 text-xs truncate">{t.role}</div>
                </div>
                <div className="text-[10px] text-white/20 font-mono shrink-0">{t.city}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ── Pricing ────────────────────────────────────────────────────────────────────

function PricingSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      setActive(Math.max(0, Math.min(idx, PLANS.length - 1)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
  };

  const PlanCard = ({ plan }: { plan: typeof PLANS[0] }) => (
    <div
      className={`relative rounded-2xl flex flex-col p-7 h-full ${
        plan.highlight
          ? 'bg-[#161614] border-2 shadow-[0_0_70px_rgba(200,85,61,0.18)]'
          : 'bg-[#161614] border border-white/8'
      }`}
      style={plan.highlight ? { borderColor: 'rgba(200,85,61,0.55)' } : {}}
    >
      {plan.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-bold bg-[#C8553D] shadow-lg shadow-[#C8553D]/30 whitespace-nowrap">
          Le plus populaire
        </div>
      )}

      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: plan.color }}>
          {plan.name}
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {plan.price}
          </span>
          <span className="text-white/30 text-sm mb-1">{plan.currency} / mois</span>
        </div>
        <p className="text-white/30 text-xs">{plan.description}</p>
      </div>

      <ul className="flex-1 space-y-3 mb-7">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: plan.color }} />
            <span className="text-white/60 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        className="block text-center py-3.5 rounded-xl font-bold text-sm transition-all"
        style={
          plan.highlight
            ? { backgroundColor: plan.color, color: '#fff' }
            : { backgroundColor: `${plan.color}14`, color: plan.color, border: `1px solid ${plan.color}28` }
        }
      >
        {plan.cta}
      </Link>
    </div>
  );

  return (
    <section id="tarifs" className="py-14 bg-[#0C0C0A] overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <SectionHeader
          tag="Tarifs"
          title="Des tarifs adaptés à votre restaurant"
          sub="Commencez gratuitement pendant 14 jours. Aucune carte bancaire requise."
        />
      </div>

      {/* ── Mobile : carousel swipeable ── */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-4 sm:px-6 pb-2"
        >
          {PLANS.map((plan) => (
            <div key={plan.name} className="snap-center shrink-0 w-[calc(100vw-3rem)] sm:w-[calc(100vw-4rem)]">
              <PlanCard plan={plan} />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {PLANS.map((plan, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className="h-2 rounded-full transition-all duration-300 focus:outline-none"
              style={{
                width: i === active ? 20 : 8,
                backgroundColor: i === active ? PLANS[active].color : 'rgba(255,255,255,0.2)',
              }}
              aria-label={plan.name}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop : grille 3 colonnes ── */}
      <div className="hidden md:grid grid-cols-3 gap-5 max-w-5xl mx-auto px-6">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: EASE }}
            whileHover={{ y: -4, transition: { duration: 0.22 } }}
          >
            <PlanCard plan={plan} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Regions ────────────────────────────────────────────────────────────────────


// ── Final CTA ──────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="relative py-16 px-4 sm:px-6 overflow-hidden">
      {/* Image de fond */}
      <img
        src="https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=1920&q=80"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-black/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
      <div className="grain-layer" aria-hidden />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.75, ease: EASE }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8553D]/35 bg-[#C8553D]/10 text-[#E8826F] text-xs font-semibold tracking-wide mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8553D] animate-pulse" />
          500+ restaurants nous font confiance
        </div>
        <h2
          className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-[1.1]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Prêt à transformer votre restaurant ?
        </h2>
        <p className="text-white/45 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          14 jours gratuits, sans engagement, sans carte bancaire.
          Rejoignez les restaurateurs qui ont fait le choix TérangaTable.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-full font-bold text-white bg-[#C8553D] hover:bg-[#A33D28] transition-colors shadow-2xl shadow-[#C8553D]/35 text-sm"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <a
              href="mailto:contact@terangatable.com"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-full font-semibold text-white/65 border border-white/18 hover:border-white/38 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              Contacter l&apos;équipe
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function LandingFooter() {
  const cols = [
    {
      title: 'Produit',
      links: [
        { label: 'Fonctionnalités', href: '#fonctionnalites' },
        { label: 'Tarifs', href: '#tarifs' },
        { label: 'Régions', href: '#regions' },
        { label: 'Marketplace', href: '/decouvrir' },
      ],
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Contact', href: 'mailto:contact@terangatable.com' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Confidentialité', href: '#' },
        { label: "Conditions d'utilisation", href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-[#080807] border-t border-white/8">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Brand — centré sur mobile */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#C8553D] flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-white font-bold" style={{ fontFamily: 'var(--font-heading)' }}>TérangaTable</span>
          </div>
          <p className="text-white/45 text-sm leading-relaxed mb-4 max-w-[240px]">
            Le Shopify + Odoo de la Restauration en Afrique.
          </p>
          <div className="flex gap-2">
            {['𝕏', 'in', 'f'].map((s) => (
              <a
                key={s}
                href="#"
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-xs text-white/50 hover:bg-[#C8553D]/20 hover:border-[#C8553D]/40 hover:text-white transition-all"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Colonnes : grille 3 sur mobile, 3 sur desktop */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-6 md:gap-10">
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-3 text-xs sm:text-sm uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-white/45 text-xs sm:text-sm hover:text-white transition-colors leading-tight block">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Barre bas */}
      <div className="border-t border-white/8 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between text-center sm:text-left">
          <div className="flex flex-col gap-1">
            <p className="text-white/55 text-xs">
              © {new Date().getFullYear()} TérangaTable — Tous droits réservés.
            </p>
            <p className="text-white/30 text-xs">
              Développé par{' '}
              <a
                href="https://innosoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4A843] hover:text-white transition-colors font-semibold"
              >
                InnoSoft Creation
              </a>
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-1 text-white/35 text-xs">
            <a href="mailto:innosoftcreation@gmail.com" className="hover:text-white/60 transition-colors">
              innosoftcreation@gmail.com
            </a>
            <a href="tel:+221780186229" className="hover:text-white/60 transition-colors">
              +221 78 018 62 29
            </a>
            <span>Ville verte, Thiès, Sénégal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <MarketplaceCtaSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
