/**
 * api.js — Capa de comunicación con el backend S1GM4.
 * La URL base se configura via VITE_API_URL (default: localhost:8000)
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Llama al endpoint de streaming SSE del backend.
 * El system_prompt ya no se envía desde el frontend — el backend lo resuelve
 * internamente según el `mode` y los archivos de personalidad .md.
 *
 * @param {string} prompt - Mensaje del usuario
 * @param {Array}  history - Historial reciente (últimos 12 mensajes)
 * @param {string} modeId  - 'reflexive' | 'aggressive'
 * @returns {ReadableStreamDefaultReader}
 */
export async function fetchChatStream(prompt, history, modeId, language = 'es') {
  const payload = {
    message: prompt,
    history: history.map(({ role, content }) => ({ role, content })),
    mode:    modeId,
    language: language,
  };

  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error del servidor');
  }

  return res.body.getReader();
}
