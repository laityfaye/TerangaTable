'use client';

import { MessageCircle, CheckCircle2, Users, ShoppingBag } from 'lucide-react';
import { useWhatsappStatus } from '@/hooks/whatsapp/use-whatsapp';

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1C1917] tabular-nums">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function WhatsappSettingsPage() {
  const { data: status, isLoading } = useWhatsappStatus();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Assistant WhatsApp</h1>
        <p className="text-sm text-slate-500 font-body mt-0.5">
          Prise de commande conversationnelle automatisée, propulsée par IA.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Module actif sur votre compte</p>
              <p className="text-xs text-green-700 mt-0.5">
                Vos clients peuvent commander directement en écrivant sur WhatsApp.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E7E5E4] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#1C1917] mb-1">
              <MessageCircle size={16} className="text-terracotta" />
              Numéro WhatsApp
            </div>
            <p className="text-sm text-slate-600">
              {status?.shared_number ?? 'Non configuré'} — numéro partagé par la plateforme TérangaTable. Votre
              restaurant est identifié automatiquement dès que le client indique son nom en conversation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Users size={18} />} label="Conversations" value={status?.conversations_count ?? 0} />
            <StatCard
              icon={<ShoppingBag size={18} />}
              label="Commandes finalisées"
              value={status?.completed_orders_count ?? 0}
            />
          </div>

          <p className="text-xs text-slate-400">
            Ce module ne nécessite aucune configuration de votre part : partagez simplement le numéro ci-dessus à vos
            clients, ou laissez-les vous trouver via la recherche du bot.
          </p>
        </div>
      )}
    </div>
  );
}
