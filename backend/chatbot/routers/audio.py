from fastapi import APIRouter
from fastapi.responses import Response
from ..models.schemas import TTSRequest
from ..services.tts_service import generate_tts_audio

router = APIRouter(prefix="/api/tts", tags=["audio"])

@router.post("")
def tts_endpoint(request: TTSRequest):
    """
    Endpoint proxy para generar audio usando ElevenLabs.
    """
    audio_content = generate_tts_audio(request)
    return Response(content=audio_content, media_type="audio/mpeg")
