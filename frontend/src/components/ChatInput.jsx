import { Select, MenuItem, IconButton } from '@mui/material';
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
    <div className={`input-footer ${isAggressive ? 'input-footer-danger' : ''}`}>
      <div className="input-wrapper">
        <textarea
          className={`chat-input ${isAggressive ? 'chat-input-danger' : ''}`}
          rows={1}
          placeholder={
            listening
              ? t('listening')
              : t('inputPlaceholder')
          }
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKey}
          disabled={isGenerating}
        />

        <div className="input-actions">
          <Select
            value={mode?.id || 'reflexive'}
            onChange={(e) => onModeChange(e.target.value)}
            size="small"
            renderValue={(value) => (
               <span style={{ color: value === 'aggressive' ? 'var(--danger)' : 'inherit', fontWeight: 500 }}>
                 {value === 'aggressive' ? t('modeAggressive') : t('modeReflexive')}
               </span>
            )}
            sx={{
              color: 'var(--text-secondary)',
              borderRadius: '12px',
              height: '36px',
              fontSize: '13px',
              fontFamily: 'Inter',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&:hover': { background: 'rgba(255,255,255,0.05)' }
            }}
            MenuProps={{
              sx: {
                "& .MuiPaper-root": {
                  backgroundColor: 'var(--panel)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  marginTop: '8px'
                },
                "& .MuiList-root": {
                  padding: '8px'
                },
                "& .MuiMenuItem-root": {
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  '&:hover': { backgroundColor: 'var(--panel-light)' }
                },
                "& .MuiMenuItem-root:last-child": {
                  marginBottom: 0
                },
                "& .MuiMenuItem-root.Mui-selected": {
                  backgroundColor: 'rgba(255,255,255,0.1) !important',
                }
              }
            }}
          >
            <MenuItem value="reflexive">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{t('modeReflexive')}</span>
              </div>
            </MenuItem>
            <MenuItem value="aggressive">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#ef4444' }}>{t('modeAggressive')}</span>
              </div>
            </MenuItem>
          </Select>

          <IconButton 
            onClick={onToggleMic} 
            sx={{ 
              color: listening ? 'var(--danger)' : 'var(--text-muted)',
              '&:hover': { background: 'rgba(255,255,255,0.05)' }
            }}
          >
            {listening ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
          </IconButton>

          {inputValue.trim().length > 0 && (
            <IconButton
              onClick={() => onSend()}
              disabled={isGenerating}
              sx={{ 
                color: isAggressive ? 'var(--danger)' : 'var(--text)',
                '&:hover': { background: 'rgba(255,255,255,0.05)' }
              }}
            >
              <ArrowUp size={18} />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
