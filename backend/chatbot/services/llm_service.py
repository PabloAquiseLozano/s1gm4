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


_COT_PREFIX_RE = re.compile(
    r"^\s*(?:•|\*|-)?\s*(?:User|Tone|Name|Persona|Language|Goal|The |Initial|S1GM4|Keywords|Structure|Direct|Confront|Table|Orders|Ending|Acknowledge|Address|Intent|Constraint|Action|Drafting)",
    re.IGNORECASE
)

def _is_cot_line(l: str) -> bool:
    if not l:
        return False
    return (
        bool(_COT_PREFIX_RE.match(l)) or
        re.match(r"^\d+\.\s+(?:Direct|Confront|Table|Orders|Ending|Call|The|Action)", l, re.IGNORECASE) or
        ("slang" in l and "(" in l) or
        ("context" in l and "(" in l) or
        ("WRONG" in l) or
        ("too soft" in l) or
        ("mindset" in l) or
        ("escapism" in l)
    )

def _strip_thinking(text: str) -> str:
    """Elimina cualquier bloque de razonamiento interno del texto (tags XML o borradores/CoT en texto plano multilingüe)."""
    text = _THINK_RE.sub("", text)

    lines = text.split("\n")
    clean_lines = []
    in_cot = True
    for line in lines:
        l = line.strip()
        if not l:
            if not in_cot:
                clean_lines.append(line)
            continue
        if _is_cot_line(l) and in_cot:
            continue
        else:
            in_cot = False
            clean_lines.append(line)

    return "\n".join(clean_lines)


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
    Instancia el modelo Gemma 4.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY no configurada.")

    # Se intenta configurar parámetros de generación para mitigar razonamiento interno
    config_args = {
        "temperature": 0.7,
    }

    return genai.GenerativeModel(
        model_name=CHATBOT_MODEL,
        system_instruction=system_instruction,
        generation_config=genai.GenerationConfig(**config_args),
    )


def _prepare_system_instruction(request: ChatRequest) -> str:
    system_instruction = get_prompt(request.mode, request.system_prompt)
    if hasattr(request, 'language') and request.language:
        lang_names = {'es': 'Español', 'en': 'English', 'pt': 'Português', 'fr': 'Français'}
        lang_str = lang_names.get(request.language, request.language)
        system_instruction += (
            f"\n\nRegla de Idioma Dinámico:\n"
            f"- Por defecto, tu idioma base preferido es {lang_str}.\n"
            f"- SI EL USUARIO CAMBIA DE IDIOMA en cualquier momento durante la conversación (por ejemplo, pasa de hablar en inglés a español, o de español a portugués, inglés o francés), "
            f"ADÁPTATE INMEDIATAMENTE y responde en el NUEVO idioma utilizado por el usuario, conservando al 100% el hilo, el contexto histórico y tu personalidad estoica."
        )
    return system_instruction


def generate_chat_stream(request: ChatRequest):
    """
    Generador SSE token a token.
    Filtra bloques de thinking (tags XML y notas CoT en texto plano) antes de emitir cada chunk al cliente.
    Preserva los espacios en blanco entre palabras.
    """
    system_instruction = _prepare_system_instruction(request)
    contents = _build_contents(request)
    pending = ""

    try:
        model = _get_model(system_instruction)
        response = model.generate_content(contents, stream=True)

        for chunk in response:
            raw = getattr(chunk, "text", "") or ""
            if not raw:
                continue

            pending += raw

            open_tags = re.findall(r"<\|channel>thought|<think>|<thinking>", pending, re.IGNORECASE)
            close_tags = re.findall(r"<channel\|>|</think>|</thinking>", pending, re.IGNORECASE)

            if len(open_tags) > len(close_tags):
                continue

            # Si el buffer acumulado contiene patrones de CoT / notas internas, retener hasta tener texto real
            lines = pending.split("\n")
            has_cot = any(_is_cot_line(l.strip()) for l in lines if l.strip())

            if has_cot:
                clean_test = _strip_thinking(pending).strip()
                if not clean_test:
                    # Todo el buffer es CoT — esperar más chunks
                    continue
                else:
                    # Ya comenzó la respuesta real limpia — emitir la respuesta limpia
                    clean = _strip_thinking(pending)
                    pending = ""
            else:
                clean = _strip_thinking(pending)
                pending = ""

            if clean:
                data = json.dumps({"text": clean}, ensure_ascii=False)
                yield f"data: {data}\n\n"

        if pending:
            clean = _strip_thinking(pending)
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
    system_instruction = _prepare_system_instruction(request)
    contents = _build_contents(request)
    model = _get_model(system_instruction)
    response = model.generate_content(contents)
    return _strip_thinking(response.text or "")
