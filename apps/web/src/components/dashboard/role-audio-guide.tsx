'use client';

import { Volume2, Play, X } from 'lucide-react';
import { useVoiceGuide, type VoiceGuideSources } from '@/hooks/use-voice-guide';
import { useAudioGuideUrl } from '@/hooks/use-audio-guides';
import { UserRole } from '@terangatable/shared';

interface Props {
  /** Rôle principal de l'utilisateur connecté (user.roles[0]). */
  role: string;
}

const ROLE_SCRIPTS: Record<string, string> = {
  [UserRole.OWNER]:
    'Bienvenue sur votre tableau de bord TérangaTable ! En tant que propriétaire, vous avez accès à ' +
    "tout : configurez votre menu dans la section Menu, gérez votre équipe et leurs rôles dans " +
    'Réglages puis Équipe, organisez vos tables, suivez vos ventes dans Analytics, et personnalisez ' +
    'votre site vitrine public dans Mon Site. Utilisez le menu à gauche pour naviguer entre les ' +
    'sections. Bonne gestion !',
  [UserRole.MANAGER]:
    'Bienvenue sur votre tableau de bord TérangaTable ! En tant que manager, vous supervisez les ' +
    'opérations du jour : suivez les commandes en cours, gérez les réservations et les paiements, ' +
    "encadrez l'équipe, et consultez les statistiques de vente dans Analytics. Utilisez le menu à " +
    'gauche pour accéder à chaque section. Bonne gestion !',
  [UserRole.SERVEUR]:
    'Bienvenue sur votre espace serveur ! Depuis Commandes, créez une nouvelle commande pour une ' +
    'table, suivez son statut, et marquez-la comme servie une fois prête. Consultez aussi les ' +
    'réservations du jour dans la section dédiée. Activez les alertes sonores pour être prévenu dès ' +
    "qu'une commande est prête en cuisine. Bon service !",
  [UserRole.CAISSIER]:
    'Bienvenue sur votre espace caissier ! Utilisez la Caisse pour encaisser les commandes, et la ' +
    "section Paiements pour suivre l'historique des transactions. Vous pouvez aussi créer une " +
    'nouvelle commande directement si besoin. Activez les alertes sonores pour ne manquer aucune ' +
    'commande prête. Bonne caisse !',
  [UserRole.CUISINIER]:
    'Bienvenue sur votre écran cuisine ! Toutes les commandes reçues apparaissent automatiquement ' +
    'ici. Faites passer une commande au statut En préparation, puis Prête une fois terminée. ' +
    "Activez les alertes sonores pour être prévenu dès qu'une nouvelle commande arrive. Bonne " +
    'cuisine !',
  [UserRole.LIVREUR]:
    'Bienvenue sur votre espace livreur ! Retrouvez vos livraisons assignées dans la section ' +
    'Livraison, et mettez à jour le statut de chaque course jusqu’à la remise au client. Activez ' +
    "les alertes sonores pour être prévenu dès qu'une nouvelle livraison vous est assignée. Bonne " +
    'route !',
};

const DEFAULT_SCRIPT =
  'Bienvenue sur votre tableau de bord TérangaTable ! Utilisez le menu à gauche pour accéder aux ' +
  'différentes sections de votre espace.';

// Pas de synthèse vocale wolof côté navigateur — fichiers pré-enregistrés,
// un par rôle, déposés depuis le super-admin (Guides audio).
const ROLE_AUDIO_GUIDE_KEY: Record<string, string> = {
  [UserRole.OWNER]: 'dashboard-owner',
  [UserRole.MANAGER]: 'dashboard-manager',
  [UserRole.SERVEUR]: 'dashboard-serveur',
  [UserRole.CAISSIER]: 'dashboard-caissier',
  [UserRole.CUISINIER]: 'dashboard-cuisinier',
  [UserRole.LIVREUR]: 'dashboard-livreur',
};
const DEFAULT_AUDIO_GUIDE_KEY = 'dashboard-default';

export default function RoleAudioGuide({ role }: Props) {
  const script = ROLE_SCRIPTS[role] ?? DEFAULT_SCRIPT;
  const audioGuideKey = ROLE_AUDIO_GUIDE_KEY[role] ?? DEFAULT_AUDIO_GUIDE_KEY;
  const { data: audioWoSrc } = useAudioGuideUrl(audioGuideKey);
  const storageKey = `tt_dashboard_audio_guide_seen_${role || 'default'}`;
  const sources: VoiceGuideSources = {
    fr: { type: 'tts', script },
    ...(audioWoSrc ? { wo: { type: 'audio' as const, src: audioWoSrc } } : {}),
  };
  const { visible, speaking, lang, availableLangs, setLang, sourceUnavailable, play, dismiss, replay, onMouseEnter } =
    useVoiceGuide(sources, storageKey);

  return (
    <div className="fixed bottom-24 right-5 z-[3000] flex flex-col items-end gap-2" onMouseEnter={onMouseEnter}>
      {visible && (
        <div className="pointer-events-auto w-[260px] bg-white border border-[#E7E5E4] rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2.5">
            <div
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                speaking ? 'bg-terracotta animate-pulse' : 'bg-terracotta/10'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${speaking ? 'text-white' : 'text-terracotta'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1C1917]">Guide audio</p>
              <p className="text-xs text-[#57534E] mt-0.5 leading-snug">
                {speaking ? 'Lecture en cours…' : 'Écoutez comment utiliser votre espace'}
              </p>
            </div>
            <button
              onClick={dismiss}
              aria-label="Fermer le guide audio"
              className="shrink-0 text-[#A8A29E] hover:text-[#57534E]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {availableLangs.length > 1 && (
            <div className="mt-3 flex items-center gap-1.5">
              {availableLangs.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
                    lang === l ? 'bg-terracotta text-white' : 'bg-[#F5F4F2] text-[#57534E] hover:bg-[#EDEAE6]'
                  }`}
                >
                  {l === 'fr' ? 'Français' : 'Wolof'}
                </button>
              ))}
            </div>
          )}

          {lang === 'wo' && sourceUnavailable && (
            <p className="mt-2 text-[11px] text-[#A8A29E] italic">
              Audio wolof bientôt disponible — écoutez en français en attendant.
            </p>
          )}

          {!speaking && (
            <button
              onClick={play}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:bg-terracotta-dark transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Écouter
            </button>
          )}
        </div>
      )}

      {!visible && (
        <button
          onClick={replay}
          aria-label="Réécouter le guide audio"
          title="Guide audio"
          className="pointer-events-auto w-11 h-11 rounded-full bg-white border border-[#E7E5E4] shadow-lg flex items-center justify-center text-terracotta hover:scale-110 transition-transform"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
