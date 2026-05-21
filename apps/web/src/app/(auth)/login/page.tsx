'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

const TESTIMONIALS = [
  {
    quote:
      'TérangaTable a transformé la gestion de mon restaurant. Je gagne 2h par jour.',
    author: 'Aminata Diallo',
    restaurant: 'Le Baobab · Dakar',
  },
  {
    quote:
      'Le suivi des commandes en temps réel, c\'est ce qui manquait à la restauration africaine.',
    author: 'Kofi Mensah',
    restaurant: 'Saveurs d\'Abidjan · Abidjan',
  },
  {
    quote:
      'De zéro à 300 commandes par semaine en 3 mois. La plateforme est intuitive.',
    author: 'Fatima Benali',
    restaurant: 'Tajine & Co · Casablanca',
  },
];

function WaxPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07]"
      viewBox="0 0 400 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Losanges */}
      <g className="animate-float" style={{ transformOrigin: '200px 150px' }}>
        <polygon points="200,80 240,150 200,220 160,150" fill="#C8553D" />
        <polygon points="200,95 232,150 200,205 168,150" fill="#8A3526" />
      </g>
      <g className="animate-float-slow" style={{ transformOrigin: '80px 300px', animationDelay: '1s' }}>
        <polygon points="80,240 120,300 80,360 40,300" fill="#C8553D" />
        <polygon points="80,255 112,300 80,345 48,300" fill="#D4A843" />
      </g>
      <g className="animate-float" style={{ transformOrigin: '330px 280px', animationDelay: '2s' }}>
        <polygon points="330,220 370,280 330,340 290,280" fill="#D4A843" />
        <polygon points="330,235 362,280 330,325 298,280" fill="#C8553D" />
      </g>
      {/* Triangles */}
      <g className="animate-float-slow" style={{ transformOrigin: '150px 450px', animationDelay: '0.5s' }}>
        <polygon points="150,400 190,470 110,470" fill="#C8553D" />
        <polygon points="150,415 182,465 118,465" fill="#8A3526" />
      </g>
      <g className="animate-float" style={{ transformOrigin: '300px 500px', animationDelay: '1.5s' }}>
        <polygon points="300,460 340,530 260,530" fill="#D4A843" />
      </g>
      {/* Cercles */}
      <circle cx="60" cy="120" r="30" stroke="#C8553D" strokeWidth="4" fill="none"
        className="animate-float-slow" style={{ animationDelay: '3s' }} />
      <circle cx="360" cy="450" r="20" stroke="#D4A843" strokeWidth="3" fill="none"
        className="animate-float" style={{ animationDelay: '2.5s' }} />
      {/* Lignes croisées */}
      <line x1="20" y1="380" x2="100" y2="420" stroke="#C8553D" strokeWidth="2" opacity="0.5" />
      <line x1="100" y1="380" x2="20" y2="420" stroke="#C8553D" strokeWidth="2" opacity="0.5" />
      <line x1="310" y1="100" x2="380" y2="140" stroke="#D4A843" strokeWidth="2" opacity="0.5" />
      <line x1="380" y1="100" x2="310" y2="140" stroke="#D4A843" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

function TestimonialCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-24">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <p className="text-white/70 text-sm italic leading-relaxed">
            &ldquo;{TESTIMONIALS[index]!.quote}&rdquo;
          </p>
          <p className="mt-2 text-white/50 text-xs">
            — {TESTIMONIALS[index]!.author},{' '}
            <span className="text-terracotta-light">{TESTIMONIALS[index]!.restaurant}</span>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/dashboard';

  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      await login(data);
      const user = useAuthStore.getState().user;
      const isPlatformUser =
        user?.roles.includes('super_admin') || user?.roles.includes('regional_admin');

      if (isPlatformUser) {
        router.push('/super-admin');
        return;
      }

      const tenantSlug = user?.tenantSlug;
      const isDev = process.env.NODE_ENV === 'development';

      if (tenantSlug && !isDev) {
        const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? 'terangatable.com';
        window.location.href = `https://${tenantSlug}.${domain}/dashboard`;
      } else {
        router.push(from);
      }
    } catch {
      setServerError('Email ou mot de passe incorrect.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ── Panneau gauche ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#1A1A18] overflow-hidden">
        <WaxPattern />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍽️</span>
            <span className="font-heading font-bold text-white text-2xl tracking-tight">
              TÉRANGATABLE
            </span>
          </div>
          <p className="mt-3 text-white/50 text-sm font-body">
            Le Shopify de la Restauration Africaine
          </p>
        </div>

        {/* Tagline centrale */}
        <div className="relative z-10 text-center py-8">
          <h2 className="font-heading text-white text-4xl font-bold leading-tight">
            Gérez votre restaurant
            <br />
            <span className="text-terracotta">comme un pro.</span>
          </h2>
          <p className="mt-4 text-white/50 text-base font-body max-w-xs mx-auto">
            Commandes, caisse, réservations, analytics — tout en un seul endroit.
          </p>
        </div>

        {/* Testimonials */}
        <div className="relative z-10">
          <div className="w-8 h-px bg-terracotta mb-4" />
          <TestimonialCarousel />
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div className="flex items-center justify-center min-h-screen bg-white px-6 py-12 lg:px-16">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🍽️</span>
            <span className="font-heading font-bold text-[#1A1A18] text-xl">TÉRANGATABLE</span>
          </div>

          <h1 className="font-heading text-3xl font-bold text-[#1C1917]">
            Bon retour 👋
          </h1>
          <p className="mt-2 font-body text-slate-500 text-sm">
            Connectez-vous à votre espace restaurant.
          </p>

          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-5"
            animate={shake ? { x: [0, -6, 6, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="vous@restaurant.com"
                  className={`w-full h-11 pl-9 pr-4 rounded-md border font-body text-sm
                    focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta
                    transition-colors placeholder:text-slate-400
                    ${errors.email ? 'border-red-400' : 'border-[#E7E5E4]'}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1C1917]">
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-terracotta hover:text-terracotta-dark transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full h-11 pl-4 pr-10 rounded-md border font-body text-sm
                    focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta
                    transition-colors placeholder:text-slate-400
                    ${errors.password ? 'border-red-400' : 'border-[#E7E5E4]'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            <AnimatePresence>
              {serverError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-500 bg-red-50 rounded-md px-3 py-2"
                >
                  {serverError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-md bg-terracotta text-white font-body font-semibold text-base
                hover:bg-terracotta-dark active:scale-[0.98] transition-all
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2
                shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </motion.form>

          <p className="mt-6 text-center text-sm text-slate-500 font-body">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="text-terracotta font-medium hover:text-terracotta-dark transition-colors"
            >
              Demander un accès
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
