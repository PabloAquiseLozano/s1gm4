import { useState, useCallback, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { fetchChatStream } from '../services/api';
import { MODES } from '../config/modes';
import { parseSSEBuffer } from '../utils/streamParser';

const generateTitle = (text) => {
  const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.length < text.trim().length ? `${words}…` : words;
};

const updateLastMsg = (prev, chatId, updater) =>
  prev.map((c) => {
    if (c.id !== chatId) return c;
    const msgs = [...c.messages];
    msgs[msgs.length - 1] = updater(msgs[msgs.length - 1]);
    return { ...c, messages: msgs };
  });

const formatChat = (chat) => {
  const messages = [...(chat.messages || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const firstUserMsg = messages.find((message) => message.role === 'user');
  const title = (chat.title === 'Nuevo chat' || !chat.title) && firstUserMsg
    ? generateTitle(firstUserMsg.content)
    : (chat.title || 'Nuevo chat');

  return { ...chat, title, messages };
};

const createAnonymousChat = (mode = 'reflexive') => ({
  id: crypto.randomUUID(),
  title: 'Nuevo chat',
  mode,
  messages: [],
  created_at: new Date().toISOString(),
});

export function useChatManager(user, language = 'es') {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null && user !== undefined;
  const userId = user?.id ?? (user === null ? 'anon' : undefined);
  const prevUserIdRef = useRef();

  useEffect(() => {
    if (userId === undefined) return;
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;

    async function loadData() {
      setChats([]);
      setActiveChatId(null);
      setIsLoading(true);

      if (!user) {
        const anonChat = createAnonymousChat();
        setChats([anonChat]);
        setActiveChatId(anonChat.id);
        setIsLoading(false);
        return;
      }

      const { data, error } = await chatService.loadChats(user.id);
      if (error) {
        console.error('Error cargando chats:', error);
        setIsLoading(false);
        return;
      }

      const formatted = (data || []).map(formatChat);
      if (formatted.length > 0) {
        setChats(formatted);
        setActiveChatId(formatted[0].id);
        setIsLoading(false);
        return;
      }

      const { data: newChat, error: createError } = await chatService.createChat(user.id);
      if (createError) {
        console.error('Error creando chat inicial:', createError);
        setIsLoading(false);
        return;
      }

      const initialChat = { ...newChat, messages: [] };
      setChats([initialChat]);
      setActiveChatId(initialChat.id);
      setIsLoading(false);
    }

    loadData();
  }, [userId, user]);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];

  const handleNewChat = useCallback(async () => {
    if (!isAuthenticated) {
      const anonChat = createAnonymousChat(activeChat?.mode || 'reflexive');
      setChats([anonChat]);
      setActiveChatId(anonChat.id);
      setInputValue('');
      return;
    }

    const { data, error } = await chatService.createChat(
      user.id,
      activeChat?.mode || 'reflexive'
    );
    if (error) {
      console.error('Error creando chat:', error);
      return;
    }

    setChats((prev) => [{ ...data, messages: [] }, ...prev]);
    setActiveChatId(data.id);
    setInputValue('');
  }, [activeChat?.mode, isAuthenticated, user]);

  const handleModeChange = useCallback(async (modeId) => {
    if (isAuthenticated) {
      const { error } = await chatService.updateChatMode(activeChatId, modeId);
      if (error) {
        console.error('Error actualizando modo:', error);
        return;
      }
    }
    setChats((prev) => prev.map((chat) => (
      chat.id === activeChatId ? { ...chat, mode: modeId } : chat
    )));
  }, [activeChatId, isAuthenticated]);

  const handleSelectChat = useCallback((chatId) => {
    if (!isGenerating) {
      setActiveChatId(chatId);
      setInputValue('');
    }
  }, [isGenerating]);

  const handleDeleteChat = useCallback(async (chatId) => {
    if (isAuthenticated) {
      const { error } = await chatService.deleteChat(chatId);
      if (error) {
        console.error('Error al borrar chat:', error);
        return;
      }
    }

    setChats((prev) => {
      const remaining = prev.filter((chat) => chat.id !== chatId);
      if (chatId === activeChatId && remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      }
      return remaining;
    });
  }, [activeChatId, isAuthenticated]);

  useEffect(() => {
    if (!isLoading && chats.length === 0 && user !== undefined) {
      handleNewChat();
    }
  }, [chats.length, handleNewChat, isLoading, user]);

  const handleSend = useCallback(async (textOverride) => {
    const prompt = (textOverride || inputValue).trim();
    if (!prompt || isGenerating || !activeChatId) return;
    if (!textOverride) setInputValue('');

    const mode = MODES[activeChat?.mode] || MODES.reflexive;
    const currentChatId = activeChatId;
    setIsGenerating(true);

    let savedUserMsg;
    if (isAuthenticated) {
      const { data, error } = await chatService.saveMessage(currentChatId, 'user', prompt);
      if (error) {
        console.error('Error guardando mensaje:', error);
        setIsGenerating(false);
        return;
      }
      savedUserMsg = data;
    } else {
      savedUserMsg = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        created_at: new Date().toISOString(),
      };
    }

    const isFirstMsg = !activeChat?.messages || activeChat.messages.length === 0;
    const newTitle = isFirstMsg ? generateTitle(prompt) : activeChat?.title;

    setChats((prev) => prev.map((chat) => {
      if (chat.id !== currentChatId) return chat;
      return {
        ...chat,
        title: isFirstMsg ? newTitle : chat.title,
        messages: [
          ...chat.messages,
          savedUserMsg,
          { id: 'temp', role: 'assistant', content: '', streaming: true },
        ],
      };
    }));

    if (isFirstMsg && isAuthenticated) {
      chatService.updateChatTitle(currentChatId, newTitle).catch((error) => {
        console.error('Error actualizando título del chat:', error);
      });
    }

    try {
      const reader = await fetchChatStream(
        prompt,
        activeChat.messages.slice(-12),
        mode.id,
        language
      );
      const decoder = new TextDecoder();
      let buffer = '';
      let fullMsg = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { texts, done: sseEnd, remaining } = parseSSEBuffer(buffer);
        buffer = remaining;
        if (texts.length > 0) {
          fullMsg += texts.join('');
          setChats((prev) => updateLastMsg(prev, currentChatId, (last) => ({
            ...last,
            content: fullMsg,
          })));
        }
        if (sseEnd) break;
      }

      if (isAuthenticated && fullMsg) {
        const { data: savedBot, error: botError } = await chatService.saveMessage(
          currentChatId,
          'assistant',
          fullMsg
        );
        if (!botError && savedBot) {
          setChats((prev) => updateLastMsg(prev, currentChatId, () => ({
            ...savedBot,
            streaming: false,
          })));
        }
      } else {
        setChats((prev) => updateLastMsg(prev, currentChatId, (last) => ({
          ...last,
          id: crypto.randomUUID(),
          streaming: false,
          content: fullMsg || last.content,
        })));
      }
    } catch (error) {
      setChats((prev) => updateLastMsg(prev, currentChatId, () => ({
        id: 'temp',
        role: 'assistant',
        streaming: false,
        content: `❌ **Error:** ${error.message || 'Error de conexión.'}`,
      })));
    } finally {
      setIsGenerating(false);
    }
  }, [activeChat, activeChatId, inputValue, isAuthenticated, isGenerating, language]);

  return {
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
    handleSend,
  };
}
