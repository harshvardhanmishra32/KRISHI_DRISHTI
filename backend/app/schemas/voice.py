"""
Pydantic Schemas for Voice Assistant Pipeline (P20).
"""

import uuid
from typing import Dict, Any, Optional
from pydantic import BaseModel


class VoiceQueryResponse(BaseModel):
    id: uuid.UUID
    transcript: str
    intent: str
    slots: Dict[str, Any]
    answer_text: str
    audio_url: Optional[str] = None
    language: str
