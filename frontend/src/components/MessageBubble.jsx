import MarkdownRenderer from './MarkdownRenderer';

function MessageBubble({ msg, isAggressive }) {
  const isUser = msg.role === 'user';
  const isStreaming = msg.streaming === true;
  const hasNoContent = !msg.content && isStreaming;

  return (
    <div className={`flex items-start gap-3 animate-fade-in-up ${
      isUser ? 'flex-row-reverse' : 'flex-row'
    }`}>
      {!isUser && (
        <div className={`flex h-[34px] w-[34px] min-w-[34px] flex-shrink-0 items-center justify-center rounded-full border text-base font-bold max-md:h-[30px] max-md:w-[30px] max-md:min-w-[30px] max-md:text-xs ${
          isAggressive
            ? 'border-danger/35 bg-panel-light'
            : 'border-line bg-panel-light'
        }`}>
          {isAggressive ? '🔥' : '🗿'}
        </div>
      )}

      <div className={`max-w-[70%] border break-words px-4 py-3 text-sm leading-[1.65] max-md:max-w-[88%] max-md:px-[13px] max-md:py-[10px] max-md:text-[13.5px] max-[480px]:max-w-[92%] ${
        isUser
          ? 'rounded-[14px] rounded-br-[4px] border-user-bubble-border bg-user-bubble text-user-bubble-text'
          : `rounded-[14px] rounded-bl-[4px] border-line bg-panel text-ink ${
              isAggressive ? 'border-danger/25 bg-[rgba(30,15,15,0.9)]' : ''
            }`
      }`}>
        {isUser ? (
          <span>{msg.content}</span>
        ) : hasNoContent ? (
          <div className="flex items-center gap-[5px] py-1">
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
