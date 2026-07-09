import { useState, useCallback, useEffect } from 'react';
import { getSessionId } from '../supabaseClient';
import { chatService } from '../services/chatService';
import { fetchChatStream } from '../services/api';
import { MODES } from '../config/modes';

export function useChatManager() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // ── 1. Cargar datos iniciales de Supabase ─────────────────────────────
  useEffect(() => {
    async function loadData() {
      const sessionId = getSessionId();
      
      const { data, error } = await chatService.loadChats(sessionId);
        
      if (error) {
        console.error('Error cargando chats:', error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const formattedChats = data.map((chat) => ({
          ...chat,
          messages: chat.messages.sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          ),
        }));
        setChats(formattedChats);
        setActiveChatId(formattedChats[0].id);
      } else {
        const { data: newChat, error: insertError } = await chatService.createChat(sessionId, 'reflexive');
          
        if (!insertError && newChat) {
          const chatWithMessages = { ...newChat, messages: [] };
          setChats([chatWithMessages]);
          setActiveChatId(newChat.id);
        }
      }
      setIsLoading(false);
    }
    
    loadData();
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // ── 2. Crear nuevo chat ───────────────────────────────────────────────
  const handleNewChat = useCallback(async () => {
    const sessionId = getSessionId();
    const mode = activeChat?.mode || 'reflexive';
    
    const { data: newChat, error } = await chatService.createChat(sessionId, mode);

    if (!error && newChat) {
      const chatWithMessages = { ...newChat, messages: [] };
      setChats((prev) => [chatWithMessages, ...prev]);
      setActiveChatId(newChat.id);
      setInputValue('');
    }
  }, [activeChat]);

  // ── 3. Cambiar modo del chat ──────────────────────────────────────────
  const handleModeChange = useCallback(async (modeId) => {
    const { error } = await chatService.updateChatMode(activeChatId, modeId);
      
    if (!error) {
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, mode: modeId } : c))
      );
    }
  }, [activeChatId]);

  // ── 4. Seleccionar chat ───────────────────────────────────────────────
  const handleSelectChat = useCallback((chatId) => {
    if (!isGenerating) {
      setActiveChatId(chatId);
      setInputValue('');
    }
  }, [isGenerating]);

  // ── 5. Borrar chat ────────────────────────────────────────────────────
  const handleDeleteChat = useCallback(async (chatId) => {
    const { error } = await chatService.deleteChat(chatId);

    if (error) {
      console.error('Error al borrar chat:', error);
      return;
    }

    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== chatId);
      if (remaining.length === 0) {
        return [];
      }
      if (chatId === activeChatId) setActiveChatId(remaining[0].id);
      return remaining;
    });
  }, [activeChatId]);

  // Si nos quedamos sin chats tras borrar, forzamos la creación de uno
  useEffect(() => {
    if (!isLoading && chats.length === 0) {
      handleNewChat();
    }
  }, [chats.length, isLoading, handleNewChat]);

  const generateTitle = (text) => {
    const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
    return words.length < text.trim().length ? `${words}…` : words;
  };

  // ── 6. Enviar mensaje y procesar streaming ────────────────────────────
  const handleSend = useCallback(async (textOverride) => {
    const prompt = (textOverride || inputValue).trim();
    if (!prompt || isGenerating) return;

    if (!textOverride) setInputValue('');

    const mode = MODES[activeChat.mode] || MODES.reflexive;
    const currentChatId = activeChatId;
    
    setIsGenerating(true);

    const { data: savedUserMsg, error: userMsgError } = await chatService.saveMessage(currentChatId, 'user', prompt);

    if (userMsgError) {
      console.error('Error guardando mensaje de usuario:', userMsgError);
      setIsGenerating(false);
      return;
    }

    let isFirstMsg = false;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== currentChatId) return c;
        isFirstMsg = c.messages.length === 0;
        const newTitle = isFirstMsg ? generateTitle(prompt) : c.title;
        return {
          ...c,
          title: newTitle,
          messages: [
            ...c.messages,
            savedUserMsg,
            { id: 'temp', role: 'assistant', content: '', streaming: true },
          ],
        };
      })
    );

    if (isFirstMsg) {
      await chatService.updateChatTitle(currentChatId, generateTitle(prompt));
    }

    try {
      const reader = await fetchChatStream(
        prompt,
        activeChat.messages.slice(-12),
        mode.id,
        mode.systemPrompt
      );

      const decoder = new TextDecoder();
      let buffer = '';
      let fullAssistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); 

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;

          try {
            const parsed = JSON.parse(raw);

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              fullAssistantMessage += parsed.text;
              setChats((prev) =>
                prev.map((c) => {
                  if (c.id !== currentChatId) return c;
                  const msgs = [...c.messages];
                  const last = msgs[msgs.length - 1];
                  msgs[msgs.length - 1] = {
                    ...last,
                    content: fullAssistantMessage,
                  };
                  return { ...c, messages: msgs };
                })
              );
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input' && e.message !== 'Unexpected token') {
              throw e; 
            }
          }
        }
      }

      if (fullAssistantMessage) {
        const { data: savedAssistantMsg, error: assistantMsgError } = await chatService.saveMessage(
          currentChatId,
          'assistant',
          fullAssistantMessage
        );

        if (!assistantMsgError && savedAssistantMsg) {
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== currentChatId) return c;
              const msgs = [...c.messages];
              msgs[msgs.length - 1] = { ...savedAssistantMsg, streaming: false };
              return { ...c, messages: msgs };
            })
          );
        }
      } else {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== currentChatId) return c;
            const msgs = [...c.messages];
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], streaming: false };
            return { ...c, messages: msgs };
          })
        );
      }

    } catch (err) {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== currentChatId) return c;
          const msgs = [...c.messages];
          msgs[msgs.length - 1] = {
            id: 'temp',
            role: 'assistant',
            content: `❌ **Error:** ${err.message || 'Error de conexión.'}`,
            streaming: false,
          };
          return { ...c, messages: msgs };
        })
      );
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, activeChat, activeChatId]);

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
    handleSend
  };
}
