import { useState } from 'react';
import logoSidebar from '../assets/logo.png';

function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, isGenerating, modes }) {
  const [hoveredId, setHoveredId] = useState(null);

  const formatTime = (ts) => {
    return 'Nuevo chat';
  };

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
          <span className="sidebar-brand-sub">Coaching Estoico · IA</span>
        </div>
      </div>

      {/* ── Nuevo chat ── */}
      <div className="sidebar-new-chat">
        <button
          className="btn-new-chat"
          onClick={onNewChat}
          disabled={isGenerating}
        >
          <span className="btn-new-chat-icon">＋</span>
          Nuevo Chat
        </button>
      </div>

      {/* ── Lista de chats ── */}
      <div className="sidebar-section-label">Conversaciones</div>
      <div className="sidebar-chat-list">
        {chats.map((chat) => {
          const isActive = chat.id === activeChatId;
          const mode     = modes[chat.mode];
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
                    : `Nuevo Chat`}
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

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        Desarrollado por - Pablo Dev -
      </div>
    </aside>
  );
}

export default Sidebar;
