import { useState, useCallback, useEffect } from 'react';
import { getSessionId } from '../supabaseClient';
import { chatService } from '../services/chatService';
import { fetchChatStream } from '../services/api';
import { MODES } from '../config/modes';
import { parseSSEBuffer } from '../utils/streamParser';

const generateTitle = (text) => {
  const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.length < text.trim().length ? `${words}…` : words;
};

/** Actualiza el contenido del último mensaje (assistant) en el chat dado. */
const updateLastMsg = (prev, chatId, updater) =>
  prev.map((c) => {
    if (c.id !== chatId) return c;
    const msgs = [...c.messages];
    msgs[msgs.length - 1] = updater(msgs[msgs.length - 1]);
    return { ...c, messages: msgs };
  });

export function useChatManager() {
  const [chats, setChats]             = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue]   = useState('');
  const [isLoading, setIsLoading]     = useState(true);

  // ── 1. Cargar chats desde Supabase ─────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      const sessionId = getSessionId();
      const { data, error } = await chatService.loadChats(sessionId);

      if (error) {
        console.error('Error cargando chats:', error);
        setIsLoading(false);
        return;
      }

      if (data?.length > 0) {
        const formatted = data.map((chat) => ({
          ...chat,
          messages: chat.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        }));
        setChats(formatted);
        setActiveChatId(formatted[0].id);
      } else {
        const { data: newChat, error: err } = await chatService.createChat(sessionId, 'reflexive');
        if (!err && newChat) {
          setChats([{ ...newChat, messages: [] }]);
          setActiveChatId(newChat.id);
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // ── 2. Nuevo chat ───────────────────────────────────────────────────────
  const handleNewChat = useCallback(async () => {
    const sessionId = getSessionId();
    const mode = activeChat?.mode || 'reflexive';
    const { data, error } = await chatService.createChat(sessionId, mode);
    if (!error && data) {
      setChats((prev) => [{ ...data, messages: [] }, ...prev]);
      setActiveChatId(data.id);
      setInputValue('');
    }
  }, [activeChat]);

  // ── 3. Cambiar modo ─────────────────────────────────────────────────────
  const handleModeChange = useCallback(async (modeId) => {
    const { error } = await chatService.updateChatMode(activeChatId, modeId);
    if (!error) {
      setChats((prev) => prev.map((c) => (c.id === activeChatId ? { ...c, mode: modeId } : c)));
    }
  }, [activeChatId]);

  // ── 4. Seleccionar chat ─────────────────────────────────────────────────
  const handleSelectChat = useCallback((chatId) => {
    if (!isGenerating) { setActiveChatId(chatId); setInputValue(''); }
  }, [isGenerating]);

  // ── 5. Borrar chat ──────────────────────────────────────────────────────
  const handleDeleteChat = useCallback(async (chatId) => {
    const { error } = await chatService.deleteChat(chatId);
    if (error) { console.error('Error al borrar chat:', error); return; }
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== chatId);
      if (chatId === activeChatId && remaining.length > 0) setActiveChatId(remaining[0].id);
      return remaining;
    });
  }, [activeChatId]);

  // Si nos quedamos sin chats, creamos uno nuevo
  useEffect(() => {
    if (!isLoading && chats.length === 0) handleNewChat();
  }, [chats.length, isLoading, handleNewChat]);

  // ── 6. Enviar mensaje + streaming ───────────────────────────────────────
  const handleSend = useCallback(async (textOverride) => {
    const prompt = (textOverride || inputValue).trim();
    if (!prompt || isGenerating) return;
    if (!textOverride) setInputValue('');

    const mode          = MODES[activeChat?.mode] || MODES.reflexive;
    const currentChatId = activeChatId;
    setIsGenerating(true);

    // Guardar mensaje del usuario en Supabase
    const { data: savedUserMsg, error: userMsgError } = await chatService.saveMessage(currentChatId, 'user', prompt);
    if (userMsgError) { console.error('Error guardando mensaje:', userMsgError); setIsGenerating(false); return; }

    // Agregar mensaje al estado local + placeholder del bot
    let isFirstMsg = false;
    setChats((prev) => prev.map((c) => {
      if (c.id !== currentChatId) return c;
      isFirstMsg = c.messages.length === 0;
      return {
        ...c,
        title: isFirstMsg ? generateTitle(prompt) : c.title,
        messages: [...c.messages, savedUserMsg, { id: 'temp', role: 'assistant', content: '', streaming: true }],
      };
    }));

    if (isFirstMsg) await chatService.updateChatTitle(currentChatId, generateTitle(prompt));

    // ── Streaming SSE ──────────────────────────────────────────────────
    try {
      const reader  = await fetchChatStream(prompt, activeChat.messages.slice(-12), mode.id);
      const decoder = new TextDecoder();
      let buffer    = '';
      let fullMsg   = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { texts, done: sseEnd, remaining } = parseSSEBuffer(buffer);
        buffer = remaining;

        if (texts.length > 0) {
          fullMsg += texts.join('');
          setChats((prev) => updateLastMsg(prev, currentChatId, (last) => ({ ...last, content: fullMsg })));
        }

        if (sseEnd) break;
      }

      // Persistir respuesta completa en Supabase
      if (fullMsg) {
        const { data: savedBot, error: botErr } = await chatService.saveMessage(currentChatId, 'assistant', fullMsg);
        if (!botErr && savedBot) {
          setChats((prev) => updateLastMsg(prev, currentChatId, () => ({ ...savedBot, streaming: false })));
        }
      } else {
        setChats((prev) => updateLastMsg(prev, currentChatId, (last) => ({ ...last, streaming: false })));
      }

    } catch (err) {
      setChats((prev) => updateLastMsg(prev, currentChatId, () => ({
        id: 'temp', role: 'assistant', streaming: false,
        content: `❌ **Error:** ${err.message || 'Error de conexión.'}`,
      })));
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, activeChat, activeChatId]);

  return {
    chats, activeChat, activeChatId, isGenerating, inputValue, isLoading,
    setInputValue, handleNewChat, handleModeChange, handleSelectChat, handleDeleteChat, handleSend,
  };
}
