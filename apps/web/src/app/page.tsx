'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowRight, MapPin, Zap, Users, BarChart3,
  Smartphone, Calendar, ShoppingBag, Globe,
  CheckCircle2, Star, Package, TrendingUp,
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

const HERO_SLIDES = [
  {
    id: 'platform' as const,
    badge: 'Plateforme tout-en-un',
    title: 'La plateforme qui fait tout pour votre restaurant',
    sub: 'Caisse POS, menu digital, commandes, réservations et analytics — tout ce dont votre restaurant a besoin, en un seul outil.',
    chips: ['Tableau de bord unifié', 'Temps réel', 'Multi-sites'],
    accent: '#C8553D',
    glow: 'rgba(200,85,61,0.18)',
  },
  {
    id: 'pos' as const,
    badge: 'Caisse & POS',
    title: 'Encaissez en quelques touches, sans friction',
    sub: 'Terminal tactile optimisé tablette. Prise de commande ultra-rapide, paiements Wave, Orange Money et espèces — tickets imprimés instantanément.',
    chips: ['Wave & Orange Money', 'Hors-ligne disponible', 'Impression auto'],
    accent: '#D4A843',
    glow: 'rgba(212,168,67,0.18)',
  },
  {
    id: 'orders' as const,
    badge: 'Gestion commandes',
    title: 'La cuisine sait toujours où en est chaque commande',
    sub: 'Kanban en temps réel entre la salle et la cuisine. Alertes sonores, statuts colorés, workflows personnalisables pour vos équipes.',
    chips: ['Kanban temps réel', 'Alertes cuisine', 'Zéro papier'],
    accent: '#2D6A4F',
    glow: 'rgba(45,106,79,0.18)',
  },
  {
    id: 'analytics' as const,
    badge: 'Analytics & Rapports',
    title: 'Prenez les bonnes décisions grâce aux données',
    sub: "Chiffre d'affaires, plats stars, heures de pointe, fidélité client — visualisez tout ce qui compte et agissez en temps réel.",
    chips: ['Rapports auto', 'Plats best-sellers', 'Prévisions CA'],
    accent: '#C8553D',
    glow: 'rgba(200,85,61,0.18)',
  },
];

type SlideId = 'platform' | 'pos' | 'orders' | 'analytics';

// ── Hero Visuals ───────────────────────────────────────────────────────────────

