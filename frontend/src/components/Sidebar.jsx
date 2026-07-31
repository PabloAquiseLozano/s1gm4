import { useState } from 'react';
import { LogOut, LogIn, Settings, X } from 'lucide-react';
import logoSidebar from '../assets/logo.png';
import { useSettings } from '../contexts/SettingsContext';

function formatName(name) {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function Sidebar({
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat,
  isGenerating,
  user, onSignOut, onOpenAuth, onOpenSettings,
  isOpen, onClose,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const { t } = useSettings();
  const isAnonymous = !user;

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const formattedName = formatName(rawName);

  return (
    <>
      <div
        className={`fixed inset-0 z-[199] bg-black/60 backdrop-blur-[4px] transition-opacity duration-300 md:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[200] flex h-full w-[280px] max-w-[85vw] flex-col overflow-hidden border-r border-line bg-panel shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:z-auto md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ── Brand ── */}
        <div className="flex items-center justify-between border-b border-line px-[18px] pb-4 pt-5">
          <div className="flex items-center gap-3">
            {logoSidebar ? (
              <img src={logoSidebar} alt="S1GM4 logo" className="logo-invert h-8 w-8 rounded-md object-contain" />
            ) : (
              <span className="text-[22px]">🗿</span>
            )}
            <div>
              <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-ink-strong">
                S1GM4
              </h2>
              <span className="text-[10px] uppercase tracking-[0.06em] text-ink-muted">
                {t('brandSub')}
              </span>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-panel-light hover:text-ink md:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Nuevo chat ── */}
        <div className="px-[14px] pb-2 pt-[14px]">
          <button
            className="flex w-full items-center gap-2 rounded-lg border border-line-light bg-panel-light px-[14px] py-[10px] text-[13px] font-semibold text-ink-secondary transition hover:border-line-light hover:bg-line hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
            onClick={onNewChat}
            disabled={isGenerating || isAnonymous}
            title={isAnonymous ? t('guestNotice') : t('newChat')}
          >
            <span className="text-[17px] leading-none">＋</span>
            {t('newChat')}
          </button>
        </div>

        {/* ── Lista de chats (Solo usuarios autenticados) ── */}
        {!isAnonymous ? (
          <>
            <div className="px-[18px] pb-1 pt-[10px] text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
              {t('conversaciones')}
            </div>
            <div className="flex flex-1 flex-col gap-[2px] overflow-y-auto px-[10px] py-1">
              {chats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const msgCount = chat.messages.length;
                const lastMsg = chat.messages[chat.messages.length - 1];

                return (
                  <div
                    key={chat.id}
                    className={`relative flex cursor-pointer select-none items-center gap-[10px] rounded-lg px-[10px] py-[9px] transition-colors hover:bg-panel-light ${
                      isActive ? 'bg-panel-light' : ''
                    }`}
                    onMouseEnter={() => setHoveredId(chat.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                      <span className="truncate text-[12.5px] font-medium text-ink">
                        {chat.title}
                      </span>
                      <span className="truncate text-[10px] text-ink-muted">
                        {msgCount > 0
                          ? `${msgCount} msg · ${lastMsg?.content?.slice(0, 22) || ''}…`
                          : t('newChat')}
                      </span>
                    </div>

                    {hoveredId === chat.id && (
                      <button
                        className="absolute right-2 rounded px-1 py-0.5 text-xs text-ink-muted transition hover:bg-danger-dim hover:text-danger"
                        onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                        title="Eliminar este chat"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-3 py-5">
            <p className="text-center text-[10px] leading-[1.4] text-ink-muted">
              {t('guestNotice')}
            </p>
          </div>
        )}

        {/* ── Footer: Settings + Auth/User Info ── */}
        <div className="mt-auto flex flex-col gap-2 border-t border-line px-[14px] py-[14px] text-center text-[10px] tracking-[0.04em] text-ink-muted">
          <button
            className="flex w-full items-center gap-[10px] rounded-lg px-[14px] py-[10px] text-[13px] font-medium text-ink-secondary transition hover:bg-panel-light hover:text-ink"
            onClick={onOpenSettings}
          >
            <Settings size={16} />
            <span>{t('settingsTitle')}</span>
          </button>

          {user ? (
            <div className="mt-1 flex items-center gap-[10px] border-t border-line px-[12px] py-[10px] text-left">
              <img
                className="h-8 w-8 flex-shrink-0 rounded-full border border-line object-cover"
                src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=1a1a2e&color=fff&size=64`}
                alt="Avatar"
              />
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <span className="block w-full truncate text-[13px] font-semibold text-ink" title={formattedName}>
                  {formattedName}
                </span>
                <span className="mt-px block w-full truncate text-[11px] text-ink-muted" title={user.email}>
                  {user.email}
                </span>
              </div>
              <button className="flex flex-shrink-0 items-center rounded-md p-1.5 text-ink-muted transition hover:bg-danger-dim hover:text-danger" onClick={onSignOut} title={t('logout')}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="flex w-full items-center gap-2 rounded-lg border border-line bg-transparent px-[14px] py-[10px] text-xs font-medium text-ink-secondary transition hover:border-accent hover:bg-panel-light hover:text-accent" onClick={onOpenAuth}>
              <LogIn size={16} />
              <span>{t('login')}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
