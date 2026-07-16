/**
 * streamParser.js — Utilidades para parsear el stream SSE del backend.
 *
 * También filtra cualquier bloque de thinking que Gemma 4 pueda emitir,
 * actuando como segunda línea de defensa en el cliente.
 */

/** Regex para bloques de reasoning que no debería ver el usuario */
const THINK_RE = /<\|channel>thought[\s\S]*?<channel\|>|<think>[\s\S]*?<\/think>|<thinking>[\s\S]*?<\/thinking>/gi;

/**
 * Elimina bloques de thinking interno del texto si alguno se filtró.
 * @param {string} text
 * @returns {string}
 */
export function stripThinking(text) {
  return text.replace(THINK_RE, '').trimStart();
}

/**
 * Parsea las líneas de un buffer SSE y extrae los chunks de texto.
 * @param {string} buffer - Buffer acumulado de chunks SSE
 * @returns {{ texts: string[], done: boolean, remaining: string }}
 */
export function parseSSEBuffer(buffer) {
  const lines = buffer.split('\n');
  const remaining = lines.pop(); // última línea puede estar incompleta
  const texts = [];
  let done = false;

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const raw = line.slice(6).trim();
    if (raw === '[DONE]') { done = true; break; }

    try {
      const parsed = JSON.parse(raw);
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.text) {
        const clean = stripThinking(parsed.text);
        if (clean) texts.push(clean);
      }
    } catch (e) {
      // Ignorar JSON incompleto (chunk cortado) — se completa en el siguiente ciclo
      const msg = e.message || '';
      if (!msg.includes('JSON') && !msg.includes('token')) throw e;
    }
  }

  return { texts, done, remaining };
}
