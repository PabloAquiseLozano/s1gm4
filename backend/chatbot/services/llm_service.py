import os
import json
import google.generativeai as genai
from fastapi import HTTPException
from ..core.config import GEMINI_API_KEY, GEMINI_MODEL
from ..models.schemas import ChatRequest

# Configurar la API de Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Cargar prompts del sistema
PROMPTS_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "system_prompts.json")
try:
    with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
        DEFAULT_PROMPTS = json.load(f)
except Exception:
    DEFAULT_PROMPTS = {
        "reflexive": "Eres S1GM4 en modo Reflexivo.",
        "aggressive": "Eres S1GM4 en Modo Bestia."
    }

def get_system_prompt(request: ChatRequest) -> str:
    """Obtiene el prompt del sistema basado en el modo o el provisto por el usuario."""
    return request.system_prompt or DEFAULT_PROMPTS.get(request.mode or "reflexive", DEFAULT_PROMPTS["reflexive"])

def build_gemini_contents(request: ChatRequest) -> list:
    """Convierte el historial de mensajes al formato nativo de Gemini."""
    contents = []
    for msg in (request.history or []):
        role = "user" if msg.role == "user" else "model"
        contents.append({"role": role, "parts": [msg.content]})
    
    # Agregar el mensaje actual
    contents.append({"role": "user", "parts": [request.message]})
    return contents

def get_gemini_model(system_instruction: str):
    """Retorna una instancia del modelo Gemini configurado con la instrucción de sistema."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY no configurada.")
    
    # Usar system_instruction nativo de Gemini (evita filtraciones del prompt)
    return genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=system_instruction
    )

def generate_chat_stream(request: ChatRequest):
    """Generador para Server-Sent Events (SSE) token a token."""
    system_instruction = get_system_prompt(request)
    contents = build_gemini_contents(request)
    
    try:
        model = get_gemini_model(system_instruction)
        response = model.generate_content(contents, stream=True)
        
        for chunk in response:
            if chunk.text:
                data = json.dumps({"text": chunk.text}, ensure_ascii=False)
                yield f"data: {data}\n\n"
    except Exception as e:
        error_data = json.dumps({"error": str(e)}, ensure_ascii=False)
        yield f"data: {error_data}\n\n"
    finally:
        yield "data: [DONE]\n\n"

def generate_chat_response(request: ChatRequest) -> str:
    """Respuesta síncrona completa."""
    system_instruction = get_system_prompt(request)
    contents = build_gemini_contents(request)
    
    model = get_gemini_model(system_instruction)
    response = model.generate_content(contents)
    return response.text
