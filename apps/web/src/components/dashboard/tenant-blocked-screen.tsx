'use client';

import { Ban, Clock, LogOut, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import type { TenantBlockReason } from '@/stores/tenant-status.store';

const COPY: Record<TenantBlockReason, { icon: typeof Clock; title: string; body: string }> = {
  TRIALEXPIRED: {
    icon: Clock,
    title: "Votre période d'essai est terminée",
    body: "Contactez notre équipe pour choisir un plan et continuer à utiliser votre tableau de bord.",
  },
  ACCOUNTSUSPENDED: {
    icon: Ban,
    title: 'Votre compte est suspendu',
    body: 'Contactez le support pour comprendre pourquoi et régulariser votre situation.',
  },
};

export function TenantBlockedScreen({ reason }: { reason: TenantBlockReason }) {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { icon: Icon, title, body } = COPY[reason];

  return (
    <div className="flex h-screen items-center justify-center bg-[#FAFAF8] px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10">
          <Icon className="h-7 w-7 text-terracotta" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{body}</p>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href="mailto:support@terangatable.com"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Mail className="h-4 w-4" />
            Contacter le support
          </a>
          <button
            onClick={() => {
              clearAuth();
              window.location.href = '/login';
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
