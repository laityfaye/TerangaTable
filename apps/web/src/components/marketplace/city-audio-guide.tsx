'use client';

import { Volume2, Play, X } from 'lucide-react';
import { useVoiceGuide, type VoiceGuideSources } from '@/hooks/use-voice-guide';
import { useAudioGuideUrl } from '@/hooks/use-audio-guides';

interface Props {
  cityName?: string;
}

const STORAGE_KEY = 'tt_audio_guide_seen';

// Le wolof est un fichier pré-enregistré unique (pas de synthèse vocale wolof
// dans les navigateurs) — il reste donc générique, sans nom de ville, pour
// pouvoir être réutilisé sur /decouvrir et sur /decouvrir/[ville]. Déposé
// depuis le super-admin (Guides audio) ; voir apps/api audio-guides module.
const AUDIO_GUIDE_KEY = 'decouvrir';

function guideScriptFr(cityName?: string) {
  if (!cityName) {
    return (
      `Bienvenue sur TérangaTable ! Découvrez les meilleurs restaurants d'Afrique en un seul endroit. ` +
      `Choisissez votre ville pour voir les restaurants disponibles, ` +
      `tapez un plat ou un nom de restaurant dans la recherche, ` +
      `ou activez votre position pour découvrir ce qui est ouvert près de vous. ` +
      `Bonne découverte !`
    );
  }
  return (
    `Bienvenue sur TérangaTable ! Découvrez les restaurants de ${cityName}. ` +
    `Utilisez la barre de recherche pour trouver un plat ou un restaurant, ` +
    `filtrez par type de cuisine ou par budget, et consultez les menus du jour. ` +
    `Cliquez sur un restaurant pour voir son menu, commander en livraison ou réserver une table. ` +
    `Vous pouvez aussi activer votre position pour voir les restaurants les plus proches de vous. ` +
    `Bonne découverte !`
  );
}

export default function CityAudioGuide({ cityName }: Props) {
  const { data: audioWoSrc } = useAudioGuideUrl(AUDIO_GUIDE_KEY);
  const sources: VoiceGuideSources = {
    fr: { type: 'tts', script: guideScriptFr(cityName) },
    ...(audioWoSrc ? { wo: { type: 'audio' as const, src: audioWoSrc } } : {}),
  };
  const {
    visible,
    loading,
    speaking,
    lang,
    availableLangs,
    setLang,
    sourceUnavailable,
    play,
    dismiss,
    replay,
    onMouseEnter,
  } = useVoiceGuide(sources, STORAGE_KEY);

  return (
    <div className="fixed bottom-6 left-5 z-[3000] flex flex-col items-start gap-2" onMouseEnter={onMouseEnter}>
      {visible && (
        <div className="pointer-events-auto w-[260px] bg-white border border-[#E7E5E4] rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-2.5">
            <div
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                speaking || loading ? 'bg-[#C8553D] animate-pulse' : 'bg-[#C8553D]/10'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${speaking || loading ? 'text-white' : 'text-[#C8553D]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1C1917]">Guide audio</p>
              <p className="text-xs text-[#57534E] mt-0.5 leading-snug">
                {loading
                  ? 'Chargement…'
                  : speaking
                    ? 'Lecture en cours…'
                    : 'Écoutez comment utiliser TérangaTable'}
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
              disabled={loading}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#C8553D] text-white text-xs font-semibold hover:bg-[#A33D28] transition-colors disabled:opacity-60"
            >
              {loading ? (
                'Chargement…'
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Écouter
                </>
              )}
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
