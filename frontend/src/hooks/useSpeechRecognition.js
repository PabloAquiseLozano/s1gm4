import { useRef, useState, useCallback } from 'react';

/**
 * useSpeechRecognition — Hook de reconocimiento de voz (STT).
 *
 * Modo continuo con reinicio automático en pausas largas.
 * @param {{ onResult: (text: string) => void, onFinal?: (text: string) => void }} callbacks
 */
export function useSpeechRecognition({ onResult, onFinal }) {
  const recognitionRef    = useRef(null);
  const shouldRestartRef  = useRef(false);
  const [listening, setListening] = useState(false);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    const rec = new SR();
    rec.lang            = 'es-ES';
    rec.interimResults  = true;
    rec.continuous      = true;
    rec.maxAlternatives = 1;

    let accumulated = '';

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          accumulated += e.results[i][0].transcript + ' ';
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      onResult(accumulated + interim);
    };

    rec.onend = () => {
      if (shouldRestartRef.current) {
        try { rec.start(); } catch { setListening(false); }
      } else {
        setListening(false);
        if (accumulated.trim()) onFinal?.(accumulated.trim());
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return;
      shouldRestartRef.current = false;
      setListening(false);
    };

    recognitionRef.current  = rec;
    shouldRestartRef.current = true;
    rec.start();
    setListening(true);
  }, [onResult, onFinal]);

  return { listening, start, stop };
}
