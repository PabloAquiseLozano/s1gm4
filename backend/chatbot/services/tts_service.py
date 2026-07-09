import requests
from fastapi import HTTPException
from ..core.config import ELEVENLABS_API_KEY
from ..models.schemas import TTSRequest

def generate_tts_audio(request: TTSRequest):
    """Proxy hacia ElevenLabs para generar audio a partir de texto."""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=400, detail="ELEVENLABS_API_KEY no configurada.")
        
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{request.voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": request.text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if not response.ok:
        raise HTTPException(
            status_code=response.status_code, 
            detail=f"Error en ElevenLabs: {response.text}"
        )
        
    return response.content
