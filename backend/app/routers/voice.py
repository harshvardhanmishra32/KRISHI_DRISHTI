"""
FastAPI Router for Multilingual Voice Assistant (P20).
Provides POST /voice-query: speech in, spoken answer out, with text fallback.
"""

from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.routers.auth import get_optional_user
from app.schemas.voice import VoiceQueryResponse
from app.services.voice_orchestrator import VoiceOrchestrator
from app.core.errors import BadRequestError, FileTooLargeError
from app.core.rate_limit import rate_limit_voice

router = APIRouter(tags=["Voice Assistant"])


@router.post(
    "/voice-query",
    response_model=VoiceQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Process multilingual voice or text query for Indian farmers",
    dependencies=[Depends(rate_limit_voice)],
    description=(
        "Accepts recorded audio (WAV, MP3, OGG, WebM up to 30s / 5MB) or direct text query. "
        "Understands intents for weather, mandi price, disease help, soil advisories, and expenses in Hindi or English."
    )
)
async def voice_query(
    audio: Optional[UploadFile] = File(None, description="Recorded voice audio file"),
    query_text: Optional[str] = Form(None, description="Direct text query (fallback or testing)"),
    language: str = Form("hi", description="Language hint: 'hi' (Hindi) or 'en' (English)"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    audio_bytes = None
    if audio is not None:
        audio_bytes = await audio.read()
        # Max 5MB size limit
        if len(audio_bytes) > 5 * 1024 * 1024:
            raise FileTooLargeError(max_size_mb=5)

    if not audio_bytes and not query_text:
        raise BadRequestError("Either an audio file or query_text must be provided.")

    orchestrator = VoiceOrchestrator(db)
    return await orchestrator.process_voice_query(
        user=current_user,
        audio_bytes=audio_bytes,
        query_text=query_text,
        language=language,
    )
