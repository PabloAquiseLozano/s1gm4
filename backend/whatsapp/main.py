import os
import uvicorn
import asyncio
import requests as req
from fastapi import FastAPI, Request
from request_handler import WhatsAppHandler
from process_response import generate_stoic_response
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

app = FastAPI(title="Receptor de Webhook para Bot de WhatsApp", version="4.0.0")

# Inicializar el manejador de la API de WAHA
waha_handler = WhatsAppHandler()

# Numero propio del bot, obtenido dinamicamente desde la API de chats al iniciar.
# Se usa para ignorar mensajes que el propio bot se envia a si mismo.
BOT_OWN_NUMBER: str = ""


def _get_bot_number_from_chats(api_url: str) -> str:
    """
    Consulta la API de chats de WAHA para obtener el numero propio del bot de forma dinamica.
    
    Estrategia:
      1. Pedir todos los chats al endpoint /api/default/chats
      2. Revisar el campo 'lastMessage.to' de cada chat — ese campo contiene
         el numero al que fue enviado el ultimo mensaje, que es el propio bot
         cuando 'lastMessage.fromMe' es True, o el destinatario cuando es False.
         En mensajes recibidos (fromMe=False), 'lastMessage.to' = numero del bot.
      3. Como respaldo, intentar el campo 'me.id' de /api/sessions/default
    
    :param api_url: URL base de la API de WAHA (ej. http://localhost:8082)
    :return: El ID de WhatsApp del bot (ej. '51921193321@c.us') o cadena vacia si no se encontro.
    """
    # --- Estrategia 1: Obtener desde los chats ---
    # El campo 'lastMessage.to' en mensajes recibidos (fromMe=False) contiene el numero del bot.
    try:
        r = req.get(f"{api_url}/api/default/chats", timeout=5)
        if r.status_code == 200:
            chats = r.json()
            print(f"[Bot WhatsApp] {len(chats)} chat(s) encontrados en WAHA.")
            for chat in chats:
                last = chat.get("lastMessage") or {}
                # En mensajes que alguien nos envia (fromMe=False), el campo 'to'
                # es el numero propio del bot en formato @c.us
                if not last.get("fromMe") and last.get("to"):
                    to_field = last["to"]
                    # Puede ser un string directo ('51921193321@c.us') o un dict con '_serialized'
                    if isinstance(to_field, str) and "@c.us" in to_field:
                        print(f"[Bot WhatsApp] Numero propio detectado desde chats (to de mensaje recibido): {to_field}")
                        return to_field
                    elif isinstance(to_field, dict):
                        serialized = to_field.get("_serialized", "")
                        if "@c.us" in serialized:
                            print(f"[Bot WhatsApp] Numero propio detectado desde chats (dict): {serialized}")
                            return serialized
    except Exception as e:
        print(f"[Bot WhatsApp] Error al consultar chats para obtener numero propio: {e}")

    # --- Estrategia 2: Fallback con el endpoint de sesiones ---
    try:
        r = req.get(f"{api_url}/api/sessions/default", timeout=5)
        if r.status_code == 200:
            me = r.json().get("me") or {}
            bot_id = me.get("id", "")
            if bot_id:
                print(f"[Bot WhatsApp] Numero propio obtenido desde sesion: {bot_id}")
                return bot_id
    except Exception as e:
        print(f"[Bot WhatsApp] Error al consultar sesion para obtener numero propio: {e}")

    print("[Bot WhatsApp] No se pudo determinar el numero propio del bot.")
    return ""


def _log_active_chats(api_url: str):
    """
    Muestra en consola todos los chats que tienen mensajes entrantes (fromMe=False).
    Util para confirmar que el bot puede ver quienes le han escrito.
    """
    try:
        r = req.get(f"{api_url}/api/default/chats", timeout=5)
        if r.status_code == 200:
            chats = r.json()
            incoming = [
                c for c in chats
                if (c.get("lastMessage") or {}).get("fromMe") is False
            ]
            print(f"[Bot WhatsApp] Chats con mensajes entrantes: {len(incoming)}")
            for c in incoming:
                last = c.get("lastMessage", {})
                sender = last.get("from", "desconocido")
                # El sender puede ser dict o string dependiendo del motor de WAHA
                if isinstance(sender, dict):
                    sender = sender.get("_serialized", "desconocido")
                print(f"  - Chat: {c.get('name', '?')} | Ultimo mensaje de: {sender} | '{last.get('body', '')[:50]}'")
    except Exception as e:
        print(f"[Bot WhatsApp] Error al listar chats activos: {e}")


