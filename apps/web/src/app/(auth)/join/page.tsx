'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const schema = z
  .object({
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });
type FormData = z.infer<typeof schema>;

interface InvitationInfo {
  email: string;
  roleName: string;
  tenantName: string;
}

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const acceptInvitation = useAuthStore((s) => s.acceptInvitation);

  const [status, setStatus] = useState<'loading' | 'invalid' | 'ready'>('loading');
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    apiClient
      .get<{ data: InvitationInfo }>(`/auth/invitations/${token}`)
      .then(({ data }) => {
        setInvitation(data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  async function onSubmit({ firstName, lastName, password }: FormData) {
    setServerError('');
    try {
      await acceptInvitation({ token, firstName, lastName, password });
      router.push('/dashboard');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Impossible d'accepter l'invitation.";
      setServerError(message);
    }
  }

  if (status === 'loading') {
    return (
      <div className="w-full max-w-md mx-auto flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-terracotta" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <p className="text-slate-500">Ce lien d&apos;invitation est invalide ou a expiré.</p>
        <Link href="/login" className="mt-4 inline-block text-terracotta text-sm">
          Retour à la connexion
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
        Rejoindre {invitation?.tenantName}
      </h1>
      <p className="mt-2 text-sm text-slate-500 font-body flex items-center gap-1.5">
        <ShieldCheck size={14} className="text-terracotta" />
        {invitation?.email} · {invitation?.roleName}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Prénom</label>
            <input
              type="text"
              autoComplete="given-name"
              className={`w-full h-11 px-4 rounded-md border font-body text-sm
                focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta
                transition-colors placeholder:text-slate-400
                ${errors.firstName ? 'border-red-400' : 'border-[#E7E5E4]'}`}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Nom</label>
            <input
              type="text"
              autoComplete="family-name"
              className={`w-full h-11 px-4 rounded-md border font-body text-sm
                focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta
                transition-colors placeholder:text-slate-400
                ${errors.lastName ? 'border-red-400' : 'border-[#E7E5E4]'}`}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
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
              Création du compte…
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>
    </motion.div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  );
}
