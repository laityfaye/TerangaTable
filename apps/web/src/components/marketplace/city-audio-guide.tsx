'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, Play, X } from 'lucide-react';

interface Props {
  cityName: string;
}

const STORAGE_KEY = 'tt_audio_guide_seen';

function guideScript(cityName: string) {
  return (
    `Bienvenue sur TérangaTable ! Découvrez les restaurants de ${cityName}. ` +
    `Utilisez la barre de recherche pour trouver un plat ou un restaurant, ` +
    `filtrez par type de cuisine ou par budget, et consultez les menus du jour. ` +
    `Cliquez sur un restaurant pour voir son menu, commander en livraison ou réserver une table. ` +
    `Vous pouvez aussi activer votre position pour voir les restaurants les plus proches de vous. ` +
    `Bonne découverte !`
  );
}

// Chrome/Safari can reject speech playback started without a user gesture tied
// to the current page load, so we try to autoplay once and fall back to a
// visible "tap to listen" prompt if the browser refuses.
export default function CityAudioGuide({ cityName }: Props) {
  const [visible, setVisible] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  function speakGuide(onBlocked: () => void, onDone: () => void) {
    try {
      if (!('speechSynthesis' in window)) {
        onBlocked();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(guideScript(cityName));
      utterance.lang = 'fr-FR';
      utterance.rate = 0.98;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        onDone();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onBlocked();
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      onBlocked();
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    setVisible(true);
    speakGuide(
      () => {},
      () => {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setTimeout(() => setVisible(false), 1500);
      },
    );

    return () => {
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlayClick() {
    speakGuide(
      () => {},
      () => {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setTimeout(() => setVisible(false), 1500);
      },
    );
  }

  function handleDismiss() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  function handleReplay() {
    setVisible(true);
    handlePlayClick();
  }

  return (
    <div className="fixed bottom-6 left-5 z-[3000] flex flex-col items-start gap-2">
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
                {speaking ? 'Lecture en cours…' : 'Écoutez comment utiliser TérangaTable'}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Fermer le guide audio"
              className="shrink-0 text-[#A8A29E] hover:text-[#57534E]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!speaking && (
            <button
              onClick={handlePlayClick}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#C8553D] text-white text-xs font-semibold hover:bg-[#A33D28] transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Écouter
            </button>
          )}
        </div>
      )}

      {!visible && (
        <button
          onClick={handleReplay}
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
