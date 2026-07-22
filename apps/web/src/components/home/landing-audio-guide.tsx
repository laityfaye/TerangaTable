'use client';

import { Volume2, Play, X } from 'lucide-react';
import { useVoiceGuide, type VoiceGuideSources } from '@/hooks/use-voice-guide';
import { useAudioGuideUrl } from '@/hooks/use-audio-guides';

const STORAGE_KEY = 'tt_landing_audio_guide_seen';

const SCRIPT_FR =
  'Bienvenue sur TérangaTable, le Shopify plus Odoo de la restauration en Afrique ! ' +
  'Si vous êtes restaurateur, découvrez nos fonctionnalités : caisse et P.O.S, menu digital, ' +
  'gestion des commandes, réservations, C.R.M et analytics, réunis dans un seul outil. ' +
  'Consultez nos tarifs adaptés à chaque taille de restaurant, avec quatorze jours gratuits et sans carte bancaire. ' +
  'Si vous cherchez plutôt où manger, cliquez sur Découvrir en haut de la page pour explorer les restaurants ' +
  'près de chez vous à Dakar, Abidjan, Casablanca et ailleurs. Bonne visite !';

// Pas de synthèse vocale wolof côté navigateur — fichier pré-enregistré,
// déposé depuis le super-admin (Guides audio).
const AUDIO_GUIDE_KEY = 'landing';

export default function LandingAudioGuide() {
  const { data: audioWoSrc } = useAudioGuideUrl(AUDIO_GUIDE_KEY);
  const sources: VoiceGuideSources = {
    fr: { type: 'tts', script: SCRIPT_FR },
    ...(audioWoSrc ? { wo: { type: 'audio' as const, src: audioWoSrc } } : {}),
  };
  const { visible, speaking, lang, availableLangs, setLang, sourceUnavailable, play, dismiss, replay, onMouseEnter } =
    useVoiceGuide(sources, STORAGE_KEY);

  return (
    <div className="fixed bottom-6 left-5 z-[3000] flex flex-col items-start gap-2" onMouseEnter={onMouseEnter}>
      {visible && (
        <div className="pointer-events-auto w-[260px] bg-white border border-[#E7E5E4] rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2.5">
            <div
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                speaking ? 'bg-[#C8553D] animate-pulse' : 'bg-[#C8553D]/10'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${speaking ? 'text-white' : 'text-[#C8553D]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1C1917]">Guide audio</p>
              <p className="text-xs text-[#57534E] mt-0.5 leading-snug">
                {speaking ? 'Lecture en cours…' : 'Écoutez la présentation de TérangaTable'}
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
                    lang === l ? 'bg-[#C8553D] text-white' : 'bg-[#F5F4F2] text-[#57534E] hover:bg-[#EDEAE6]'
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
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#C8553D] text-white text-xs font-semibold hover:bg-[#A33D28] transition-colors"
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
          className="pointer-events-auto w-11 h-11 rounded-full bg-white border border-[#E7E5E4] shadow-lg flex items-center justify-center text-[#C8553D] hover:scale-110 transition-transform"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
