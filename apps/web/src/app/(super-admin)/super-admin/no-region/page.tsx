'use client';

import { MapPinOff } from 'lucide-react';

export default function NoRegionPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5">
        <MapPinOff size={22} />
      </div>
      <h1 className="text-lg font-heading font-bold text-white mb-2">
        Aucune région assignée
      </h1>
      <p className="text-sm text-slate-400 max-w-md">
        Votre compte a le rôle Admin Régional mais n&apos;administre actuellement aucune
        région. Contactez un Super Admin pour qu&apos;il vous assigne une région.
      </p>
    </div>
  );
}
