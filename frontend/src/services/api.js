/**
 * Llama al backend para obtener el stream SSE de la IA.
 * Retorna el reader para que App.jsx controle su propio estado en React.
 */
export async function fetchChatStream(prompt, history, modeId, systemPrompt) {
  const payload = {
    message: prompt,
    history: history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    mode: modeId,
    system_prompt: systemPrompt,
  };

  const res = await fetch('http://localhost:8000/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error del servidor');
  }

  return res.body.getReader();
}
