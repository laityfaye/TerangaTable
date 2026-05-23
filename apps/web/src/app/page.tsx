import Link from 'next/link';

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Caisse & POS',
    description: 'Terminal tactile optimisé pour tablettes. Prise de commande rapide, paiements multiples, tickets imprimés.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    title: 'Menu digital',
    description: 'Carte en ligne personnalisable avec photos, allergènes et filtres. Mise à jour instantanée.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Gestion des commandes',
    description: 'Kanban en temps réel pour la cuisine. Workflows personnalisables, alertes sonores, suivi statut.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Réservations en ligne',
    description: 'Formulaire de réservation intégré au site vitrine. Plan de salle, confirmation automatique.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'CRM & Fidélité',
    description: 'Base clients centralisée, historique des commandes, programme de fidélité points.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Analytics & Rapports',
    description: 'Chiffre d\'affaires, produits phares, heures de pointe. Tableaux de bord en temps réel.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'Site vitrine',
    description: 'Votre propre page restaurant avec domaine personnalisé. SEO, réservations, menu public.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Livraison & Zones',
    description: 'Gestion des chauffeurs, zones de livraison et frais. Suivi en temps réel.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '15 000',
    currency: 'XOF',
    period: '/mois',
    description: 'Pour les petits restaurants qui démarrent',
    color: '#D4A843',
    features: [
      'Jusqu\'à 2 utilisateurs',
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
    period: '/mois',
    description: 'Pour les restaurants en croissance',
    color: '#C8553D',
    features: [
      'Jusqu\'à 10 utilisateurs',
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
    period: '/mois',
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
    cta: 'Contacter l\'équipe',
    highlight: false,
  },
];

const REGIONS = [
  { city: 'Dakar', country: 'Sénégal', flag: '🇸🇳', currency: 'XOF', status: 'active' },
  { city: 'Thiès', country: 'Sénégal', flag: '🇸🇳', currency: 'XOF', status: 'active' },
  { city: 'Saint-Louis', country: 'Sénégal', flag: '🇸🇳', currency: 'XOF', status: 'active' },
  { city: 'Abidjan', country: 'Côte d\'Ivoire', flag: '🇨🇮', currency: 'XOF', status: 'active' },
  { city: 'Casablanca', country: 'Maroc', flag: '🇲🇦', currency: 'MAD', status: 'active' },
  { city: 'Paris', country: 'France', flag: '🇫🇷', currency: 'EUR', status: 'soon' },
];

const STATS = [
  { value: '500+', label: 'Restaurants actifs' },
  { value: '5', label: 'Pays couverts' },
  { value: '99.9%', label: 'Disponibilité' },
  { value: '24/7', label: 'Support client' },
];

