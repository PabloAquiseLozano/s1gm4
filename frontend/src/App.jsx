import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { useChatManager } from './hooks/useChatManager';
import { MODES } from './config/modes';

import MoaiLoader from './components/MoaiLoader';

function App() {
  const {
    chats,
    activeChat,
    activeChatId,
    isGenerating,
    inputValue,
    isLoading,
    setInputValue,
    handleNewChat,
    handleModeChange,
    handleSelectChat,
    handleDeleteChat,
    handleSend
  } = useChatManager();

  const suggestions = [];

  if (isLoading) {
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
      />
    </div>
  );
}

export default App;
