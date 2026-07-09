import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

import google.generativeai as genai

api_key   = os.getenv("WSP_AND_TELEGRAM_BOT_KEY", "")
model_name = os.getenv("WSP_AND_TELEGRAM_BOT_MODEL", "gemini-2.0-flash")

print(f"Modelo: {model_name}")
print(f"Key (fin): ...{api_key[-8:]}")

genai.configure(api_key=api_key)
model = genai.GenerativeModel(model_name)

try:
    r = model.generate_content("Responde solo: OK")
    print(f"Respuesta: {r.text.strip()}")
    print("Gemini funciona correctamente con el nuevo modelo.")
except Exception as e:
    print(f"ERROR: {e}")