function PlatformVisual() {
  return (
    <div className="relative w-full max-w-[340px] md:max-w-[440px]">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] bg-[#161614]">
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
        <div className="flex" style={{ height: 320 }}>
          <div className="w-40 bg-[#111110] flex flex-col py-4 gap-0.5 shrink-0">
            <div className="px-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#C8553D] flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">T</span>
                </div>
                <div className="w-16 h-2.5 bg-white/20 rounded" />
              </div>
            </div>
            {[
              { label: 'Tableau de bord', active: true },
              { label: 'Commandes', active: false },
              { label: 'Menu', active: false },
              { label: 'POS', active: false },
              { label: 'Réservations', active: false },
              { label: 'Analytics', active: false },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg ${item.active ? 'bg-[#C8553D]/15 border border-[#C8553D]/20' : ''}`}>
                <div className={`w-3.5 h-3.5 rounded ${item.active ? 'bg-[#C8553D]' : 'bg-white/10'}`} />
                <div className={`h-2 rounded ${item.active ? 'bg-white/85 w-16' : 'bg-white/15 w-12'}`} />
              </div>
            ))}
          </div>
          <div className="flex-1 p-4 bg-[#FAFAF8] overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="w-28 h-3.5 bg-[#1C1917]/25 rounded mb-1.5" />
                <div className="w-20 h-2.5 bg-[#1C1917]/12 rounded" />
              </div>
              <div className="w-20 h-7 bg-[#C8553D] rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'CA Auj.', val: '142 500 F', color: '#C8553D' },
                { label: 'Commandes', val: '28', color: '#D4A843' },
                { label: 'Tables', val: '6/12', color: '#2D6A4F' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-2.5 border border-[#E7E5E4]">
                  <div className="text-[9px] text-[#57534E] mb-1">{s.label}</div>
                  <div className="text-xs font-bold" style={{ color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#E7E5E4] p-3">
              <div className="text-[9px] font-bold text-[#1C1917] mb-2">Activité récente</div>
              {[
                { w: 'w-24', col: '#2D6A4F' }, { w: 'w-16', col: '#D4A843' }, { w: 'w-20', col: '#C8553D' },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: r.col }} />
                  <div className={`h-2 ${r.w} bg-[#1C1917]/15 rounded`} />
                  <div className="ml-auto w-10 h-2 bg-[#1C1917]/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <motion.div className="absolute -left-12 top-14 bg-[#1E1E1B] border border-white/10 rounded-2xl p-4 shadow-2xl w-44 backdrop-blur-sm hidden lg:block" animate={{ y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="text-[9px] text-[#D4A843] font-bold uppercase tracking-widest mb-2">Ventes du jour</div>
        <div className="text-white font-bold text-xl leading-none" style={{ fontFamily: 'var(--font-heading)' }}>348 500<span className="text-[10px] text-white/35 font-normal ml-1">F CFA</span></div>
        <div className="flex items-center gap-1 mt-2"><TrendingUp className="w-3 h-3 text-[#2D6A4F]" /><span className="text-[#2D6A4F] text-[10px] font-semibold">+23% vs hier</span></div>
      </motion.div>
      <motion.div className="absolute -right-10 bottom-14 bg-[#1E1E1B] border border-white/10 rounded-2xl p-3.5 shadow-2xl w-36 hidden lg:block" animate={{ y: [0, 7, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}>
        <div className="text-[9px] text-[#C8553D] font-bold uppercase tracking-widest mb-2">Commandes</div>
        <div className="text-white font-bold text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>28</div>
        <div className="flex items-end gap-0.5 mt-2 h-6">
          {[3, 4, 5, 3, 5, 6, 5].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 16}%`, backgroundColor: i === 6 ? '#C8553D' : 'rgba(200,85,61,0.35)' }} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function POSVisual() {
  return (
    <div className="relative w-full max-w-[340px] md:max-w-[440px]">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] bg-[#161614]">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1E1E1B] border-b border-white/6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 mx-3 h-5 bg-[#0C0C0A] rounded-md flex items-center px-3">
            <div className="w-2 h-2 rounded-full bg-[#D4A843] mr-2 shrink-0" />
            <span className="text-white/25 text-[10px] font-mono">app.terangatable.com/pos</span>
          </div>
        </div>
        <div className="flex" style={{ height: 320 }}>
          <div className="flex-1 bg-[#FAFAF8] p-3 overflow-hidden">
            <div className="text-[10px] font-bold text-[#1C1917] mb-2">Menu</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Thiéboudienne', price: '4 500', color: '#C8553D' },
                { name: 'Yassa Poulet', price: '3 800', color: '#D4A843' },
                { name: 'Mafé Bœuf', price: '4 200', color: '#2D6A4F' },
                { name: 'Ceebu Yapp', price: '5 000', color: '#C8553D' },
              ].map((item) => (
                <div key={item.name} className="bg-white rounded-xl p-2.5 border border-[#E7E5E4]">
                  <div className="w-full h-10 rounded-lg mb-2 flex items-center justify-center" style={{ backgroundColor: `${item.color}18` }}>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `${item.color}35` }} />
                  </div>
                  <div className="text-[8px] font-semibold text-[#1C1917] truncate">{item.name}</div>
                  <div className="text-[9px] font-bold mt-0.5" style={{ color: item.color }}>{item.price} F</div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-36 bg-[#111110] p-3 flex flex-col">
            <div className="text-[9px] font-bold text-white/60 mb-2 uppercase tracking-wider">Commande #47</div>
            <div className="flex-1 space-y-1.5">
              {[
                { name: 'Thiéboudienne', qty: 2, price: '9 000' },
                { name: 'Yassa Poulet', qty: 1, price: '3 800' },
                { name: 'Bissap', qty: 2, price: '1 200' },
              ].map((item) => (
                <div key={item.name} className="bg-white/6 rounded-lg p-2">
                  <div className="text-[8px] text-white/70 truncate">{item.name}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[8px] text-white/35">×{item.qty}</span>
                    <span className="text-[8px] text-white/60 font-bold">{item.price} F</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="flex justify-between mb-2">
                <span className="text-[9px] text-white/40">Total</span>
                <span className="text-[10px] text-white font-bold">14 000 F</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button className="bg-[#1BA9D4] rounded-lg py-1.5 text-[8px] font-bold text-white">Wave</button>
                <button className="bg-[#F77F00] rounded-lg py-1.5 text-[8px] font-bold text-white">Orange</button>
              </div>
              <button className="w-full mt-1 bg-[#C8553D] rounded-lg py-1.5 text-[8px] font-bold text-white">Espèces</button>
            </div>
          </div>
        </div>
      </div>
      <motion.div className="absolute -left-12 top-12 bg-[#1E1E1B] border border-white/10 rounded-2xl p-3.5 shadow-2xl w-40 hidden lg:block" animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="text-[9px] text-[#D4A843] font-bold uppercase tracking-widest mb-1.5">Paiements</div>
        <div className="space-y-1">
          {[{ m: 'Wave', v: '8 600 F', c: '#1BA9D4' }, { m: 'Orange', v: '5 400 F', c: '#F77F00' }].map((p) => (
            <div key={p.m} className="flex items-center justify-between">
              <span className="text-[9px] text-white/50">{p.m}</span>
              <span className="text-[9px] font-bold" style={{ color: p.c }}>{p.v}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function OrdersVisual() {
  const cols = [
    { label: 'Nouvelles', color: '#F59E0B', items: ['Table 3 · 4 pers.', 'Livraison #82'] },
    { label: 'En cuisine', color: '#3B82F6', items: ['Table 7 · URGENT', 'Table 1', 'À emporter #44'] },
    { label: 'Prêtes', color: '#10B981', items: ['Table 5', 'Livraison #79'] },
  ];
  return (
    <div className="relative w-full max-w-[340px] md:max-w-[460px]">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] bg-[#161614]">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1E1E1B] border-b border-white/6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 mx-3 h-5 bg-[#0C0C0A] rounded-md flex items-center px-3">
            <div className="w-2 h-2 rounded-full bg-[#2D6A4F] mr-2 shrink-0" />
            <span className="text-white/25 text-[10px] font-mono">app.terangatable.com/commandes</span>
          </div>
        </div>
        <div className="p-4 bg-[#FAFAF8]" style={{ minHeight: 300 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-[#1C1917]">Cuisine en temps réel</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse" />
              <span className="text-[9px] text-[#2D6A4F] font-semibold">Live</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {cols.map((col) => (
              <div key={col.label}>
                <div className="flex items-center justify-between px-2 py-1.5 rounded-t-xl mb-1" style={{ backgroundColor: col.color }}>
                  <span className="text-[9px] font-bold text-white truncate">{col.label}</span>
                  <span className="bg-white/25 px-1.5 py-0.5 rounded text-[8px] text-white font-bold ml-1">{col.items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {col.items.map((item, j) => (
                    <div key={j} className={`bg-white rounded-xl p-2.5 border shadow-sm ${item.includes('URGENT') ? 'border-red-300' : 'border-[#E7E5E4]'}`}>
                      {item.includes('URGENT') && <div className="text-[8px] text-red-500 font-bold mb-0.5 uppercase tracking-wide">⚡ Urgent</div>}
                      <div className="text-[9px] font-semibold text-[#1C1917] truncate">{item.replace(' · URGENT', '')}</div>
                      <div className="w-8 h-1.5 bg-[#1C1917]/10 rounded mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <motion.div className="absolute -right-10 top-14 bg-[#1E1E1B] border border-white/10 rounded-2xl p-3.5 shadow-2xl w-36 hidden lg:block" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="text-[9px] text-[#2D6A4F] font-bold uppercase tracking-widest mb-2">Temps moyen</div>
        <div className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-heading)' }}>12 <span className="text-sm text-white/40 font-normal">min</span></div>
        <div className="text-[8px] text-[#2D6A4F] mt-1">↓ 3 min vs hier</div>
      </motion.div>
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [45, 62, 48, 78, 91, 55, 83];
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  return (
    <div className="relative w-full max-w-[340px] md:max-w-[440px]">
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] bg-[#161614]">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1E1E1B] border-b border-white/6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 mx-3 h-5 bg-[#0C0C0A] rounded-md flex items-center px-3">
            <div className="w-2 h-2 rounded-full bg-[#C8553D] mr-2 shrink-0" />
            <span className="text-white/25 text-[10px] font-mono">app.terangatable.com/analytics</span>
          </div>
        </div>
        <div className="p-4 bg-[#FAFAF8]" style={{ minHeight: 300 }}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'CA semaine', val: '2 840 000', unit: 'F CFA', color: '#C8553D', up: '+18%' },
              { label: 'Commandes', val: '196', unit: 'cmd', color: '#D4A843', up: '+12%' },
              { label: 'Panier moyen', val: '14 490', unit: 'F', color: '#2D6A4F', up: '+5%' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl p-2.5 border border-[#E7E5E4]">
                <div className="text-[8px] text-[#57534E] mb-1 leading-tight">{kpi.label}</div>
                <div className="text-[10px] font-bold leading-tight" style={{ color: kpi.color }}>{kpi.val}<span className="text-[7px] text-[#57534E] font-normal ml-0.5">{kpi.unit}</span></div>
                <div className="text-[7px] text-[#2D6A4F] font-semibold mt-0.5">{kpi.up}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-3 border border-[#E7E5E4] mb-2">
            <div className="text-[9px] font-bold text-[#1C1917] mb-2">CA par jour (sem.)</div>
            <div className="flex items-end gap-1 h-16">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm" style={{ height: `${h}%`, backgroundColor: i === 4 ? '#C8553D' : 'rgba(200,85,61,0.28)' }} />
                  <span className="text-[7px] text-[#57534E]">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-[#E7E5E4]">
            <div className="text-[9px] font-bold text-[#1C1917] mb-2">Plats best-sellers</div>
            {[
              { name: 'Thiéboudienne', pct: 88 },
              { name: 'Yassa Poulet', pct: 64 },
              { name: 'Mafé Bœuf', pct: 51 },
            ].map((p) => (
              <div key={p.name} className="mb-1.5">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[8px] text-[#57534E]">{p.name}</span>
                  <span className="text-[8px] font-bold text-[#C8553D]">{p.pct}%</span>
                </div>
                <div className="h-1 bg-[#1C1917]/8 rounded-full">
                  <div className="h-1 bg-[#C8553D] rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <motion.div className="absolute -left-12 bottom-14 bg-[#1E1E1B] border border-white/10 rounded-2xl p-4 shadow-2xl w-44 hidden lg:block" animate={{ y: [0, -7, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="text-[9px] text-[#C8553D] font-bold uppercase tracking-widest mb-2">Meilleure heure</div>
        <div className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-heading)' }}>12h – 14h</div>
        <div className="text-[8px] text-white/40 mt-1">67 commandes en moyenne</div>
      </motion.div>
    </div>
  );
}

function SlideVisual({ id }: { id: SlideId }) {
  if (id === 'platform') return <PlatformVisual />;
  if (id === 'pos') return <POSVisual />;
  if (id === 'orders') return <OrdersVisual />;
  return <AnalyticsVisual />;
}

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
  const SLIDE_DURATION = 5000;
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
      const next = (current + 1) % HERO_SLIDES.length;
      goTo(next, 1);
    }, SLIDE_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, goTo]);

  const slide = HERO_SLIDES[current];

  const textVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
    exit: (d: number) => ({ opacity: 0, x: d * -30, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } }),
  };

  const visualVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * 60, scale: 0.94 }),
    center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
    exit: (d: number) => ({ opacity: 0, x: d * -40, scale: 0.96, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }),
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col overflow-hidden bg-[#0C0C0A]">
      <div className="grain-layer" aria-hidden />

      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${current}`}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{ background: `radial-gradient(ellipse 60% 50% at 70% 30%, ${slide.glow} 0%, transparent 70%)` }}
        />
      </AnimatePresence>
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-6 sm:pb-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">

          {/* ── Left: copy ── */}
          <div className="flex flex-col gap-6 min-h-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`copy-${current}`}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-6"
              >
                <span
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border self-start text-xs font-semibold tracking-wide"
                  style={{ borderColor: `${slide.accent}40`, backgroundColor: `${slide.accent}12`, color: slide.accent }}
                >
                  <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: slide.accent }} />
                  {slide.badge}
                </span>

                <h1
                  className="text-4xl sm:text-5xl xl:text-[3.4rem] font-bold text-white leading-[1.08] tracking-tight"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {slide.title}
                </h1>

                <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-lg">
                  {slide.sub}
                </p>

                <div className="flex flex-wrap gap-2">
                  {slide.chips.map((chip) => (
                    <span key={chip} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-white/65 text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" style={{ color: slide.accent }} />
                      {chip}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-white text-sm bg-[#C8553D] hover:bg-[#A33D28] transition-colors shadow-2xl shadow-[#C8553D]/30">
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <a href="#fonctionnalites" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white/70 text-sm border border-white/15 hover:border-white/35 hover:text-white hover:bg-white/5 transition-all">
                  Voir les fonctionnalités
                </a>
              </motion.div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              {['14 jours gratuits', 'Aucune CB requise', 'Résiliation facile'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-white/35">
                  <span className="text-[#2D6A4F] font-bold text-sm">✓</span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: visual ── */}
          <div className="relative hidden md:flex items-center justify-center lg:justify-end">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`visual-${current}`}
                custom={direction}
                variants={visualVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full flex justify-center"
              >
                <SlideVisual id={slide.id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div className="relative z-10 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex-1 flex gap-2">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className="flex-1 h-1 rounded-full bg-white/12 overflow-hidden relative focus:outline-none min-h-[16px] flex items-center"
                aria-label={`Slide ${i + 1}`}
              >
                {i === current && (
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: slide.accent, width: `${progress}%` }}
                    transition={{ duration: 0 }}
                  />
                )}
                {i < current && (
                  <div className="absolute inset-0 rounded-full opacity-50" style={{ backgroundColor: slide.accent }} />
                )}
              </button>
            ))}
          </div>

          <span className="text-white/25 text-xs font-mono tabular-nums">
            {String(current + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(HERO_SLIDES.length).padStart(2, '0')}
          </span>

          <div className="flex gap-1.5">
            <button
              onClick={() => goTo((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length, -1)}
              className="w-10 h-10 rounded-full border border-white/12 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-colors focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goTo((current + 1) % HERO_SLIDES.length, 1)}
              className="w-10 h-10 rounded-full border border-white/12 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-colors focus:outline-none"
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

          <div className="overflow-x-auto scrollbar-hide rounded-2xl">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.85)] min-w-[640px]">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
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
                      <span className="text-white/60 text-xs font-bold">{city.name.slice(0, 2).toUpperCase()}</span>
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
              className={`rounded-2xl border overflow-hidden flex flex-col ${
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
              {/* Flag stripes — 3px top border */}
              <div className="flex h-[3px] shrink-0">
                {r.stripes.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>

              <div className="p-5 flex flex-col gap-2.5 flex-1">
                <div className="flex items-start justify-between">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `${r.primary}22`, color: r.primary }}
                  >
                    {r.code}
                  </span>
                  {r.status === 'soon' ? (
                    <span className="text-[10px] font-bold bg-[#D4A843]/12 text-[#D4A843] px-2 py-0.5 rounded-full border border-[#D4A843]/18">
                      Bientôt
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-[#2D6A4F] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] animate-pulse inline-block" />
                      Actif
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-heading)' }}>{r.city}</div>
                  <div className="text-white/38 text-sm">{r.country}</div>
                </div>
                <div className="text-xs font-mono font-semibold" style={{ color: r.primary }}>{r.currency}</div>
              </div>
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
