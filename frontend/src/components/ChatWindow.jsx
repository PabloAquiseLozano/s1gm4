import { useRef, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechOutput } from '../hooks/useSpeechOutput';
import WelcomeScreen from './WelcomeScreen';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

/**
 * ChatWindow — Componente principal de la ventana de chat.
 * Orquesta los sub-componentes y hooks de voz.
 */
function ChatWindow({ chat, mode, isGenerating, inputValue, onInputChange, onSend, onModeChange, suggestions }) {
  const messagesEndRef = useRef(null);
  const prevLenRef     = useRef(0);

  const messages     = chat?.messages || [];
  const isEmpty      = messages.length === 0 && !isGenerating;
  const isAggressive = mode?.id === 'aggressive';

  const { speaking, speak, stopSpeak } = useSpeechOutput();

  const { listening, start: startMic, stop: stopMic } = useSpeechRecognition({
    onResult: (text) => onInputChange(text),
    onFinal:  (text) => onInputChange(text),
  });

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-voz en Modo Bestia al completar respuesta
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      prevLenRef.current = messages.length;
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && !last.streaming && isAggressive) {
        speak(last.content);
      }
    }
  }, [messages, isAggressive]); // eslint-disable-line

  const toggleMic   = useCallback(() => (listening ? stopMic() : startMic()), [listening, stopMic, startMic]);
  const toggleSpeak = useCallback((content) => (speaking ? stopSpeak() : speak(content)), [speaking, stopSpeak, speak]);

  return (
    <div className={`chat-shell ${isEmpty ? 'chat-shell-centered' : ''}`}>
      {/* ── Área de mensajes ── */}
      <div className="messages-area">
        {isEmpty ? (
          <WelcomeScreen mode={mode} suggestions={suggestions} onSend={onSend} />
        ) : (
          <div className="messages-feed">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                msg={msg}
                isAggressive={isAggressive}
                speaking={speaking}
                onToggleSpeak={toggleSpeak}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <ChatInput
        mode={mode}
        onModeChange={onModeChange}
        isAggressive={isAggressive}
        listening={listening}
        isGenerating={isGenerating}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSend={onSend}
        onToggleMic={toggleMic}
      />
    </div>
  );
}

export default ChatWindow;
