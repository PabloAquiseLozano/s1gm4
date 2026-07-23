import { useRef, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSettings } from '../contexts/SettingsContext';
import WelcomeScreen from './WelcomeScreen';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

/**
 * ChatWindow — Componente principal de la ventana de chat.
 * Orquesta los sub-componentes.
 */
function ChatWindow({
  chat,
  mode,
  isGenerating,
  inputValue,
  onInputChange,
  onSend,
  onModeChange,
  suggestions,
  isAnonymous,
  onOpenAuth,
  user,
}) {
  const messagesEndRef = useRef(null);
  const { language }   = useSettings();

  const messages     = chat?.messages || [];
  const isEmpty      = messages.length === 0 && !isGenerating;
  const isAggressive = mode?.id === 'aggressive';

  const { listening, start: startMic, stop: stopMic } = useSpeechRecognition({
    language,
    onResult: (text) => onInputChange(text),
    onFinal:  (text) => onInputChange(text),
  });

  // Apagar micrófono al enviar el mensaje
  const handleSendWrapper = useCallback((textOverride) => {
    stopMic();
    onSend(textOverride);
  }, [stopMic, onSend]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const toggleMic = useCallback(() => (listening ? stopMic() : startMic()), [listening, stopMic, startMic]);

  return (
    <div className={`chat-shell ${isEmpty ? 'chat-shell-centered' : ''}`}>
      {/* ── Área de mensajes ── */}
      <div className="messages-area">
        {isEmpty ? (
          <WelcomeScreen
            mode={mode}
            suggestions={suggestions}
            onSend={handleSendWrapper}
            isAnonymous={isAnonymous}
            onOpenAuth={onOpenAuth}
            user={user}
          />
        ) : (
          <div className="messages-feed">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                msg={msg}
                isAggressive={isAggressive}
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
        onSend={handleSendWrapper}
        onToggleMic={toggleMic}
      />
    </div>
  );
}

export default ChatWindow;
