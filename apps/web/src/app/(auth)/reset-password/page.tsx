'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins 1 majuscule')
      .regex(/[0-9]/, 'Au moins 1 chiffre'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });
type FormData = z.infer<typeof schema>;

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (pwd.length >= 12) score++;

  if (score <= 1) return { score, label: 'Faible', color: 'bg-red-400' };
  if (score <= 2) return { score, label: 'Moyen', color: 'bg-amber-400' };
  if (score <= 3) return { score, label: 'Bon', color: 'bg-blue-400' };
  return { score, label: 'Fort', color: 'bg-green-success' };
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const pwd = watch('password', '');
  const strength = pwd ? passwordStrength(pwd) : null;

  async function onSubmit({ password }: FormData) {
    setServerError('');
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      router.push('/login?reset=1');
    } catch {
      setServerError('Le lien de réinitialisation est invalide ou expiré.');
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <p className="text-slate-500">Lien invalide.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-terracotta text-sm">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1C1917] transition-colors mb-8"
      >
        <ArrowLeft size={15} />
        Retour à la connexion
      </Link>

      <h1 className="font-heading text-3xl font-bold text-[#1C1917]">
        Nouveau mot de passe
      </h1>
      <p className="mt-2 text-sm text-slate-500 font-body">
        Choisissez un mot de passe sécurisé pour votre compte.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
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
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Strength indicator */}
          {strength && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all duration-300
                      ${strength.score >= step ? strength.color : 'bg-[#E7E5E4]'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Force :{' '}
                <span
                  className={
                    strength.score <= 1
                      ? 'text-red-500'
                      : strength.score <= 2
                        ? 'text-amber-500'
                        : strength.score <= 3
                          ? 'text-blue-500'
                          : 'text-green-success'
                  }
                >
                  {strength.label}
                </span>
              </p>
            </div>
          )}

          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm */}
        <div>
          <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              className={`w-full h-11 pl-4 pr-10 rounded-md border font-body text-sm
                focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta
                transition-colors placeholder:text-slate-400
                ${errors.confirm ? 'border-red-400' : 'border-[#E7E5E4]'}`}
              {...register('confirm')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm && (
            <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 rounded-md px-3 py-2">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 rounded-md bg-terracotta text-white font-body font-semibold text-base
            hover:bg-terracotta-dark active:scale-[0.98] transition-all
            disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Réinitialisation…
            </>
          ) : (
            'Réinitialiser le mot de passe'
          )}
        </button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
