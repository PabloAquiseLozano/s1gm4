import { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Corrige tablas markdown malformadas que Gemini a veces genera
 * cuando mezcla ítems de lista con sintaxis de tabla:
 *   ANTES:  "- | DÍA | TAREA |"  (bullet + pipes → se renderiza como lista)
 *   DESPUÉS: "| DÍA | TAREA |"   (tabla limpia)
 *
 * También normaliza separadores de tabla que vengan con guión de lista:
 *   ANTES:  "- |------|------|"  → DESPUÉS: "|------|------|"
 */
function fixMarkdownTables(md = '') {
  return md
    .split('\n')
    .map((line) => {
      // Detecta líneas tipo: "  - | ..." o "  * | ..."
      const match = line.match(/^(\s*)[-*]\s+(\|.+)$/);
      if (match) return match[1] + match[2]; // quita el bullet, conserva la pipe
      return line;
    })
    .join('\n');
}

// ── Componentes de Markdown ───────────────────────────────────
const MD = {
  h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
  p:  ({ children }) => <p className="md-p">{children}</p>,
  strong: ({ children }) => <strong className="md-strong">{children}</strong>,
  em: ({ children }) => <em className="md-em">{children}</em>,
  ul: ({ children }) => <ul className="md-ul">{children}</ul>,
  ol: ({ children }) => <ol className="md-ol">{children}</ol>,
  li: ({ children }) => <li className="md-li">{children}</li>,
  code: ({ inline, children }) =>
    inline
      ? <code className="md-code-inline">{children}</code>
      : <code className="md-code-block">{children}</code>,
  pre: ({ children }) => <pre className="md-pre">{children}</pre>,
  blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
  table: ({ children }) => <div className="md-table-wrap"><table className="md-table">{children}</table></div>,
  th: ({ children }) => <th className="md-th">{children}</th>,
  td: ({ children }) => <td className="md-td">{children}</td>,
  tr: ({ children }) => <tr className="md-tr">{children}</tr>,
  thead: ({ children }) => <thead className="md-thead">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  hr: () => <hr className="md-hr" />,
};

// ── Hook de reconocimiento de voz ─────────────────────────────
// continuous=true + reinicio automático para pausas largas
function useSpeechRecognition({ onResult, onFinal }) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const shouldRestartRef = useRef(false);

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
    rec.lang = 'es-ES';
    rec.interimResults = true;
    rec.continuous = true;                        // ← sigue escuchando sin cortar
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
      // Si el usuario no detuvo manualmente → reinicia para pausas largas
      if (shouldRestartRef.current) {
        try { rec.start(); } catch { setListening(false); }
      } else {
        setListening(false);
        if (accumulated.trim()) onFinal?.(accumulated.trim());
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return; // pausa natural, ignorar
      shouldRestartRef.current = false;
      setListening(false);
    };

    recognitionRef.current = rec;
    shouldRestartRef.current = true;
    rec.start();
    setListening(true);
  }, [onResult, onFinal]);

  return { listening, start, stop };
}

// ── Hook de síntesis de voz ───────────────────────────────────
// Intenta ElevenLabs primero; fallback a Web Speech API
function useSpeechOutput() {
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
    // Limpia markdown para que suene natural al leerlo en voz alta
    const clean = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*{1,2}([^*\n]+)\*{1,2}/g, '$1')
      .replace(/_{1,2}([^_\n]+)_{1,2}/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/>\s?/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s/g, '')
      .replace(/\|[^\n]+\|/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!clean) return;

    // ── Intento 1: ElevenLabs vía backend ─────────────────
    try {
      const res = await fetch('http://localhost:8000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean,
          // voice_id se lee del .env en el backend (ELEVENLABS_VOICE_ID)
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        setSpeaking(true);
        audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setSpeaking(false); };
        await audio.play();
        return; // éxito con ElevenLabs
      }
    } catch {
      // Sin conexión al backend o clave no configurada → fallback
    }

    // ── Fallback: Web Speech API ───────────────────────────
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang   = 'es-ES';
    utt.rate   = 0.92;
    utt.pitch  = 0.75;   // grave = masculino
    utt.volume = 1;

    const MALE_NAMES = ['jorge', 'pablo', 'diego', 'carlos', 'juan', 'antonio', 'miguel', 'male', 'hombre', 'man'];
    const voices = window.speechSynthesis.getVoices();
    const maleVoice =
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

