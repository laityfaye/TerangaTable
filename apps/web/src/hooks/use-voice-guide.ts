'use client';

import { useEffect, useRef, useState } from 'react';

// Chrome ships several French voices (offline robotic ones plus much more
// natural "Online (Natural)"/neural/Google ones) but only exposes the full
// list asynchronously via the voiceschanged event — pick the best one once
// it's available instead of leaving the browser default (usually the first,
// most robotic voice in the list).
function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

function pickBestFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const french = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
  if (french.length === 0) return null;

  const score = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    if (name.includes('online') && name.includes('natural')) return 4; // Edge neural
    if (name.includes('neural')) return 4;
    if (name.includes('google')) return 3; // Chrome's network French voice
    if (v.lang.toLowerCase() === 'fr-fr') return 2;
    return 1;
  };

  return [...french].sort((a, b) => score(b) - score(a))[0];
}

export interface VoiceGuide {
  /** Whether the guide card should be rendered (banner or replay button state is derived from this + speaking). */
  visible: boolean;
  speaking: boolean;
  /** Speak the script — call from a real click handler so the browser accepts it even if autoplay was blocked. */
  play: () => void;
  dismiss: () => void;
  replay: () => void;
}

// Chrome/Safari can reject speech playback started without a user gesture tied
// to the current page load, so we try to autoplay once on mount and fall back
// to a visible "tap to listen" prompt if the browser refuses.
export function useVoiceGuide(script: string, storageKey: string): VoiceGuide {
  const [visible, setVisible] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    getVoicesAsync().then((voices) => {
      voicesRef.current = voices;
    });
  }, []);

  function speak(onBlocked: () => void, onDone: () => void) {
    try {
      if (!('speechSynthesis' in window)) {
        onBlocked();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(script);
      const bestVoice = pickBestFrenchVoice(voicesRef.current);
      if (bestVoice) utterance.voice = bestVoice;
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        onDone();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onBlocked();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      onBlocked();
    }
  }

  function playAndMarkSeen() {
    speak(
      () => {},
      () => {
        sessionStorage.setItem(storageKey, '1');
        setTimeout(() => setVisible(false), 1500);
      },
    );
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(storageKey)) return;

    setVisible(true);
    playAndMarkSeen();

    return () => {
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function dismiss() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    sessionStorage.setItem(storageKey, '1');
    setVisible(false);
  }

  function replay() {
    setVisible(true);
    playAndMarkSeen();
  }

  return { visible, speaking, play: playAndMarkSeen, dismiss, replay };
}
