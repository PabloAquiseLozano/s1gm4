import os
from dotenv import load_dotenv
import google.generativeai as genai

# Cargar las variables de configuracion desde el archivo .env principal
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

# Configurar el cliente de la API de Gemini usando la clave especifica para los bots
api_key = os.getenv("WSP_AND_TELEGRAM_BOT_KEY")
genai.configure(api_key=api_key)

# Diccionario en memoria para almacenar el historial de conversacion de cada chat_id.
# Formato: { chat_id: [ {"role": "user/assistant", "content": "..."} ] }
chat_histories = {}

def generate_stoic_response(user_message, chat_id):
    """
    Interactua con el modelo de Gemini usando la variable WSP_AND_TELEGRAM_BOT_MODEL.
    Mantiene un historial de conversacion local para conservar el contexto.
    
    :param user_message: El nuevo mensaje de texto entrante del usuario.
    :param chat_id: El identificador unico de la sesion del chat del usuario.
    :return: La respuesta de texto generada por Gemini.
    """
    model_name = os.getenv("WSP_AND_TELEGRAM_BOT_MODEL", "gemini-2.0-flash")
    
    try:
        model = genai.GenerativeModel(model_name)

        # Obtener o inicializar el historial de conversacion para este chat especifico
        if chat_id not in chat_histories:
            chat_histories[chat_id] = []
            
        history = chat_histories[chat_id]

        # Construir el prompt de contexto para la personalidad del Coach de IA
        prompt_parts = [
            "You are Coach Seneca, an expert motivational and stoic coach on Telegram. ",
            "You help the user face life's struggles with discipline, rationality, and virtue. ",
            "Respond in Spanish. Keep your answers brief, organized, directly targeting the user's action, ",
            "and encourage self-control. Do not complain, remain calm and firm.\n\n"
        ]

        # Agregar los mensajes anteriores del historial para construir el contexto del prompt
        for msg in history[-10:]: # Enviar solo los ultimos 10 mensajes para ahorrar tokens de prompt
            role_label = "User" if msg["role"] == "user" else "Coach"
            prompt_parts.append(f"{role_label}: {msg['content']}\n")

        # Agregar el nuevo mensaje del usuario
        prompt_parts.append(f"User: {user_message}\n")
        prompt_parts.append("Coach:")

        full_prompt = "".join(prompt_parts)

        # Generar la respuesta usando el modelo configurado
        response = model.generate_content(full_prompt)
        response_text = response.text.strip()

        # Actualizar el historial con el turno actual (mensaje del usuario y respuesta del coach)
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": response_text})

        # Mantener la memoria del historial ligera (maximo los ultimos 20 mensajes)
        if len(history) > 20:
            chat_histories[chat_id] = history[-20:]

        return response_text

    except Exception as e:
        print(f"[Error en Gemini Processor] Error al generar contenido: {e}")
        return "Lo siento, mi mente racional se ha nublado momentáneamente. Centra tu atención en lo que controlas e intenta de nuevo."
