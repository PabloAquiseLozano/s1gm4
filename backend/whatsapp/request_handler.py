import os
import requests
import asyncio
import random
from dotenv import load_dotenv

# Cargar las variables de configuracion desde el archivo .env principal
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

class WhatsAppHandler:
    """
    Maneja todas las interacciones con el servicio de Docker WAHA (WhatsApp HTTP API).
    Expone metodos auxiliares para iniciar sesion, configurar webhooks y enviar respuestas de texto.
    """
    def __init__(self):
        # URL base de la API de WAHA (por defecto: http://localhost:8080)
        self.api_url = os.getenv("WAHA_API_URL", "http://localhost:8080")
        self.session = "default"

    def ensure_session(self):
        """
        Asegura que la sesion 'default' en WAHA este iniciada y lista.
        - Si esta detenida o no existe, la inicia con el webhook incluido.
        - Si ya esta activa (WORKING/SCAN_QR_CODE), actualiza el webhook via PUT.
        """
        url = f"{self.api_url}/api/sessions"
        try:
            response = requests.get(url)
            response.raise_for_status()
            sessions = response.json()

            # Buscar la sesion 'default' en la lista
            default_session = next((s for s in sessions if s.get("name") == self.session), None)

            if default_session:
                status = default_session.get("status")
                if status in ("STOPPED", "FAILED"):
                    # La sesion existe pero esta caida: reiniciarla con el webhook
                    print(f"[WAHA] La sesion '{self.session}' esta {status}. Reiniciandola...")
                    self._start_session()
                else:
                    # La sesion ya esta activa: actualizar el webhook sin reiniciarla
                    print(f"[WAHA] La sesion '{self.session}' esta {status}. Registrando webhook...")
                    self._patch_webhook()
            else:
                # No existe la sesion: crearla con el webhook ya configurado
                print(f"[WAHA] La sesion '{self.session}' no existe. Creandola...")
                self._start_session()
        except Exception as e:
            print(f"[Error en WAHA] No se pudo verificar/asegurar la sesion: {e}")

    def _start_session(self):
        """
        Activa WAHA para iniciar la sesion 'default' de WhatsApp Web.
        """
        url = f"{self.api_url}/api/sessions/start"
        webhook_url = os.getenv("WAHA_WEBHOOK_URL", "http://localhost:8001/webhook")
        
        # Configurar el webhook directamente dentro de la sesion
        payload = {
            "name": self.session,
            "config": {
                "webhooks": [
                    {
                        "url": webhook_url,
                        "events": ["message"],
                        "enabled": True
                    }
                ]
            }
        }
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            print(f"[WAHA] Comando de inicio enviado para la sesion '{self.session}' con exito.")
        except Exception as e:
            print(f"[Error en WAHA] No se pudo iniciar la sesion: {e}")

    def _patch_webhook(self):
        """
        Actualiza la configuracion del webhook en una sesion ya activa usando PUT.
        Esto es necesario cuando el servidor Python se reinicia pero WAHA ya tenia la sesion abierta.
        """
        url = f"{self.api_url}/api/sessions/{self.session}"
        webhook_url = os.getenv("WAHA_WEBHOOK_URL", "http://localhost:8001/webhook")
        payload = {
            "config": {
                "webhooks": [
                    {
                        "url": webhook_url,
                        "events": ["message"],
                        "enabled": True
                    }
                ]
            }
        }
        try:
            response = requests.put(url, json=payload)
            response.raise_for_status()
            print(f"[WAHA] Webhook actualizado correctamente en la sesion '{self.session}': {webhook_url}")
        except Exception as e:
            print(f"[Error en WAHA] No se pudo actualizar el webhook: {e}")

    def setup_webhook(self):
        """
        Metodo publico para registrar/actualizar el webhook (llamado desde main.py al inicio).
        Delega a _patch_webhook para actualizar la sesion activa.
        """
        self._patch_webhook()

    async def send_message_with_delay(self, chat_id, text):
        """
        Envia un mensaje a un numero de WhatsApp con un retraso de tiempo para evitar baneos.
        Primero activa el estado 'typing' (escribiendo...) visible en el chat,
        luego espera un intervalo aleatorio y finalmente envia el mensaje.
        
        :param chat_id: El ID de WhatsApp del destinatario (ej. '12345678@c.us').
        :param text: El contenido de texto a enviar.
        """
        # Calcular el retraso basado en la longitud del mensaje (min 2s, max 7s)
        delay = min(2.0 + len(text) * 0.03, 7.0)
        delay = max(delay, random.uniform(2.0, 4.0))

        # 1. Activar el estado 'typing' en el chat para que el usuario vea que se esta escribiendo
        loop = asyncio.get_event_loop()
        try:
            typing_url = f"{self.api_url}/api/{self.session}/chats/{chat_id}/typing"
            await loop.run_in_executor(
                None,
                lambda: requests.post(typing_url, json={"duration": int(delay * 1000)})
            )
            print(f"[WAHA] Estado 'typing' activado en {chat_id} por {delay:.1f}s")
        except Exception as e:
            # No es critico si falla el typing, continuar de todas formas
            print(f"[WAHA] No se pudo activar 'typing' en {chat_id}: {e}")

        # 2. Esperar el retraso calculado (simula el tiempo de escritura real)
        print(f"[WAHA] Esperando {delay:.2f}s antes de enviar mensaje a {chat_id}...")
        await asyncio.sleep(delay)

        # 3. Enviar el mensaje de texto
        url = f"{self.api_url}/api/sendText"
        payload = {
            "chatId": chat_id,
            "text": text,
            "session": self.session
        }

        try:
            response = await loop.run_in_executor(
                None,
                lambda: requests.post(url, json=payload)
            )
            response.raise_for_status()
            print(f"[WAHA] Mensaje enviado exitosamente a {chat_id}: '{text[:60]}...'")
            return True
        except Exception as e:
            print(f"[Error en WAHA] No se pudo enviar el mensaje a {chat_id}: {e}")
            return False
