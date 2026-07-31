import { Mic, Square, ArrowUp } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

function ChatInput({ mode, onModeChange, isAggressive, listening, isGenerating, inputValue, onInputChange, onSend, onToggleMic }) {
  const { t } = useSettings();

  const handleChange = (e) => {
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

  return (
    <div className="w-full bg-bg px-5 pb-6 pt-4 max-md:px-3 max-md:pb-[calc(12px+env(safe-area-inset-bottom))] max-md:pt-2.5">
      <div className="mx-auto flex max-w-[820px] items-center gap-2.5 rounded-[24px] bg-panel-light py-[10px] pl-5 pr-[14px] transition-colors max-md:gap-1.5 max-md:rounded-[20px] max-md:px-2 max-md:pl-[14px]">
        <textarea
          className="max-h-[160px] min-h-6 max-md:max-h-[120px] flex-1 resize-none overflow-y-auto bg-transparent p-0 text-sm leading-[1.55] text-ink placeholder:text-ink-muted focus:outline-none"
          rows={1}
          placeholder={listening ? t('listening') : t('inputPlaceholder')}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKey}
          disabled={isGenerating}
        />

        <div className="flex items-center gap-2 max-md:gap-1.5">
          <select
            value={mode?.id || 'reflexive'}
            onChange={(e) => onModeChange(e.target.value)}
            className={`cursor-pointer rounded-xl border bg-panel px-2.5 py-1.5 text-xs font-medium text-ink-secondary outline-none transition hover:bg-panel-light focus:border-line-light max-md:max-w-[95px] max-md:px-1.5 max-md:text-[11px] ${
              isAggressive ? 'border-danger/30 text-danger' : 'border-line'
            }`}
          >
            <option value="reflexive">{t('modeReflexive')}</option>
            <option value="aggressive" className="text-danger">{t('modeAggressive')}</option>
          </select>

          <button
            className={`mic-btn max-md:h-8 max-md:w-8 max-md:min-w-8 max-md:rounded-full max-md:text-sm ${
              listening ? 'mic-btn-active' : ''
            }`}
            onClick={onToggleMic}
            title={listening ? t('listening') : ''}
          >
            {listening ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
          </button>

          {inputValue.trim().length > 0 && (
            <button
              onClick={() => onSend()}
              disabled={isGenerating}
              className={`flex h-[34px] w-[34px] min-w-[34px] items-center justify-center rounded-full text-base font-bold transition disabled:cursor-not-allowed disabled:bg-line-light disabled:text-ink-muted max-md:h-8 max-md:w-8 max-md:min-w-8 max-md:text-sm ${
                isAggressive
                  ? 'bg-danger text-white hover:bg-[#f87171]'
                  : 'bg-white text-black hover:scale-[1.05] hover:opacity-80'
              }`}
              aria-label="Enviar mensaje"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
