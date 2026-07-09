import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Faltan variables de entorno para Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utilidad para obtener o generar el session_id anónimo
export const getSessionId = () => {
  let sessionId = localStorage.getItem('s1gm4_session_id');
  if (!sessionId) {
    // Generar un UUID v4 simple para la sesión anónima
    sessionId = crypto.randomUUID();
    localStorage.setItem('s1gm4_session_id', sessionId);
  }
  return sessionId;
};
