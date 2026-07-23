import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
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

/**
 * @param {object|null|undefined} user
 *   undefined = auth cargando | null = anónimo | object = autenticado
 */
export function useChatManager(user, language = 'es') {
  const [chats, setChats]               = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue]     = useState('');
  const [isLoading, setIsLoading]       = useState(true);

  const isAuthenticated = user !== null && user !== undefined;

  const userId = user?.id ?? (user === null ? 'anon' : undefined);
  const prevUserIdRef = useRef();

  // ── 1. Cargar chats ────────────────────────────────────────────────
  useEffect(() => {
    if (userId === undefined) return; // auth todavía cargando

    // Si el usuario no ha cambiado (ej: cambio de pestaña en navegador), NO recargar ni mostrar loader
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;

    async function loadData() {
      if (user) {
        // AUTENTICADO: cargar desde Supabase filtrado por user_id
        const { data, error } = await supabase
          .from('chats')
          .select('*, messages(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error cargando chats:', error);
          setIsLoading(false);
          return;
        }

        if (data?.length > 0) {
          const formatted = data.map((chat) => {
            const sortedMsgs = chat.messages.sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
            const firstUserMsg = sortedMsgs.find((m) => m.role === 'user');
            const displayTitle = (chat.title === 'Nuevo chat' || !chat.title) && firstUserMsg
              ? generateTitle(firstUserMsg.content)
              : (chat.title || 'Nuevo chat');

            return {
              ...chat,
              title: displayTitle,
              messages: sortedMsgs,
            };
          });

          // Si el chat más reciente ya tiene mensajes, crear un Nuevo Chat limpio al iniciar sesión
          if (formatted[0].messages.length > 0) {
            const { data: newChat, error: err } = await supabase
              .from('chats')
              .insert([{ title: 'Nuevo chat', mode: 'reflexive', user_id: user.id, session_id: user.id }])
              .select()
              .single();

            if (!err && newChat) {
              const newChatObj = { ...newChat, messages: [] };
              setChats([newChatObj, ...formatted]);
              setActiveChatId(newChatObj.id);
            } else {
              setChats(formatted);
              setActiveChatId(formatted[0].id);
            }
          } else {
            setChats(formatted);
            setActiveChatId(formatted[0].id);
          }
        } else {
          const { data: newChat, error: err } = await supabase
            .from('chats')
            .insert([{ title: 'Nuevo chat', mode: 'reflexive', user_id: user.id, session_id: user.id }])
            .select()
            .single();
          if (!err && newChat) {
            setChats([{ ...newChat, messages: [] }]);
            setActiveChatId(newChat.id);
          }
        }
      } else {
        // ANÓNIMO: 1 chat efímero en memoria
        const anonChat = {
          id: crypto.randomUUID(),
          title: 'Nuevo chat',
          mode: 'reflexive',
          messages: [],
          created_at: new Date().toISOString(),
        };
        setChats([anonChat]);
        setActiveChatId(anonChat.id);
      }
      setIsLoading(false);
    }

    setChats([]);
    setActiveChatId(null);
    setIsLoading(true);
    loadData();
  }, [userId, user]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // ── 2. Nuevo chat ──────────────────────────────────────────────────
  const handleNewChat = useCallback(async () => {
    if (!isAuthenticated) {
      // Anónimo: resetear el único chat
      const anonChat = {
        id: crypto.randomUUID(),
        title: 'Nuevo chat',
        mode: activeChat?.mode || 'reflexive',
        messages: [],
        created_at: new Date().toISOString(),
      };
      setChats([anonChat]);
      setActiveChatId(anonChat.id);
      setInputValue('');
      return;
    }

    const mode = activeChat?.mode || 'reflexive';
    const { data, error } = await supabase
      .from('chats')
      .insert([{ title: 'Nuevo chat', mode, user_id: user.id, session_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setChats((prev) => [{ ...data, messages: [] }, ...prev]);
      setActiveChatId(data.id);
      setInputValue('');
    }
  }, [isAuthenticated, activeChat, user]);

  // ── 3. Cambiar modo ────────────────────────────────────────────────
  const handleModeChange = useCallback(async (modeId) => {
    if (isAuthenticated) {
      await chatService.updateChatMode(activeChatId, modeId);
    }
    setChats((prev) =>
      prev.map((c) => (c.id === activeChatId ? { ...c, mode: modeId } : c))
    );
  }, [activeChatId, isAuthenticated]);

  // ── 4. Seleccionar chat ────────────────────────────────────────────
  const handleSelectChat = useCallback((chatId) => {
    if (!isGenerating) { setActiveChatId(chatId); setInputValue(''); }
  }, [isGenerating]);

  // ── 5. Borrar chat ─────────────────────────────────────────────────
  const handleDeleteChat = useCallback(async (chatId) => {
    if (isAuthenticated) {
      const { error } = await chatService.deleteChat(chatId);
      if (error) { console.error('Error al borrar chat:', error); return; }
    }
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== chatId);
      if (chatId === activeChatId && remaining.length > 0) setActiveChatId(remaining[0].id);
      return remaining;
    });
  }, [activeChatId, isAuthenticated]);

  // Si nos quedamos sin chats, crear uno nuevo
  useEffect(() => {
    if (!isLoading && chats.length === 0 && user !== undefined) handleNewChat();
  }, [chats.length, isLoading, handleNewChat, user]);

  // ── 6. Enviar mensaje + streaming ──────────────────────────────────
  const handleSend = useCallback(async (textOverride) => {
    const prompt = (textOverride || inputValue).trim();
    if (!prompt || isGenerating) return;
    if (!textOverride) setInputValue('');

    const mode          = MODES[activeChat?.mode] || MODES.reflexive;
    const currentChatId = activeChatId;
    setIsGenerating(true);

    // Guardar mensaje del usuario
    let savedUserMsg;
    if (isAuthenticated) {
      const { data, error } = await chatService.saveMessage(currentChatId, 'user', prompt);
      if (error) { console.error('Error guardando mensaje:', error); setIsGenerating(false); return; }
      savedUserMsg = data;
    } else {
      savedUserMsg = { id: crypto.randomUUID(), role: 'user', content: prompt, created_at: new Date().toISOString() };
    }

    const isFirstMsg = !activeChat?.messages || activeChat.messages.length === 0;
    const newTitle   = isFirstMsg ? generateTitle(prompt) : activeChat?.title;

    setChats((prev) => prev.map((c) => {
      if (c.id !== currentChatId) return c;
      return {
        ...c,
        title: isFirstMsg ? newTitle : c.title,
        messages: [...c.messages, savedUserMsg, { id: 'temp', role: 'assistant', content: '', streaming: true }],
      };
    }));

    if (isFirstMsg && isAuthenticated) {
      chatService.updateChatTitle(currentChatId, newTitle).catch((err) => {
        console.error('Error actualizando título del chat en Supabase:', err);
      });
    }

    try {
      const reader  = await fetchChatStream(prompt, activeChat.messages.slice(-12), mode.id, language);
      const decoder = new TextDecoder();
      let buffer = '', fullMsg = '';

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

      if (isAuthenticated && fullMsg) {
        const { data: savedBot, error: botErr } = await chatService.saveMessage(currentChatId, 'assistant', fullMsg);
        if (!botErr && savedBot) {
          setChats((prev) => updateLastMsg(prev, currentChatId, () => ({ ...savedBot, streaming: false })));
        }
      } else {
        setChats((prev) => updateLastMsg(prev, currentChatId, (last) => ({
          ...last, id: crypto.randomUUID(), streaming: false, content: fullMsg || last.content,
        })));
      }
    } catch (err) {
      setChats((prev) => updateLastMsg(prev, currentChatId, () => ({
        id: 'temp', role: 'assistant', streaming: false,
        content: `❌ **Error:** ${err.message || 'Error de conexión.'}`,
      })));
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, activeChat, activeChatId, isAuthenticated]);

  return {
    chats, activeChat, activeChatId, isGenerating, inputValue, isLoading,
    setInputValue, handleNewChat, handleModeChange, handleSelectChat, handleDeleteChat, handleSend,
  };
}
