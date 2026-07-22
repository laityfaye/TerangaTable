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

// Browser TTS engines (Chrome/Edge/Safari) don't ship Wolof voices, so a
// 'wo' guide can only be a pre-recorded audio file — never speechSynthesis.
export type VoiceGuideLang = 'fr' | 'wo';

export type VoiceGuideSource =
  | { type: 'tts'; script: string }
  | { type: 'audio'; src: string };

export type VoiceGuideSources = Partial<Record<VoiceGuideLang, VoiceGuideSource>>;

export interface VoiceGuide {
  /** Whether the guide card should be rendered (banner or replay button state is derived from this + speaking). */
  visible: boolean;
  speaking: boolean;
  lang: VoiceGuideLang;
  /** Languages this guide actually has a source for — drives whether the language toggle renders. */
  availableLangs: VoiceGuideLang[];
  setLang: (lang: VoiceGuideLang) => void;
  /** True once the current language's source has failed to play (e.g. the Wolof mp3 isn't uploaded yet). */
  sourceUnavailable: boolean;
  /** Speak the current-language script — call from a real click handler so the browser accepts it even if autoplay was blocked. */
  play: () => void;
  dismiss: () => void;
  replay: () => void;
  /** Attach to the guide widget's root element (onMouseEnter) to retry a blocked autoplay on hover. */
  onMouseEnter: () => void;
}

// Chrome/Safari can reject speech/audio playback started without a user gesture tied
// to the current page load, so we try to autoplay once on mount and fall back
// to a visible "tap to listen" prompt if the browser refuses.
export function useVoiceGuide(sources: VoiceGuideSources, storageKey: string): VoiceGuide {
  const availableLangs = (['fr', 'wo'] as const).filter((l) => sources[l]);
  const [visible, setVisible] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLangState] = useState<VoiceGuideLang>(sources.fr ? 'fr' : (availableLangs[0] ?? 'fr'));
  const [sourceUnavailable, setSourceUnavailable] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    getVoicesAsync().then((voices) => {
      voicesRef.current = voices;
    });
  }, []);

  function stopAll() {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }

  function speakTts(script: string, onBlocked: () => void, onDone: () => void) {
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

  function playAudioFile(src: string, onBlocked: () => void, onDone: () => void) {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onplay = () => setSpeaking(true);
    audio.onended = () => {
      setSpeaking(false);
      onDone();
    };
    audio.onerror = () => {
      setSpeaking(false);
      setSourceUnavailable(true);
      onBlocked();
    };
    audio.play().catch(() => {
      setSpeaking(false);
      setSourceUnavailable(true);
      onBlocked();
    });
  }

  function speakCurrent(onBlocked: () => void, onDone: () => void) {
    const source = sources[lang];
    if (!source) {
      onBlocked();
      return;
    }
    setSourceUnavailable(false);
    if (source.type === 'tts') speakTts(source.script, onBlocked, onDone);
    else playAudioFile(source.src, onBlocked, onDone);
  }

  const blockedRef = useRef(false);

  function playAndMarkSeen() {
    blockedRef.current = false;
    speakCurrent(
      () => { blockedRef.current = true; },
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

    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // The autoplay attempt above can be silently rejected without a prior user
  // gesture on this page load (Chrome/Safari policy) — retry once when the
  // pointer enters this specific guide's widget, so the guide starts talking
  // on its own without waiting for a tap on its "Écouter" button, but without
  // hijacking clicks elsewhere on the page (which could fire several guides
  // at once if more than one is mounted).
  const hasHoverRetriedRef = useRef(false);

  function onMouseEnter() {
    if (hasHoverRetriedRef.current) return;
    hasHoverRetriedRef.current = true;
    if (blockedRef.current && !sessionStorage.getItem(storageKey)) {
      playAndMarkSeen();
    }
  }

  function dismiss() {
    stopAll();
    setSpeaking(false);
    sessionStorage.setItem(storageKey, '1');
    setVisible(false);
  }

  function replay() {
    setVisible(true);
    playAndMarkSeen();
  }

  function setLang(next: VoiceGuideLang) {
    if (next === lang) return;
    stopAll();
    setSpeaking(false);
    setSourceUnavailable(false);
    setLangState(next);
  }

  return { visible, speaking, lang, availableLangs, setLang, sourceUnavailable, play: playAndMarkSeen, dismiss, replay, onMouseEnter };
}