// ── Components ─────────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A18]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#C8553D] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            TérangaTable
          </span>
        </div>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#fonctionnalites" className="text-sm text-white/70 hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#tarifs" className="text-sm text-white/70 hover:text-white transition-colors">Tarifs</a>
          <a href="#regions" className="text-sm text-white/70 hover:text-white transition-colors">Régions</a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-4 py-2 rounded-full text-white bg-[#C8553D] hover:bg-[#A33D28] transition-colors"
          >
            Essai gratuit
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-[#1A1A18]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #C8553D 0px,
              #C8553D 1px,
              transparent 1px,
              transparent 12px
            )`,
          }}
        />
      </div>

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C8553D]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-6 py-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8553D]/40 bg-[#C8553D]/10 text-[#E8826F] text-xs font-semibold tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8553D] inline-block animate-pulse" />
          Nouveau — Disponible en Côte d&apos;Ivoire & Maroc
        </div>

        {/* Headline */}
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Gérez votre restaurant,{' '}
          <span className="text-[#C8553D]">développez</span>{' '}
          votre business
        </h1>

        {/* Sub */}
        <p className="text-white/60 text-lg sm:text-xl max-w-2xl leading-relaxed">
          Le Shopify + Odoo de la Restauration en Afrique. Caisse, menu digital,
          commandes, réservations et analytics — tout en un.
        </p>

        {/* Decorative line */}
        <div className="w-16 h-px bg-[#C8553D]" />

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-full font-semibold text-white text-sm tracking-wide bg-[#C8553D] hover:bg-[#A33D28] transition-colors"
          >
            Commencer gratuitement
          </Link>
          <a
            href="#fonctionnalites"
            className="px-8 py-3.5 rounded-full font-semibold text-white text-sm tracking-wide border-2 border-white/20 hover:border-white/50 hover:bg-white/5 transition-all"
          >
            Voir les fonctionnalités
          </a>
        </div>

        <p className="text-white/30 text-xs mt-2">
          14 jours gratuits · Aucune carte bancaire requise
        </p>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
        <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="bg-[#C8553D] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center text-white">
        {STATS.map((s) => (
          <div key={s.label}>
            <div
              className="text-3xl sm:text-4xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {s.value}
            </div>
            <div className="text-white/80 text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="py-24 px-4 sm:px-6 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#C8553D]" />
            <span className="text-sm uppercase tracking-widest font-semibold text-[#C8553D]">
              Fonctionnalités
            </span>
            <div className="h-px w-12 bg-[#C8553D]" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Tout ce dont votre restaurant a besoin
          </h2>
          <p className="text-[#57534E] text-base sm:text-lg mt-4 max-w-2xl mx-auto">
            Une plateforme complète pensée pour les restaurants africains,
            de la prise de commande jusqu&apos;à l&apos;analyse de vos performances.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-lg border border-[#E7E5E4] p-5 hover:shadow-md hover:border-[#C8553D]/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#C8553D]/10 flex items-center justify-center text-[#C8553D] mb-4 group-hover:bg-[#C8553D] group-hover:text-white transition-all">
                {f.icon}
              </div>
              <h3 className="font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                {f.title}
              </h3>
              <p className="text-[#57534E] text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-[#1A1A18] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#C8553D]" />
            <span className="text-sm uppercase tracking-widest font-semibold text-[#C8553D]">
              Dashboard
            </span>
            <div className="h-px w-12 bg-[#C8553D]" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Un tableau de bord pensé pour l&apos;Afrique
          </h2>
          <p className="text-white/60 text-base mt-4 max-w-xl mx-auto">
            Interface rapide et intuitive, conçue pour fonctionner même avec une
            connexion internet limitée.
          </p>
        </div>

        {/* Mock dashboard frame */}
        <div className="relative mx-auto max-w-4xl rounded-xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Browser bar */}
          <div className="bg-[#2A2A28] px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <div className="flex-1 mx-3 h-6 bg-[#1A1A18] rounded-md flex items-center px-3">
              <span className="text-white/30 text-xs font-mono">app.terangatable.com/dashboard</span>
            </div>
          </div>

          {/* Dashboard content mock */}
          <div className="bg-[#FAFAF8] flex" style={{ height: 360 }}>
            {/* Sidebar */}
            <div className="w-52 bg-[#1A1A18] flex flex-col py-4 gap-1 shrink-0">
              <div className="px-4 mb-2">
                <div className="w-24 h-4 bg-white/20 rounded" />
              </div>
              {['Tableau de bord', 'Commandes', 'Menu', 'POS', 'Réservations', 'Analytics'].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg ${
                    i === 1 ? 'bg-[#C8553D]/15 border-l-2 border-[#C8553D]' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded ${i === 1 ? 'bg-[#C8553D]' : 'bg-white/15'}`} />
                  <div className={`h-2.5 rounded ${i === 1 ? 'bg-white w-20' : 'bg-white/20 w-16'}`} />
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="w-32 h-5 bg-[#1C1917]/30 rounded mb-1" />
                  <div className="w-20 h-3 bg-[#1C1917]/15 rounded" />
                </div>
                <div className="w-28 h-8 bg-[#C8553D] rounded-lg" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['CA du jour', 'Commandes', 'Table libre'].map((label, i) => (
                  <div key={label} className="bg-white rounded-lg p-3 border border-[#E7E5E4]">
                    <div className="text-xs text-[#57534E] mb-1">{label}</div>
                    <div
                      className="h-6 rounded"
                      style={{
                        background: i === 0 ? '#C8553D20' : i === 1 ? '#D4A84320' : '#2D6A4F20',
                        width: ['70%', '55%', '45%'][i],
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Kanban preview */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Nouvelle', color: '#F59E0B', count: 3 },
                  { label: 'En cuisine', color: '#3B82F6', count: 5 },
                  { label: 'Prête', color: '#10B981', count: 2 },
                ].map((col) => (
                  <div key={col.label} className="rounded-lg overflow-hidden">
                    <div
                      className="px-2 py-1.5 text-xs font-semibold text-white flex items-center justify-between"
                      style={{ backgroundColor: col.color }}
                    >
                      <span>{col.label}</span>
                      <span className="bg-white/20 px-1.5 rounded-full text-[10px]">{col.count}</span>
                    </div>
                    {Array.from({ length: Math.min(col.count, 2) }).map((_, j) => (
                      <div
                        key={j}
                        className="bg-white border border-[#E7E5E4] rounded p-2 mt-1 space-y-1"
                      >
                        <div className="w-16 h-2 bg-[#1C1917]/20 rounded" />
                        <div className="w-12 h-2 bg-[#57534E]/15 rounded" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="tarifs" className="py-24 px-4 sm:px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#C8553D]" />
            <span className="text-sm uppercase tracking-widest font-semibold text-[#C8553D]">
              Tarifs
            </span>
            <div className="h-px w-12 bg-[#C8553D]" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Des tarifs adaptés à votre restaurant
          </h2>
          <p className="text-[#57534E] mt-4 max-w-xl mx-auto">
            Commencez gratuitement pendant 14 jours. Aucune carte bancaire requise.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-[#1A1A18] border-[#C8553D] shadow-xl'
                  : 'bg-white border-[#E7E5E4] shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-bold bg-[#C8553D]">
                  Le plus populaire
                </div>
              )}

              {/* Name + price */}
              <div className="mb-6">
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: plan.color }}
                >
                  {plan.name}
                </div>
                <div className="flex items-end gap-1">
                  <span
                    className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-[#1C1917]'}`}
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {plan.price}
                  </span>
                  <span className={`text-sm mb-1 ${plan.highlight ? 'text-white/60' : 'text-[#57534E]'}`}>
                    {plan.currency}{plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${plan.highlight ? 'text-white/50' : 'text-[#57534E]'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <svg
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: plan.color }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={`text-sm ${plan.highlight ? 'text-white/80' : 'text-[#1C1917]'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className="block text-center py-3 rounded-full font-semibold text-sm transition-all"
                style={
                  plan.highlight
                    ? { backgroundColor: plan.color, color: '#fff' }
                    : { backgroundColor: `${plan.color}15`, color: plan.color }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RegionsSection() {
  return (
    <section id="regions" className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-[#C8553D]" />
            <span className="text-sm uppercase tracking-widest font-semibold text-[#C8553D]">
              Couverture
            </span>
            <div className="h-px w-12 bg-[#C8553D]" />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Disponible à travers l&apos;Afrique
          </h2>
          <p className="text-[#57534E] mt-4 max-w-xl mx-auto">
            Localisé pour chaque marché — devises, langues et réglementations locales.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {REGIONS.map((r) => (
            <div
              key={r.city}
              className={`rounded-xl border p-5 flex flex-col gap-2 ${
                r.status === 'soon'
                  ? 'bg-[#F5F4F2] border-[#E7E5E4] opacity-60'
                  : 'bg-white border-[#E7E5E4] hover:border-[#C8553D]/40 hover:shadow-sm transition-all'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{r.flag}</span>
                {r.status === 'soon' && (
                  <span className="text-[10px] font-bold bg-[#D4A843]/20 text-[#D4A843] px-2 py-0.5 rounded-full">
                    Bientôt
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {r.city}
                </div>
                <div className="text-sm text-[#57534E]">{r.country}</div>
              </div>
              <div className="text-xs font-mono text-[#C8553D] font-semibold">{r.currency}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-[#C8553D]">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Prêt à transformer votre restaurant ?
        </h2>
        <p className="text-white/80 text-lg mb-8">
          Rejoignez 500+ restaurateurs qui ont déjà choisi TérangaTable.
          14 jours gratuits, sans engagement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-full font-bold text-[#C8553D] bg-white hover:bg-[#FAFAF8] transition-colors text-sm"
          >
            Commencer gratuitement
          </Link>
          <a
            href="mailto:contact@terangatable.com"
            className="px-8 py-4 rounded-full font-semibold text-white border-2 border-white/50 hover:border-white hover:bg-white/10 transition-all text-sm"
          >
            Contacter l&apos;équipe
          </a>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="bg-[#1A1A18] text-white/50 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-[#C8553D] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
              </div>
              <span className="text-white font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                TérangaTable
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Le Shopify + Odoo de la Restauration en Afrique.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#regions" className="hover:text-white transition-colors">Régions</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Entreprise</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li>
                <a href="mailto:contact@terangatable.com" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Conditions d&apos;utilisation</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} TérangaTable — Tous droits réservés.</p>
          <p>
            Made with <span className="text-[#C8553D]">♥</span> pour la restauration africaine
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <DashboardPreview />
        <PricingSection />
        <RegionsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
