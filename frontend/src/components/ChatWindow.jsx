import { useRef, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSettings } from '../contexts/SettingsContext';
import WelcomeScreen from './WelcomeScreen';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const EMPTY_MESSAGES = [];

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
  onToggleSidebar,
}) {
  const messagesEndRef = useRef(null);
  const { language } = useSettings();

  const messages = chat?.messages ?? EMPTY_MESSAGES;
  const isEmpty = messages.length === 0 && !isGenerating;
  const isAggressive = mode?.id === 'aggressive';

  const { listening, start: startMic, stop: stopMic } = useSpeechRecognition({
    language,
    onResult: (text) => onInputChange(text),
    onFinal: (text) => onInputChange(text),
  });

  const handleSendWrapper = useCallback((textOverride) => {
    stopMic();
    onSend(textOverride);
  }, [stopMic, onSend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const toggleMic = useCallback(() => (listening ? stopMic() : startMic()), [listening, stopMic, startMic]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg">
      <button
        className="absolute left-3 top-3 z-[100] flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-panel text-ink-secondary shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition hover:bg-panel-light hover:text-ink md:hidden"
        onClick={onToggleSidebar}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <div className={`flex w-full flex-1 flex-col overflow-y-auto px-[10px] pb-[14px] pt-[52px] md:px-4 md:py-6 ${
        isEmpty ? 'items-center justify-center' : ''
      }`}>
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
          <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5 px-1 max-md:gap-[14px] max-md:px-0">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} isAggressive={isAggressive} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

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
