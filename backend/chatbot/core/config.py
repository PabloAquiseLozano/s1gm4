import os
from dotenv import load_dotenv

load_dotenv()

# ── LLM ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")
# Modelo principal del chatbot web (Gemma 4 por defecto)
CHATBOT_MODEL   = os.getenv("CHATBOT_MODEL", "gemma-4-26b-a4b-it")

# ── ElevenLabs TTS ─────────────────────────────────────────────────────────
ELEVENLABS_API_KEY  = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_1  = os.getenv("ELEVENLABS_VOICE_1_ID", "gpc66KYqliPpG79YsgR8")
ELEVENLABS_VOICE_2  = os.getenv("ELEVENLABS_VOICE_2_ID", "iKHtG2yhvfTotc4aIALc")
