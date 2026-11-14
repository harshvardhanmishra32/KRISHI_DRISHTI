"""
Krishi Drishti - Speech to Text (STT) Module (P20).
Integrates faster-whisper with graceful fallback when audio decoding is unavailable.
"""

import os
from typing import Optional
from app.core.logging import logger

_whisper_model = None


def load_stt_model(model_size: str = "tiny"):
    """Loads faster-whisper STT model once on startup if package available."""
    global _whisper_model
    try:
        import importlib
        fw = importlib.import_module("faster_whisper")
        WhisperModel = getattr(fw, "WhisperModel")
        logger.info(f"Loading faster-whisper model ({model_size})...")
        _whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")
        logger.info("faster-whisper model initialized.")
    except Exception as e:
        logger.warning(f"faster-whisper not available: {e}. STT will operate in fallback mode.")
        _whisper_model = None


def transcribe_audio(audio_bytes: bytes, language_hint: Optional[str] = "hi") -> Optional[str]:
    """
    Transcribes audio bytes to text.
    If STT model is loaded and functional, runs inference.
    Returns None if transcription could not be performed.
    """
    global _whisper_model

    if _whisper_model is not None:
        import io
        import tempfile
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            segments, _ = _whisper_model.transcribe(tmp_path, language=language_hint)
            transcript = " ".join([seg.text for seg in segments]).strip()
            os.remove(tmp_path)
            return transcript if transcript else None
        except Exception as e:
            logger.warning(f"Whisper inference error: {e}")
            return None

    # Fallback: check if audio is empty
    if len(audio_bytes) == 0:
        return None

    # Graceful message when STT engine is not loaded
    return None
