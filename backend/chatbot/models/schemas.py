from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []
    mode: Optional[str] = "reflexive"
    system_prompt: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    voice_id: str
