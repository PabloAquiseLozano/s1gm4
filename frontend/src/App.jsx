import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { useChatManager } from './hooks/useChatManager';
import { MODES } from './config/modes';

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

  const suggestions = [
    '¿Cómo reacciono ante una crítica pública injusta?',
    'Me preocupa el futuro y perder el control.',
    'Ayúdame a organizar mi semana con disciplina.',
    'Necesito un plan para superar la procrastinación.',
  ];

  if (isLoading) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', color: 'white' }}>
        Cargando tus reflexiones... 🗿
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
