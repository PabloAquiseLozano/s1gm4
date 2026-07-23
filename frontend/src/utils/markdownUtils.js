/**
 * markdownUtils.js — Utilitario para limpiar/fijar Markdown antes de renderizarlo.
 */

/**
 * Corrige tablas markdown malformadas que Gemma/Gemini genera cuando mezcla
 * ítems de lista con sintaxis de tabla:
 *   ANTES:  "- | DÍA | TAREA |"  → bullet + pipes → se renderiza como lista
 *   DESPUÉS: "| DÍA | TAREA |"   → tabla limpia
 */
export function fixMarkdownTables(md = '') {
  // 1. Separar filas de tablas que la IA junta en una sola línea usando '||'
  let text = md.replace(/\|\|/g, '|\n|');

  // 2. Corregir viñetas al inicio de filas de tablas (- | col | col | -> | col | col |)
  return text
    .split('\n')
    .map((line) => {
      const match = line.match(/^(\s*)[-*]\s+(\|.+)$/);
      if (match) return match[1] + match[2];
      return line;
    })
    .join('\n');
}

/**
 * Limpia el markdown de un mensaje para que suene natural al leerlo en voz alta.
 * Elimina encabezados, negritas, tablas, etc.
 * @param {string} text - Texto con markdown
 * @returns {string} - Texto plano para TTS
 */
export function markdownToSpeech(text = '') {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}([^*\n]+)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_\n]+)_{1,2}/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/>\s?/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[-*+]\s/g, '')
    .replace(/\|[^\n]+\|/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