// ── Componente principal ──────────────────────────────────────
function ChatWindow({
  chat,
  mode,
  isGenerating,
  inputValue,
  onInputChange,
  onSend,
  onModeChange,
  suggestions,
}) {
  const messagesEndRef = useRef(null);
  const messages    = chat?.messages || [];
  const isEmpty     = messages.length === 0 && !isGenerating;
  const isAggressive = mode?.id === 'aggressive';

  const { speaking, speak, stopSpeak } = useSpeechOutput();

  const { listening, start: startMic, stop: stopMic } = useSpeechRecognition({
    onResult: (text) => onInputChange(text),
    onFinal:  (text) => onInputChange(text),
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    onInputChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const toggleMic   = () => (listening ? stopMic() : startMic());
  const toggleSpeak = (content) => (speaking ? stopSpeak() : speak(content));

  // Auto-voz en modo bestia al completar respuesta
  const prevLenRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      prevLenRef.current = messages.length;
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && !last.streaming && isAggressive) {
        speak(last.content);
      }
    }
  }, [messages, isAggressive]); // eslint-disable-line

  return (
    <div className="chat-shell">
      {/* ── Header ── */}
      <header className={`chat-header ${isAggressive ? 'chat-header-danger' : ''}`}>
        <div className="chat-header-left">
          <span className="chat-header-emoji">{mode?.emoji || '🗿'}</span>
          <div>
            <h2 className="chat-header-name">
              S1GM4 — {isAggressive ? 'Modo Bestia' : 'Reflexivo'}
            </h2>
            <p className="chat-header-role">
              {isAggressive ? 'SIN FILTROS · ACCIÓN AHORA' : 'FILOSOFÍA · AUTODISCIPLINA'}
            </p>
          </div>
        </div>

        <div className="mode-toggle-group">
          <button
            className={`mode-btn ${!isAggressive ? 'mode-btn-active' : ''}`}
            onClick={() => onModeChange('reflexive')}
          >
            🏛️ Reflexivo
          </button>
          <button
            className={`mode-btn mode-btn-danger ${isAggressive ? 'mode-btn-danger-active' : ''}`}
            onClick={() => onModeChange('aggressive')}
          >
            🔥 Modo Bestia
          </button>
        </div>
      </header>

      {/* ── Mensajes ── */}
      <div className="messages-area">
        {isEmpty ? (
          <div className="welcome-state">
            <div className={`welcome-icon ${isAggressive ? 'welcome-icon-danger' : ''}`}>
              {mode?.emoji || '🗿'}
            </div>
            <h1 className="welcome-title">
              {isAggressive ? '¿Listo para la verdad sin filtros?' : 'Bienvenido a S1GM4'}
            </h1>
            <p className="welcome-desc">
              {isAggressive
                ? 'Sin excusas. Sin compasión innecesaria. Solo acción y resultados.'
                : 'Tu mentor estoico con IA. Reflexión profunda, estructura clara y sabiduría.'}
            </p>
            <div className="suggestions-grid">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className={`suggestion-btn ${isAggressive ? 'suggestion-btn-danger' : ''}`}
                  onClick={() => onSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-feed">
            {messages.map((msg, idx) => {
              const isUser      = msg.role === 'user';
              const isStreaming = msg.streaming === true;
              const isEmpty     = !msg.content && isStreaming;

              return (
                <div
                  key={idx}
                  className={`message-row ${isUser ? 'message-row-user' : 'message-row-bot'}`}
                >
                  {/* Avatar bot */}
                  {!isUser && (
                    <div className={`avatar avatar-bot ${isAggressive ? 'avatar-bot-danger' : ''}`}>
                      {isAggressive ? '🔥' : '🗿'}
                    </div>
                  )}

                  {/* Burbuja */}
                  <div className={`bubble ${isUser
                    ? 'bubble-user'
                    : `bubble-bot ${isAggressive ? 'bubble-bot-danger' : ''}`
                  }`}>
                    {isUser ? (
                      <span>{msg.content}</span>
                    ) : isEmpty ? (
                      /* Puntos suspensivos grises mientras espera el primer token */
                      <div className="typing-dots">
                        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                        <span className="typing-dot" style={{ animationDelay: '180ms' }} />
                        <span className="typing-dot" style={{ animationDelay: '360ms' }} />
                      </div>
                    ) : (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                          {fixMarkdownTables(msg.content)}
                        </ReactMarkdown>
                        {isStreaming && <span className="stream-cursor" />}
                      </>
                    )}

                    {/* Botón escuchar — solo respuestas bot completadas */}
                    {!isUser && !isStreaming && msg.content && (
                      <button
                        className={`voice-btn ${speaking ? 'voice-btn-active' : ''}`}
                        onClick={() => toggleSpeak(msg.content)}
                        title={speaking ? 'Detener voz' : 'Escuchar respuesta'}
                      >
                        {speaking ? '⏹' : '🔊'}
                      </button>
                    )}
                  </div>

                  {/* Sin avatar de usuario — solo la burbuja a la derecha */}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Footer de entrada ── */}
      <div className={`input-footer ${isAggressive ? 'input-footer-danger' : ''}`}>
        <div className="input-wrapper">
          <button
            className={`mic-btn ${listening ? 'mic-btn-active' : ''}`}
            onClick={toggleMic}
            title={listening ? 'Detener grabación' : 'Hablar'}
            type="button"
          >
            {listening ? '🔴' : '🎙️'}
          </button>

          <textarea
            className={`chat-input ${isAggressive ? 'chat-input-danger' : ''}`}
            rows={1}
            placeholder={
              listening
                ? '🎙️ Escuchando... habla con calma'
                : isAggressive
                ? '¿Cuál es tu excusa hoy?'
                : 'Escribe tu mensaje…'
            }
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            disabled={isGenerating}
          />

          <button
            className={`send-btn ${isAggressive ? 'send-btn-danger' : ''}`}
            onClick={() => onSend()}
            disabled={isGenerating || !inputValue.trim()}
            title="Enviar (Enter)"
          >
            ↑
          </button>
        </div>

        <p className="input-hint">
          {listening
            ? '🎙️ Grabando — pausa cuando quieras, haz clic en 🔴 para terminar'
            : isAggressive
            ? '🔥 Modo Bestia · 🔊 voz automática al recibir respuesta'
            : 'Enter para enviar · Shift+Enter nueva línea · 🎙️ voz · 🔊 escuchar'}
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
