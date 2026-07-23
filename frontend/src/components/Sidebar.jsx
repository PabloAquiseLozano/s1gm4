import { useState } from 'react';
import { LogOut, LogIn, Settings } from 'lucide-react';
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
  isGenerating, modes,
  user, onSignOut, onOpenAuth, onOpenSettings,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const { t } = useSettings();
  const isAnonymous = !user;

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const formattedName = formatName(rawName);

  return (
    <aside className="sidebar">
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        {logoSidebar ? (
          <img src={logoSidebar} alt="S1GM4 logo" className="sidebar-logo" />
        ) : (
          <span className="sidebar-brand-icon">🗿</span>
        )}
        <div>
          <h2 className="sidebar-brand-title">S1GM4</h2>
          <span className="sidebar-brand-sub">{t('brandSub')}</span>
        </div>
      </div>

      {/* ── Nuevo chat ── */}
      <div className="sidebar-new-chat">
        <button
          className="btn-new-chat"
          onClick={onNewChat}
          disabled={isGenerating || isAnonymous}
          title={isAnonymous ? t('guestNotice') : t('newChat')}
        >
          <span className="btn-new-chat-icon">＋</span>
          {t('newChat')}
        </button>
      </div>

      {/* ── Lista de chats (Solo usuarios autenticados) ── */}
      {!isAnonymous ? (
        <>
          <div className="sidebar-section-label">{t('conversaciones')}</div>
          <div className="sidebar-chat-list">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const msgCount = chat.messages.length;
              const lastMsg  = chat.messages[chat.messages.length - 1];

              return (
                <div
                  key={chat.id}
                  className={`chat-item ${isActive ? 'chat-item-active' : ''}`}
                  onMouseEnter={() => setHoveredId(chat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="chat-item-info">
                    <span className="chat-item-title">{chat.title}</span>
                    <span className="chat-item-meta">
                      {msgCount > 0
                        ? `${msgCount} msg · ${lastMsg?.content?.slice(0, 22) || ''}…`
                        : t('newChat')}
                    </span>
                  </div>

                  {hoveredId === chat.id && (
                    <button
                      className="chat-item-delete"
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
        <div className="sidebar-guest-spacer">
          <p className="sidebar-anon-hint">{t('guestNotice')}</p>
        </div>
      )}

      {/* ── Footer: Settings + Auth/User Info ── */}
      <div className="sidebar-footer">
        {/* Botón de Configuración */}
        <button className="sidebar-settings-btn" onClick={onOpenSettings}>
          <Settings size={16} />
          <span>{t('settingsTitle')}</span>
        </button>

        {user ? (
          <div className="sidebar-user">
            <img
              className="sidebar-avatar"
              src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=1a1a2e&color=fff&size=64`}
              alt="Avatar"
            />
            <div className="sidebar-user-info">
              <span className="sidebar-user-name" title={formattedName}>
                {formattedName}
              </span>
              <span className="sidebar-user-email" title={user.email}>
                {user.email}
              </span>
            </div>
            <button className="sidebar-logout-btn" onClick={onSignOut} title={t('logout')}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="sidebar-user" style={{ padding: '8px 0 0 0', borderTop: 'none' }}>
            <button className="sidebar-login-btn" onClick={onOpenAuth}>
              <LogIn size={16} />
              <span>{t('login')}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
