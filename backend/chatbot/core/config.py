import os
from dotenv import load_dotenv

load_dotenv()

# ── LLM ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
# Modelo principal del chatbot web (Gemma 4 por defecto)
CHATBOT_MODEL   = os.getenv("CHATBOT_MODEL", "gemma-4-26b-a4b-it")
