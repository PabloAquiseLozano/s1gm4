import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import { useChatManager } from './hooks/useChatManager';
import { MODES } from './config/modes';
import MoaiLoader from './components/MoaiLoader';

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { language } = useSettings();

  const {
    chats, activeChat, activeChatId, isGenerating,
    inputValue, isLoading,
    setInputValue, handleNewChat, handleModeChange,
    handleSelectChat, handleDeleteChat, handleSend,
  } = useChatManager(user, language);

  const suggestions = [];

  if (loading || isLoading) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <MoaiLoader />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isGenerating={isGenerating}
        modes={MODES}
        user={user}
        onSignOut={signOut}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />
      <ChatWindow
        chat={activeChat}
        mode={MODES[activeChat?.mode] || MODES.reflexive}
        isGenerating={isGenerating}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        onModeChange={handleModeChange}
        suggestions={suggestions}
        isAnonymous={!user}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
