'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import {
  ArrowRight, MapPin, Zap, Users, BarChart3,
  Smartphone, Calendar, ShoppingBag, Globe,
  CheckCircle2, Star, Package, TrendingUp,
} from 'lucide-react';

// ── Shared ─────────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Data ───────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: Smartphone,
    title: 'Caisse & POS',
    description: 'Terminal tactile optimisé pour tablettes. Prise de commande rapide, paiements multiples, tickets imprimés.',
    color: '#C8553D',
    bg: 'rgba(200,85,61,0.12)',
  },
  {
    Icon: Globe,
    title: 'Menu digital',
    description: 'Carte en ligne personnalisable avec photos, allergènes et filtres. Mise à jour instantanée.',
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.12)',
  },
  {
    Icon: ShoppingBag,
    title: 'Gestion commandes',
    description: 'Kanban en temps réel pour la cuisine. Workflows personnalisables, alertes sonores, suivi statut.',
    color: '#2D6A4F',
    bg: 'rgba(45,106,79,0.12)',
  },
  {
    Icon: Calendar,
    title: 'Réservations',
    description: 'Formulaire intégré au site vitrine. Plan de salle interactif, confirmation automatique.',
    color: '#C8553D',
    bg: 'rgba(200,85,61,0.12)',
  },
  {
    Icon: Users,
    title: 'CRM & Fidélité',
    description: 'Base clients centralisée, historique des commandes, programme de fidélité points.',
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.12)',
  },
  {
    Icon: BarChart3,
    title: 'Analytics',
    description: "Chiffre d'affaires, produits phares, heures de pointe. Tableaux de bord en temps réel.",
    color: '#2D6A4F',
    bg: 'rgba(45,106,79,0.12)',
  },
  {
    Icon: Package,
    title: 'Site vitrine',
    description: 'Votre propre page restaurant avec domaine personnalisé. SEO, réservations, menu public.',
    color: '#C8553D',
    bg: 'rgba(200,85,61,0.12)',
  },
  {
    Icon: Zap,
    title: 'Livraison & Zones',
    description: 'Gestion des chauffeurs, zones de livraison et frais. Suivi en temps réel.',
    color: '#D4A843',
    bg: 'rgba(212,168,67,0.12)',
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
  { city: 'Dakar', country: 'Sénégal', flag: '🇸🇳', currency: 'XOF', status: 'active' },
  { city: 'Thiès', country: 'Sénégal', flag: '🇸🇳', currency: 'XOF', status: 'active' },
  { city: 'Saint-Louis', country: 'Sénégal', flag: '🇸🇳', currency: 'XOF', status: 'active' },
  { city: 'Abidjan', country: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', status: 'active' },
  { city: 'Casablanca', country: 'Maroc', flag: '🇲🇦', currency: 'MAD', status: 'active' },
  { city: 'Paris', country: 'France', flag: '🇫🇷', currency: 'EUR', status: 'soon' },
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
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden bg-[#0C0C0A]">
      {/* Grain */}
      <div className="grain-layer" aria-hidden />

      {/* Ambient glows */}
      <motion.div
        className="absolute -top-40 right-0 w-[900px] h-[900px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,85,61,0.13) 0%, transparent 70%)', y: heroY }}
      />
      <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,168,67,0.07) 0%, transparent 70%)' }}
      />

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full"
        style={{ opacity: heroOpacity }}
      >
        {/* ── Left: copy ── */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C8553D]/35 bg-[#C8553D]/10 text-[#E8826F] text-xs font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8553D] inline-block animate-pulse" />
              Disponible en Côte d&apos;Ivoire & Maroc
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl xl:text-[3.6rem] font-bold text-white leading-[1.07] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          >
            La plateforme tout-en-un pour les{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #C8553D 0%, #D4A843 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              restaurants africains
            </span>
          </motion.h1>

          <motion.p
            className="text-white/50 text-base sm:text-lg leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.2 }}
          >
            Caisse POS, menu digital, commandes, réservations et analytics —
            tout ce dont votre restaurant a besoin pour croître, en un seul outil.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-white text-sm bg-[#C8553D] hover:bg-[#A33D28] transition-colors shadow-2xl shadow-[#C8553D]/30"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <a
                href="#fonctionnalites"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white/70 text-sm border border-white/15 hover:border-white/35 hover:text-white hover:bg-white/5 transition-all"
              >
                Voir les fonctionnalités
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center gap-6 pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            {[
              { icon: '✓', text: '14 jours gratuits' },
              { icon: '✓', text: 'Aucune CB requise' },
              { icon: '✓', text: 'Résiliation facile' },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-1.5 text-xs text-white/35">
                <span className="text-[#2D6A4F] font-bold text-sm">{t.icon}</span>
                {t.text}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: product mockup ── */}
        <motion.div
          className="relative hidden lg:flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
        >
          <div className="relative w-full max-w-[440px]">
            {/* Dashboard browser */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] bg-[#161614]">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1E1E1B] border-b border-white/6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <div className="flex-1 mx-3 h-5 bg-[#0C0C0A] rounded-md flex items-center px-3">
                  <div className="w-2 h-2 rounded-full bg-[#2D6A4F] mr-2 shrink-0" />
                  <span className="text-white/25 text-[10px] font-mono truncate">app.terangatable.com/dashboard</span>
                </div>
              </div>

              {/* Dashboard */}
              <div className="flex" style={{ height: 340 }}>
                {/* Sidebar */}
                <div className="w-44 bg-[#111110] flex flex-col py-4 gap-0.5 shrink-0">
                  <div className="px-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#C8553D] flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">T</span>
                      </div>
                      <div className="w-16 h-2.5 bg-white/20 rounded" />
                    </div>
                  </div>
                  {[
                    { label: 'Tableau de bord', active: false },
                    { label: 'Commandes', active: true },
                    { label: 'Menu', active: false },
                    { label: 'POS', active: false },
                    { label: 'Réservations', active: false },
                    { label: 'Analytics', active: false },
                    { label: 'Clients', active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg ${
                        item.active ? 'bg-[#C8553D]/15 border border-[#C8553D]/20' : ''
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded ${item.active ? 'bg-[#C8553D]' : 'bg-white/10'}`} />
                      <div className={`h-2 rounded ${item.active ? 'bg-white/85 w-16' : 'bg-white/15 w-12'}`} />
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 p-4 overflow-hidden bg-[#FAFAF8]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="w-28 h-4 bg-[#1C1917]/25 rounded mb-1.5" />
                      <div className="w-20 h-2.5 bg-[#1C1917]/12 rounded" />
                    </div>
                    <div className="w-24 h-8 bg-[#C8553D] rounded-xl" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "CA Auj.", val: '142 500 F', color: '#C8553D' },
                      { label: 'Commandes', val: '28', color: '#D4A843' },
                      { label: 'Tables', val: '6/12', color: '#2D6A4F' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-xl p-2.5 border border-[#E7E5E4]">
                        <div className="text-[9px] text-[#57534E] mb-1">{s.label}</div>
                        <div className="text-xs font-bold" style={{ color: s.color }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'Nouvelles', color: '#F59E0B', count: 3 },
                      { label: 'En cuisine', color: '#3B82F6', count: 5 },
                      { label: 'Prêtes', color: '#10B981', count: 2 },
                    ].map((col) => (
                      <div key={col.label}>
                        <div className="px-2 py-1 text-[9px] font-bold text-white flex items-center justify-between rounded-t-lg" style={{ backgroundColor: col.color }}>
                          <span className="truncate">{col.label}</span>
                          <span className="bg-white/25 px-1 rounded ml-1 text-[8px]">{col.count}</span>
                        </div>
                        {Array.from({ length: Math.min(col.count, 2) }).map((_, j) => (
                          <div key={j} className="bg-white border border-[#E7E5E4] rounded p-1.5 mt-1">
                            <div className="w-12 h-1.5 bg-[#1C1917]/20 rounded mb-1" />
                            <div className="w-8 h-1.5 bg-[#57534E]/15 rounded" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating card — revenue */}
            <motion.div
              className="absolute -left-14 top-16 bg-[#1E1E1B] border border-white/10 rounded-2xl p-4 shadow-2xl w-44 backdrop-blur-sm"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="text-[9px] text-[#D4A843] font-bold uppercase tracking-widest mb-2">Ventes du jour</div>
              <div className="text-white font-bold text-xl leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                348 500
                <span className="text-[10px] text-white/35 font-normal ml-1">F CFA</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-[#2D6A4F]" />
                <span className="text-[#2D6A4F] text-[10px] font-semibold">+23% vs hier</span>
              </div>
            </motion.div>

            {/* Floating card — orders */}
            <motion.div
              className="absolute -right-12 bottom-16 bg-[#1E1E1B] border border-white/10 rounded-2xl p-3.5 shadow-2xl w-36"
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            >
              <div className="text-[9px] text-[#C8553D] font-bold uppercase tracking-widest mb-2">Commandes</div>
              <div className="text-white font-bold text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>28</div>
              <div className="flex items-end gap-0.5 mt-2 h-6">
                {[3, 4, 5, 3, 5, 6, 5].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 16}%`, backgroundColor: i === 6 ? '#C8553D' : 'rgba(200,85,61,0.35)' }} />
                ))}
              </div>
            </motion.div>

            {/* Floating badge — online */}
            <motion.div
              className="absolute -right-6 top-10 bg-[#2D6A4F] rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-1.5"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-white text-[10px] font-bold">En ligne</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.div
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-2 bg-white/50 rounded-full"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────────

function StatsSection() {
  return (
    <section className="relative bg-[#C8553D] py-14 px-4 sm:px-6 overflow-hidden">
      {/* Subtle grain */}
      <div className="grain-layer opacity-[0.03]" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-[#A33D28]/30 via-transparent to-[#A33D28]/30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
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
              <div className="text-4xl sm:text-5xl font-bold mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-white/70 text-sm font-medium">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="py-24 px-4 sm:px-6 bg-[#0C0C0A]">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          tag="Fonctionnalités"
          title="Tout ce dont votre restaurant a besoin"
          sub="Une plateforme complète pensée pour les restaurants africains, de la prise de commande jusqu'à l'analyse de vos performances."
        />

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="group relative rounded-2xl border border-white/6 bg-[#161614] p-6 overflow-hidden cursor-default"
              variants={{
                hidden: { opacity: 0, y: 28 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
              }}
              whileHover={{ y: -5, borderColor: 'rgba(255,255,255,0.14)', transition: { duration: 0.22, ease: EASE } }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${f.bg} 0%, transparent 65%)` }}
              />

              {/* Step number */}
              <div className="absolute top-5 right-5 text-xs font-mono font-bold opacity-15" style={{ color: f.color }}>
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Icon */}
              <div
                className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: f.bg, color: f.color }}
              >
                <f.Icon className="w-5 h-5" />
              </div>

              <h3 className="font-bold text-white mb-2 text-[15px] relative" style={{ fontFamily: 'var(--font-heading)' }}>
                {f.title}
              </h3>
              <p className="text-white/40 text-sm leading-relaxed relative">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Dashboard Preview ──────────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-[#111110] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          tag="Dashboard"
          title="Un tableau de bord pensé pour l'Afrique"
          sub="Interface rapide et intuitive, conçue pour fonctionner même avec une connexion internet limitée."
        />

        <motion.div
          className="relative mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          {/* Outer glow halo */}
          <div className="absolute -inset-4 bg-[#C8553D]/6 rounded-3xl blur-3xl pointer-events-none" />

          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.85)]">
            {/* Browser chrome */}
            <div className="bg-[#1E1E1B] px-4 py-3 flex items-center gap-2 border-b border-white/6">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 mx-4 h-6 bg-[#111110] rounded-lg flex items-center px-3 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#2D6A4F] mr-2 shrink-0" />
                <span className="text-white/25 text-xs font-mono truncate">app.terangatable.com/dashboard</span>
              </div>
            </div>

            {/* Dashboard body */}
            <div className="bg-[#FAFAF8] flex" style={{ height: 420 }}>
              {/* Sidebar */}
              <div className="w-56 bg-[#1A1A18] flex flex-col py-5 gap-0.5 shrink-0">
                <div className="px-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#C8553D] flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                    <div>
                      <div className="w-20 h-2.5 bg-white/25 rounded mb-1.5" />
                      <div className="w-14 h-2 bg-white/12 rounded" />
                    </div>
                  </div>
                </div>

                <div className="px-2 flex flex-col gap-0.5">
                  {[
                    { label: 'Tableau de bord', active: false },
                    { label: 'Commandes', active: true },
                    { label: 'Menu', active: false },
                    { label: 'Caisse POS', active: false },
                    { label: 'Réservations', active: false },
                    { label: 'Analytics', active: false },
                    { label: 'Clients CRM', active: false },
                    { label: 'Paramètres', active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                        item.active ? 'bg-[#C8553D]/12 border border-[#C8553D]/20' : ''
                      }`}
                    >
                      <div className={`w-4 h-4 rounded ${item.active ? 'bg-[#C8553D]' : 'bg-white/10'}`} />
                      <div className={`h-2 rounded ${item.active ? 'bg-white/85 w-20' : 'bg-white/16 w-14'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Main */}
              <div className="flex-1 p-6 overflow-hidden">
                {/* Topbar */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="w-40 h-5 bg-[#1C1917]/25 rounded-lg mb-2" />
                    <div className="w-28 h-3 bg-[#1C1917]/12 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#E7E5E4] rounded-xl" />
                    <div className="w-8 h-8 bg-[#E7E5E4] rounded-xl" />
                    <div className="w-32 h-9 bg-[#C8553D] rounded-xl" />
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: "CA Aujourd'hui", val: '348 500 F', trend: '+23%', color: '#C8553D' },
                    { label: 'Commandes actives', val: '28', trend: '+5', color: '#D4A843' },
                    { label: 'Tables libres', val: '6 / 12', trend: '−2', color: '#2D6A4F' },
                    { label: 'Temps moyen', val: '22 min', trend: '−3 min', color: '#3B82F6' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-xl p-3 border border-[#E7E5E4] shadow-sm">
                      <div className="text-[10px] text-[#78716C] mb-1.5 truncate">{kpi.label}</div>
                      <div className="font-bold text-sm text-[#1C1917] mb-1">{kpi.val}</div>
                      <div className="text-[10px] font-semibold" style={{ color: kpi.color }}>{kpi.trend}</div>
                    </div>
                  ))}
                </div>

                {/* Chart + Kanban */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Bar chart */}
                  <div className="col-span-1 bg-white rounded-xl p-3.5 border border-[#E7E5E4]">
                    <div className="text-[10px] text-[#78716C] mb-3 font-medium">Ventes — 7 jours</div>
                    <div className="flex items-end gap-1" style={{ height: 70 }}>
                      {[38, 62, 47, 78, 92, 68, 100].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${h}%`,
                            backgroundColor: i === 6 ? '#C8553D' : 'rgba(200,85,61,0.2)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Kanban */}
                  <div className="col-span-2 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Nouvelles', color: '#F59E0B', count: 3 },
                      { label: 'En cuisine', color: '#3B82F6', count: 5 },
                      { label: 'Prêtes', color: '#10B981', count: 2 },
                    ].map((col) => (
                      <div key={col.label}>
                        <div
                          className="px-2 py-1.5 text-[10px] font-bold text-white flex items-center justify-between rounded-t-lg"
                          style={{ backgroundColor: col.color }}
                        >
                          <span className="truncate">{col.label}</span>
                          <span className="bg-white/25 px-1.5 rounded text-[9px] ml-1 shrink-0">{col.count}</span>
                        </div>
                        {Array.from({ length: Math.min(col.count, 3) }).map((_, j) => (
                          <div key={j} className="bg-white border border-[#E7E5E4] rounded p-2 mt-1">
                            <div className="w-14 h-2 bg-[#1C1917]/18 rounded mb-1" />
                            <div className="w-10 h-1.5 bg-[#57534E]/12 rounded" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Marketplace CTA ────────────────────────────────────────────────────────────
// Compact — remplace l'ancienne DiscoverySection volumineuse

function MarketplaceCtaSection() {
  const cities = [
    { name: 'Dakar', slug: 'dakar', flag: '🇸🇳', count: '200+', highlight: true },
    { name: 'Abidjan', slug: 'abidjan', flag: '🇨🇮', count: '80+', highlight: false },
    { name: 'Casablanca', slug: 'casablanca', flag: '🇲🇦', count: '60+', highlight: false },
    { name: 'Thiès', slug: 'thies', flag: '🇸🇳', count: '45+', highlight: false },
    { name: 'Saint-Louis', slug: 'saint-louis', flag: '🇸🇳', count: '30+', highlight: false },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 bg-[#0C0C0A]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.75, ease: EASE }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A18] via-[#1C0D07] to-[#1A1A18]" />
          <div className="grain-layer" aria-hidden />
          <div className="absolute -top-24 -right-16 w-96 h-96 bg-[#C8553D]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-8 w-72 h-72 bg-[#D4A843]/7 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4A843]/12 border border-[#D4A843]/25 text-[#D4A843] text-xs font-bold uppercase tracking-widest mb-5">
                <MapPin className="w-3 h-3" />
                Marketplace
              </div>
              <h2
                className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Des millions de clients découvrent des restaurants chaque mois
              </h2>
              <p className="text-white/45 text-sm leading-relaxed mb-7 max-w-sm">
                TérangaTable est aussi une marketplace de découverte — vos futurs clients y cherchent, commandent et réservent. Référencez votre restaurant et touchez une nouvelle clientèle dès aujourd&apos;hui.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    href="/decouvrir"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C8553D] text-white font-semibold text-sm hover:bg-[#A33D28] transition-colors shadow-xl shadow-[#C8553D]/20"
                  >
                    <MapPin className="w-4 h-4" />
                    Explorer la marketplace
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/18 text-white/70 font-semibold text-sm hover:border-white/35 hover:text-white transition-all"
                  >
                    Référencer mon restaurant
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Right — city grid */}
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-[0.2em] font-semibold mb-4">Villes disponibles</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {cities.map((city) => (
                  <motion.div key={city.slug} whileHover={{ scale: 1.06, y: -2 }} transition={{ duration: 0.18 }}>
                    <Link
                      href={`/decouvrir/${city.slug}`}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                        city.highlight
                          ? 'bg-[#C8553D]/15 border-[#C8553D]/30 hover:bg-[#C8553D]/22'
                          : 'bg-white/5 border-white/8 hover:bg-white/10 hover:border-white/16'
                      }`}
                    >
                      <span className="text-2xl">{city.flag}</span>
                      <span className="text-white/75 text-xs font-semibold">{city.name}</span>
                      <span className="text-white/30 text-[10px] font-mono">{city.count} restos</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <Link
                href="/decouvrir"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/8 text-white/35 text-xs hover:text-white/60 hover:border-white/18 transition-colors"
              >
                Voir toutes les villes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-[#111110]">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          tag="Témoignages"
          title="Ils nous font confiance"
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.author}
              className="relative rounded-2xl border border-white/8 bg-[#161614] p-6 flex flex-col gap-4 group"
              variants={{
                hidden: { opacity: 0, y: 28 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
              }}
              whileHover={{ y: -5, borderColor: 'rgba(255,255,255,0.14)', transition: { duration: 0.22 } }}
            >
              {/* Quote mark */}
              <div className="text-5xl font-serif leading-none" style={{ color: `${t.color}30` }}>&ldquo;</div>

              {/* Stars */}
              <div className="flex gap-1 -mt-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#D4A843] text-[#D4A843]" />
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section id="tarifs" className="py-24 px-4 sm:px-6 bg-[#0C0C0A]">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          tag="Tarifs"
          title="Des tarifs adaptés à votre restaurant"
          sub="Commencez gratuitement pendant 14 jours. Aucune carte bancaire requise."
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl flex flex-col p-7 ${
                plan.highlight
                  ? 'bg-[#161614] border-2 shadow-[0_0_70px_rgba(200,85,61,0.18)]'
                  : 'bg-[#161614] border border-white/8'
              }`}
              style={plan.highlight ? { borderColor: 'rgba(200,85,61,0.55)' } : {}}
              variants={{
                hidden: { opacity: 0, y: 28 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
              }}
              whileHover={{ y: -4, transition: { duration: 0.22 } }}
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

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
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
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Regions ────────────────────────────────────────────────────────────────────

function RegionsSection() {
  return (
    <section id="regions" className="py-24 px-4 sm:px-6 bg-[#111110]">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          tag="Couverture"
          title="Disponible à travers l'Afrique"
          sub="Localisé pour chaque marché — devises, langues et réglementations locales."
        />

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {REGIONS.map((r) => (
            <motion.div
              key={r.city}
              className={`rounded-2xl border p-5 flex flex-col gap-2.5 ${
                r.status === 'soon'
                  ? 'bg-[#161614] border-white/5 opacity-45 cursor-default'
                  : 'bg-[#161614] border-white/8 hover:border-white/18 hover:bg-[#1C1C1A] transition-all cursor-default'
              }`}
              variants={{
                hidden: { opacity: 0, scale: 0.94 },
                visible: {
                  opacity: r.status === 'soon' ? 0.45 : 1,
                  scale: 1,
                  transition: { duration: 0.4, ease: EASE },
                },
              }}
              whileHover={r.status !== 'soon' ? { y: -4, transition: { duration: 0.2 } } : {}}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{r.flag}</span>
                {r.status === 'soon' && (
                  <span className="text-[10px] font-bold bg-[#D4A843]/12 text-[#D4A843] px-2 py-0.5 rounded-full border border-[#D4A843]/18">
                    Bientôt
                  </span>
                )}
              </div>
              <div>
                <div className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-heading)' }}>{r.city}</div>
                <div className="text-white/38 text-sm">{r.country}</div>
              </div>
              <div className="text-xs font-mono text-[#C8553D] font-semibold">{r.currency}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="relative py-28 px-4 sm:px-6 overflow-hidden bg-[#0C0C0A]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#C8553D]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-[#D4A843]/6 rounded-full blur-3xl" />
      </div>
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
    <footer className="bg-[#080807] text-white/38 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#C8553D] flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-white font-bold" style={{ fontFamily: 'var(--font-heading)' }}>TérangaTable</span>
          </div>
          <p className="text-sm leading-relaxed max-w-[200px] mb-5">
            Le Shopify + Odoo de la Restauration en Afrique.
          </p>
          <div className="flex gap-2">
            {['𝕏', 'in', 'f'].map((s) => (
              <a
                key={s}
                href="#"
                className="w-8 h-8 rounded-full border border-white/8 flex items-center justify-center text-xs hover:bg-[#C8553D]/18 hover:border-[#C8553D]/35 hover:text-white transition-all"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="text-white text-sm font-semibold mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 px-4 sm:px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} TérangaTable — Tous droits réservés.</p>
          <p>Made with <span className="text-[#C8553D]">♥</span> pour la restauration africaine</p>
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
        <DashboardPreview />
        <MarketplaceCtaSection />
        <TestimonialsSection />
        <PricingSection />
        <RegionsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
