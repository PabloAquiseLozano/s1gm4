/**
 * modes.js — Configuración de los modos de personalidad de S1GM4.
 *
 * Los system prompts ya NO viven aquí — se centralizaron en el backend
 * como archivos Markdown en `backend/chatbot/prompts/*.md`.
 * El frontend solo necesita los datos de UI (label, emoji, danger).
 */
export const MODES = {
  reflexive: {
    id:          'reflexive',
    label:       'Reflexivo',
    emoji:       '🏛️',
    description: 'Guía estoica, empática y estructurada',
    danger:      false,
  },
  aggressive: {
    id:          'aggressive',
    label:       '🔥 Modo Bestia',
    emoji:       '🔥',
    description: 'Motivación brutal y sin filtros',
    danger:      true,
  },
};
