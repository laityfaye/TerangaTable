'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Email invalide'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: FormData) {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Always show success — API never leaks email existence
    }
    setSubmittedEmail(email);
    setSent(true);
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1C1917] transition-colors mb-8"
      >
        <ArrowLeft size={15} />
        Retour à la connexion
      </Link>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="font-heading text-3xl font-bold text-[#1C1917]">
              Mot de passe oublié ?
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-body">
              Renseignez votre email et nous vous enverrons un lien de réinitialisation.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
                    Envoi en cours…
                  </>
                ) : (
                  'Envoyer le lien'
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-green-success" />
              </div>
            </motion.div>
            <h2 className="font-heading text-2xl font-bold text-[#1C1917]">
              Email envoyé !
            </h2>
            <p className="mt-3 text-sm text-slate-500 font-body max-w-xs mx-auto">
              Si un compte existe pour{' '}
              <strong className="text-[#1C1917]">{submittedEmail}</strong>, vous
              recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <p className="mt-6 text-xs text-slate-400">
              Vérifiez également vos spams.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block text-sm font-medium text-terracotta hover:text-terracotta-dark transition-colors"
            >
              Retour à la connexion
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
