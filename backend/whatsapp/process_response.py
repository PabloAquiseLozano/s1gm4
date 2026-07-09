import os
import time
import asyncio
import requests
from collections import deque
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Tuple, List

# Cargar las variables de configuracion desde el archivo .env principal
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

# Configurar el cliente de la API de Gemini usando la clave especifica para los bots
api_key = os.getenv("WSP_AND_TELEGRAM_BOT_KEY")
genai.configure(api_key=api_key)

# ---------------------------------------------------------------------------
# CONTROL DE TASA (Rate Limiter) — Limite: 5 peticiones por minuto (5 RPM)
# ---------------------------------------------------------------------------
# Guardamos los timestamps (en segundos) de los ultimos llamados a Gemini.
# Antes de cada llamada, eliminamos los que tienen mas de 60 segundos.
# Si ya hay 5 en la ventana de 60s, esperamos hasta que el mas antiguo expire.
_gemini_call_times: deque = deque()
_RATE_LIMIT_RPM = 5        # Maximo de llamadas por minuto
_RATE_WINDOW_SECS = 60     # Ventana de tiempo en segundos

# ---------------------------------------------------------------------------
# HISTORIAL LOCAL (fallback si WAHA no responde)
# Formato: { chatId: [ {"role": "user/assistant", "content": "..."} ] }
# ---------------------------------------------------------------------------
chat_histories: dict = {}


async def _wait_for_rate_limit():
    """
    Suspende la corutina (sin bloquear el event loop) hasta que sea seguro
    hacer otra llamada a Gemini sin superar el limite de 5 RPM.
    Usa asyncio.sleep() para no congelar el servidor mientras espera.
    """
    while True:
        now = time.time()

        # Quitar timestamps que ya estan fuera de la ventana de 60 segundos
        while _gemini_call_times and (now - _gemini_call_times[0]) >= _RATE_WINDOW_SECS:
            _gemini_call_times.popleft()

        # Si hay espacio en la ventana, podemos proceder
        if len(_gemini_call_times) < _RATE_LIMIT_RPM:
            break

        # Si ya llegamos al limite, calcular cuanto esperar para que expire el mas antiguo
        oldest = _gemini_call_times[0]
        wait_secs = _RATE_WINDOW_SECS - (now - oldest) + 0.5  # +0.5s de margen
        print(f"[Rate Limiter] Limite de {_RATE_LIMIT_RPM} RPM alcanzado. Esperando {wait_secs:.1f}s...")
        await asyncio.sleep(wait_secs)  # NO bloquea el event loop

    # Registrar esta llamada
    _gemini_call_times.append(time.time())


def _fetch_waha_history(chat_id: str) -> Tuple[List[dict], bool]:
    """
    Obtiene los ultimos 10 mensajes del chat desde la API de WAHA.
    Retorna (lista_de_mensajes, exito_bool).
    """
    waha_api_url = os.getenv("WAHA_API_URL", "http://localhost:8082")
    try:
        r = requests.get(
            f"{waha_api_url}/api/messages",
            params={"chatId": chat_id, "limit": 10, "session": "default"},
            timeout=5
        )
        if r.status_code == 200:
            raw = r.json()
            raw.reverse()  # WAHA devuelve del mas nuevo al mas antiguo; invertimos
            history = []
            for msg in raw:
                body = msg.get("body")
                if body and isinstance(body, str):
                    role = "assistant" if msg.get("fromMe") else "user"
                    history.append({"role": role, "content": body})
            print(f"[WAHA Historial] {len(history)} mensajes cargados para {chat_id}.")
            return history, True
    except Exception as e:
        print(f"[WAHA Historial] Error al obtener historial: {e}")
    return [], False


def _build_prompt(history: list, user_message: str) -> str:
    """
    Construye el prompt completo para Gemini combinando el contexto
    del historial de conversacion y el nuevo mensaje del usuario.
    """
    parts = [
        "You are Coach Seneca, an expert motivational and stoic coach on WhatsApp. ",
        "You help the user face life's struggles with discipline, rationality, and virtue. ",
        "Respond in Spanish. Keep your answers concise (max 3 short paragraphs), ",
        "directly targeting the user's situation, and encourage self-control. ",
        "Do not complain, remain calm and firm.\n\n"
    ]

    # Agregar los ultimos 8 mensajes del historial como contexto
    for msg in history[-8:]:
        label = "User" if msg["role"] == "user" else "Coach"
        parts.append(f"{label}: {msg['content']}\n")

    # Agregar el mensaje actual solo si no es identico al ultimo del historial
    last = history[-1] if history else None
    if not (last and last["role"] == "user" and last["content"].strip() == user_message.strip()):
        parts.append(f"User: {user_message}\n")

    parts.append("Coach:")
    return "".join(parts)


async def generate_stoic_response(user_message: str, chat_id: str) -> str:
    """
    Genera una respuesta estoica usando Gemini para el chat indicado.
    
    Flujo:
      1. Obtener historial real desde WAHA (o usar fallback en memoria).
      2. Esperar si se alcanzo el limite de 5 RPM.
      3. Llamar a Gemini con el contexto del chat.
      4. Guardar la respuesta en el historial local si WAHA fallo.

    :param user_message: Texto del mensaje entrante del usuario.
    :param chat_id: ID de la conversacion en WhatsApp (ej. '5191234@c.us').
    :return: Texto de la respuesta generada por Gemini.
    """
    model_name = os.getenv("WSP_AND_TELEGRAM_BOT_MODEL", "gemini-2.0-flash")

    # 1. Obtener historial de la conversacion
    history, waha_ok = _fetch_waha_history(chat_id)
    if not waha_ok:
        # Usar historial local como respaldo
        if chat_id not in chat_histories:
            chat_histories[chat_id] = []
        history = chat_histories[chat_id]

    # 2. Construir el prompt
    full_prompt = _build_prompt(history, user_message)

    # 3. Esperar si es necesario por el rate limit de 5 RPM (sin bloquear el event loop)
    await _wait_for_rate_limit()

    try:
        model = genai.GenerativeModel(model_name)
        # Ejecutar la llamada bloqueante a Gemini en un thread pool para no congelar el event loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: model.generate_content(full_prompt))
        response_text = response.text.strip()

        # 4. Si usamos historial local, actualizarlo con este turno
        if not waha_ok:
            history.append({"role": "user", "content": user_message})
            history.append({"role": "assistant", "content": response_text})
            # Limitar el historial en memoria a los ultimos 20 mensajes
            if len(history) > 20:
                chat_histories[chat_id] = history[-20:]

        print(f"[Gemini] Respuesta generada para {chat_id}: '{response_text[:80]}...'")
        return response_text

    except Exception as e:
        print(f"[Error Gemini] {e}")
        return "Centra tu atención en lo que puedes controlar. Inténtalo de nuevo en un momento."
