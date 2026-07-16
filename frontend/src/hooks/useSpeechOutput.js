import { useRef, useState, useCallback } from 'react';
import { markdownToSpeech } from '../utils/markdownUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * useSpeechOutput — Hook de síntesis de voz (TTS).
 *
 * Intenta ElevenLabs vía backend primero; fallback a Web Speech API.
 */
export function useSpeechOutput() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);

  const stopSpeak = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text) => {
    stopSpeak();
    const clean = markdownToSpeech(text);
    if (!clean) return;

    // ── Intento 1: ElevenLabs vía backend ────────────────────────────────
    try {
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean }),
      });

      if (res.ok) {
        const blob  = await res.blob();
        const url   = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        setSpeaking(true);
        audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setSpeaking(false); };
        await audio.play();
        return;
      }
    } catch {
      // Sin conexión al backend → fallback
    }

    // ── Fallback: Web Speech API ──────────────────────────────────────────
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang   = 'es-ES';
    utt.rate   = 0.92;
    utt.pitch  = 0.75;
    utt.volume = 1;

    const MALE_NAMES = ['jorge', 'pablo', 'diego', 'carlos', 'juan', 'antonio', 'miguel', 'male', 'hombre', 'man'];
    const voices     = window.speechSynthesis.getVoices();
    const maleVoice  =
      voices.find((v) => MALE_NAMES.some((n) => v.name.toLowerCase().includes(n))) ||
      voices.find((v) => v.lang.startsWith('es') && !v.name.toLowerCase().includes('female')) ||
      voices.find((v) => v.lang.startsWith('es')) ||
      null;
    if (maleVoice) utt.voice = maleVoice;

    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [stopSpeak]);

  return { speaking, speak, stopSpeak };
}
