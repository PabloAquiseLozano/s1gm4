import MarkdownRenderer from './MarkdownRenderer';

/**
 * MessageBubble — Burbuja individual de mensaje (usuario o bot).
 * Incluye el renderizado de Markdown, cursor de streaming, y botón de TTS.
 */
function MessageBubble({ msg, isAggressive, speaking, onToggleSpeak }) {
  const isUser      = msg.role === 'user';
  const isStreaming  = msg.streaming === true;
  const hasNoContent = !msg.content && isStreaming;

  return (
    <div className={`message-row ${isUser ? 'message-row-user' : 'message-row-bot'}`}>
      {/* Avatar bot */}
      {!isUser && (
        <div className={`avatar avatar-bot ${isAggressive ? 'avatar-bot-danger' : ''}`}>
          {isAggressive ? '🔥' : '🗿'}
        </div>
      )}

      {/* Burbuja */}
      <div className={`bubble ${
        isUser ? 'bubble-user' : `bubble-bot ${isAggressive ? 'bubble-bot-danger' : ''}`
      }`}>
        {isUser ? (
          <span>{msg.content}</span>
        ) : hasNoContent ? (
          /* Puntos suspensivos mientras espera el primer token */
          <div className="typing-dots">
            <span className="typing-dot" style={{ animationDelay: '0ms' }} />
            <span className="typing-dot" style={{ animationDelay: '180ms' }} />
            <span className="typing-dot" style={{ animationDelay: '360ms' }} />
          </div>
        ) : (
          <>
            <MarkdownRenderer content={msg.content} />
            {isStreaming && <span className="stream-cursor" />}
          </>
        )}

      </div>
    </div>
  );
}

export default MessageBubble;