@app.on_event("startup")
def startup_event():
    """
    Al iniciar el servidor:
    - Asegura que la sesion WAHA este activa.
    - Registra el webhook para recibir mensajes entrantes.
    - Obtiene el numero propio del bot desde la API de chats (sin hardcodear nada).
    - Lista los chats existentes con mensajes entrantes.
    """
    global BOT_OWN_NUMBER
    print("[Bot WhatsApp] Iniciando configuracion...")

    # Asegurar que la sesion WAHA exista y tenga el webhook registrado
    waha_handler.ensure_session()
    waha_handler.setup_webhook()

    # Obtener el numero propio del bot dinamicamente desde la API (sin hardcodear)
    BOT_OWN_NUMBER = _get_bot_number_from_chats(waha_handler.api_url)
    if not BOT_OWN_NUMBER:
        print("[Bot WhatsApp] ADVERTENCIA: No se pudo obtener el numero del bot. El filtro de auto-respuesta estara desactivado.")

    # Mostrar los chats que tienen mensajes entrantes
    _log_active_chats(waha_handler.api_url)

    print("[Bot WhatsApp] Listo para recibir mensajes.")


async def process_and_reply(chat_id: str, message_text: str):
    """
    Corutina que genera la respuesta de Gemini y la envia via WAHA.
    Se ejecuta fuera del ciclo del request para no bloquear el webhook.
    """
    print(f"[Bot WhatsApp] Procesando mensaje de [{chat_id}]: '{message_text[:80]}'", flush=True)

    # Generar respuesta con Gemini (incluye rate limiting interno de 5 RPM)
    bot_response = await generate_stoic_response(message_text, chat_id)
    print(f"[Bot WhatsApp] Respuesta lista para [{chat_id}]", flush=True)

    # Enviar al chat correcto con efecto typing + delay humano
    await waha_handler.send_message_with_delay(chat_id, bot_response)


async def _safe_process_and_reply(chat_id: str, message_text: str):
    """
    Envoltorio que captura cualquier excepcion del proceso y la imprime.
    asyncio.ensure_future() descarta las excepciones en silencio, por eso este wrapper es necesario.
    """
    try:
        await process_and_reply(chat_id, message_text)
    except Exception as e:
        import traceback
        print(f"[ERROR proceso async] Chat {chat_id}: {e}", flush=True)
        traceback.print_exc()


@app.post("/webhook")
async def webhook_receiver(request: Request):
    """
    Endpoint que WAHA llama en tiempo real cada vez que llega un mensaje a WhatsApp.

    Flujo:
      1. Lee el evento JSON.
      2. Ignora eventos que no son mensajes nuevos.
      3. Ignora mensajes enviados por el propio bot (fromMe=True) para evitar bucles.
      4. Ignora mensajes al propio numero del bot.
      5. Ignora mensajes sin texto (imagenes, stickers, voz, etc.).
      6. Lanza el procesamiento en background y retorna 200 OK de inmediato.
    """
    try:
        data = await request.json()
    except Exception:
        return {"status": "ignored", "reason": "invalid_json"}

    event_type = data.get("event")
    payload    = data.get("payload", {})

    print(f"[Webhook] Evento: {event_type} | fromMe={payload.get('fromMe')} | "
          f"from={payload.get('from')} | chatId={payload.get('chatId')}", flush=True)

    # Filtro 1: solo eventos de mensaje nuevo
    if event_type != "message":
        return {"status": "ignored", "reason": f"event={event_type}"}

    # Filtro 2: ignorar mensajes enviados por el propio bot
    if payload.get("fromMe"):
        return {"status": "ignored", "reason": "fromMe=True"}

    # Extraer el ID del chat al que debemos responder.
    # chatId es el ID de la conversacion normalizado por WAHA (grupo o DM).
    chat_id      = payload.get("chatId") or payload.get("from", "")
    message_body = payload.get("body", "").strip()

    # Filtro 3: ignorar si el chat destino es el numero propio del bot
    if chat_id and BOT_OWN_NUMBER and chat_id == BOT_OWN_NUMBER:
        print(f"[Webhook] Ignorado: mensaje al numero propio ({chat_id})", flush=True)
        return {"status": "ignored", "reason": "self_chat"}

    # Filtro 4: ignorar si no hay cuerpo de texto
    if not chat_id or not message_body:
        return {"status": "ignored", "reason": "no_text"}

    # Lanzar el procesamiento asincrono sin bloquear el retorno 200 OK
    asyncio.ensure_future(_safe_process_and_reply(chat_id, message_body))

    print(f"[Webhook] Encolado para respuesta -> chat: {chat_id} | '{message_body[:60]}'", flush=True)
    return {"status": "processing", "chat_id": chat_id}


if __name__ == "__main__":
    print("[Bot WhatsApp] Iniciando servidor en puerto 8001...")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
