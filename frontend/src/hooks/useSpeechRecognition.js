import { useRef, useState, useCallback, useEffect } from 'react';

const LANG_MAP = {
  es: 'es-ES',
  en: 'en-US',
  pt: 'pt-BR',
  fr: 'fr-FR',
};

/**
 * useSpeechRecognition — Hook de reconocimiento de voz (STT).
 *
 * Mantiene la acumulación continua del texto durante pausas en la voz.
 * @param {{ language?: string, onResult: (text: string) => void, onFinal?: (text: string) => void }} callbacks
 */
export function useSpeechRecognition({ language = 'es', onResult, onFinal }) {
  const recognitionRef     = useRef(null);
  const shouldRestartRef   = useRef(false);
  const accumulatedRef     = useRef('');
  const [listening, setListening] = useState(false);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    accumulatedRef.current   = '';
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    // Detener cualquier instancia previa
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const rec = new SR();
    rec.lang            = LANG_MAP[language] || 'es-ES';
    rec.interimResults  = true;
    rec.continuous      = true;
    rec.maxAlternatives = 1;

    accumulatedRef.current = '';

    rec.onresult = (e) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const fullText = (finalTranscript + interimTranscript).trim();
      if (fullText) onResult(fullText);
    };

    rec.onend = () => {
      if (shouldRestartRef.current) {
        try { rec.start(); } catch { setListening(false); }
      } else {
        setListening(false);
        const finalStr = accumulatedRef.current.trim();
        if (finalStr) onFinal?.(finalStr);
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return;
      shouldRestartRef.current = false;
      setListening(false);
    };

    recognitionRef.current   = rec;
    shouldRestartRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [language, onResult, onFinal]);

  // Si cambia el estado de listening y el componente se desmonta, asegurar apagar
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  return { listening, start, stop };
}
