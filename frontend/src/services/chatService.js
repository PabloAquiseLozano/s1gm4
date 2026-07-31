import { supabase } from '../supabaseClient';

const chatWithMessagesSelect = '*, messages(*)';

export const chatService = {
  async loadChats(userId) {
    const { data, error } = await supabase
      .from('chats')
      .select(chatWithMessagesSelect)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createChat(userId, mode = 'reflexive') {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ title: 'Nuevo chat', mode, user_id: userId }])
      .select()
      .single();
    return { data, error };
  },

  async updateChatMode(chatId, mode) {
    const { error } = await supabase
      .from('chats')
      .update({ mode })
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
  },
};
