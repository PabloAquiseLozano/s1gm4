import { supabase } from '../supabaseClient';

export const chatService = {
  async loadChats(sessionId) {
    const { data, error } = await supabase
      .from('chats')
      .select('*, messages(*)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createChat(sessionId, mode = 'reflexive') {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ title: 'Nuevo chat', mode, session_id: sessionId }])
      .select()
      .single();
    return { data, error };
  },

  async updateChatMode(chatId, modeId) {
    const { error } = await supabase
      .from('chats')
      .update({ mode: modeId })
      .eq('id', chatId);
    return { error };
  },

  async updateChatTitle(chatId, title) {
    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId);
    return { error };
  },

  async deleteChat(chatId) {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);
    return { error };
  },

  async saveMessage(chatId, role, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, role, content }])
      .select()
      .single();
    return { data, error };
  }
};
