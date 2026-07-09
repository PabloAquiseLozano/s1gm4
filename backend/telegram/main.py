import time
from request_handler import TelegramHandler
from process_response import generate_stoic_response

def run_telegram_bot():
    """
    Punto de entrada principal para el Bot de Telegram.
    Une el request_handler y el process_response como un rompecabezas.
    """
    print("[Bot de Telegram] Iniciando ejecutor del bot...")
    try:
        telegram_api = TelegramHandler()
    except Exception as e:
        print(f"[Bot de Telegram] Error al iniciar: {e}")
        return

    # Registrar el ultimo ID de actualizacion procesado para evitar procesar mensajes duplicados
    last_update_id = None
    print("[Bot de Telegram] El bucle de polling esta activo. ¡Envia un mensaje a tu bot!")

    while True:
        # Obtener nuevas actualizaciones de Telegram
        updates = telegram_api.get_updates(offset=last_update_id)

        for update in updates:
            # Actualizar el offset de ID para marcar este mensaje como leido
            last_update_id = update.get("update_id") + 1
            
            message = update.get("message")
            if not message:
                continue
                
            chat_id = message.get("chat", {}).get("id")
            text = message.get("text")
            
            # Omitir mensajes vacios o que no sean de texto
            if not chat_id or not text:
                continue

            print(f"[Bot de Telegram] Mensaje recibido del chat_id {chat_id}: '{text}'")

            # Generar la respuesta utilizando Gemini (process_response)
            bot_response = generate_stoic_response(text, chat_id)

            # Enviar la respuesta de vuelta usando la API de Telegram (request_handler)
            telegram_api.send_message(chat_id, bot_response)

        # Dormir brevemente para reducir el consumo de recursos y evitar limites de peticiones
        time.sleep(1)

if __name__ == "__main__":
    run_telegram_bot()
