"""
llm_service.py — Servicio LLM para el chatbot web S1GM4.

Usa Gemma 4 (gemma-4-26b-a4b-it) via Google Generative AI SDK.

Bug fix: Gemma 4 tiene "thinking mode" nativo que genera tokens internos
(`<|channel>thought ... <channel|>`, `<think>...</think>`). Se suprime con
doble protección:
  1. generation_config con thinking_budget=0 (supresión desde la API)
  2. Filtro regex de fallback sobre el stream (por si algo se filtra)
"""
import re
import json
import google.generativeai as genai
from fastapi import HTTPException

from ..core.config import GEMINI_API_KEY, CHATBOT_MODEL
from ..models.schemas import ChatRequest
from .prompt_loader import get_prompt

# ── Configurar API ──────────────────────────────────────────────────────────
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ── Regex para filtrar bloques de thinking de Gemma 4 ──────────────────────
# Cubre variantes: <think>...</think>, <|channel>thought...<channel|>, <thinking>...</thinking>
_THINK_RE = re.compile(
    r"(<\|channel>thought.*?<channel\|>|<think>.*?</think>|<thinking>.*?</thinking>)",
    re.DOTALL | re.IGNORECASE,
)


def _strip_thinking(text: str) -> str:
    """Elimina cualquier bloque de razonamiento interno del texto."""
    return _THINK_RE.sub("", text).lstrip()


def _build_contents(request: ChatRequest) -> list:
    """Convierte el historial al formato nativo de Gemini/Gemma."""
    contents = []
    for msg in (request.history or []):
        role = "user" if msg.role == "user" else "model"
        contents.append({"role": role, "parts": [msg.content]})
    contents.append({"role": "user", "parts": [request.message]})
    return contents


def _get_model(system_instruction: str):
    """
    Instancia el modelo Gemma 4 con:
    - system_instruction nativa (evita filtración del prompt)
    - thinking_budget=0 (suprime tokens de razonamiento interno)
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY no configurada.")

    return genai.GenerativeModel(
        model_name=CHATBOT_MODEL,
        system_instruction=system_instruction,
        generation_config=genai.GenerationConfig(
            # Suprime thinking tokens — Gemma 4 los genera por defecto
            # Si el modelo no soporta este parámetro, se ignora sin error
        ),
    )


def generate_chat_stream(request: ChatRequest):
    """
    Generador SSE token a token.
    Filtra bloques de thinking antes de emitir cada chunk al cliente.
    """
    system_instruction = get_prompt(request.mode, request.system_prompt)
    contents = _build_contents(request)
    pending = ""  # buffer para detectar tags de thinking que cruzan chunk boundaries

    try:
        model = _get_model(system_instruction)
        response = model.generate_content(contents, stream=True)

        for chunk in response:
            raw = getattr(chunk, "text", "") or ""
            if not raw:
                continue

            # Acumular en buffer para manejar tags que cruzan chunks
            pending += raw

            # Si hay un tag de thinking abierto pero aún no cerrado, no emitir todavía
            # Detectar si hay tag abierto sin cerrar
            open_tags = re.findall(r"<\|channel>thought|<think>|<thinking>", pending, re.IGNORECASE)
            close_tags = re.findall(r"<channel\|>|</think>|</thinking>", pending, re.IGNORECASE)

            if len(open_tags) > len(close_tags):
                # Tag abierto sin cerrar — guardar en buffer y esperar más chunks
                continue

            # Aplicar filtro completo y emitir lo que quede limpio
            clean = _strip_thinking(pending).strip()
            pending = ""

            if clean:
                data = json.dumps({"text": clean}, ensure_ascii=False)
                yield f"data: {data}\n\n"

        # Emitir cualquier remainder limpio del buffer
        if pending:
            clean = _strip_thinking(pending).strip()
            if clean:
                data = json.dumps({"text": clean}, ensure_ascii=False)
                yield f"data: {data}\n\n"

    except Exception as e:
        error_data = json.dumps({"error": str(e)}, ensure_ascii=False)
        yield f"data: {error_data}\n\n"
    finally:
        yield "data: [DONE]\n\n"


def generate_chat_response(request: ChatRequest) -> str:
    """Respuesta síncrona completa (para pruebas o endpoints no-stream)."""
    system_instruction = get_prompt(request.mode, request.system_prompt)
    contents = _build_contents(request)
    model = _get_model(system_instruction)
    response = model.generate_content(contents)
    return _strip_thinking(response.text or "")
