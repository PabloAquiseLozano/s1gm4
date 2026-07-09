import requests
import os
from dotenv import load_dotenv

# Cargar las variables de configuracion desde el archivo .env principal
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

class TelegramHandler:
    """
    Esta clase maneja todas las comunicaciones directas con la API HTTP de Telegram Bots.
    Utiliza llamadas simples de la libreria 'requests' sin depender de paquetes externos complejos.
    """
    def __init__(self):
        # Obtener el token del bot desde las variables de entorno
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not self.token:
            raise ValueError("TELEGRAM_BOT_TOKEN no esta configurado en el archivo .env")
        
        # URL base de la API de Telegram
        self.api_url = f"https://api.telegram.org/bot{self.token}"

    def get_updates(self, offset=None):
        """
        Obtiene los mensajes/actualizaciones pendientes desde los servidores de Telegram mediante long polling.
        :param offset: El ID de actualizacion para confirmar los mensajes previamente procesados.
        :return: Lista de actualizaciones (mensajes), o una lista vacia en caso de error/timeout.
        """
        url = f"{self.api_url}/getUpdates"
        params = {
            "timeout": 10, # Esperar hasta 10 segundos por nuevos mensajes
            "allowed_updates": ["message"]
        }
        if offset is not None:
            params["offset"] = offset

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            result = response.json()
            if result.get("ok"):
                return result.get("result", [])
        except Exception as e:
            print(f"[Error en Telegram Handler] Error al obtener actualizaciones: {e}")
        
        return []

    def send_message(self, chat_id, text):
        """
        Envia un mensaje de texto a un chat especifico de Telegram.
        :param chat_id: El ID del chat del destinatario en Telegram.
        :param text: El contenido de texto del mensaje a enviar.
        :return: True si se envio con exito, False de lo contrario.
        """
        url = f"{self.api_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown" # Soporta formato Markdown (negrita, cursiva)
        }

        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"[Error en Telegram Handler] Error al enviar mensaje a {chat_id}: {e}")
            return False
