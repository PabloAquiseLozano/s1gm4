from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from ..models.schemas import ChatRequest
from ..services.llm_service import generate_chat_stream, generate_chat_response

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/stream")
def chat_stream_endpoint(request: ChatRequest):
    """
    Streaming endpoint que devuelve la respuesta de Gemini token a token
    usando Server-Sent Events (SSE).
    """
    return StreamingResponse(
        generate_chat_stream(request), 
        media_type="text/event-stream"
    )

@router.post("")
def chat_sync_endpoint(request: ChatRequest):
    """
    Endpoint síncrono para pruebas (retorna JSON cuando termina).
    """
    response_text = generate_chat_response(request)
    return {"response": response_text}
