"""
Krishi Drishti - Speech to Text (STT) Module (P20).
Integrates faster-whisper with graceful fallback when audio decoding is unavailable.
"""

import io
from typing import Optional
import numpy as np
from app.core.logging import logger

_whisper_model = None


def _decode_audio(audio_bytes: bytes) -> np.ndarray:
    """Decode browser-recorded audio to the 16 kHz mono samples Whisper expects."""
    import av

    resampler = av.audio.resampler.AudioResampler(
        format="s16", layout="mono", rate=16000
    )
    chunks = []
    with av.open(io.BytesIO(audio_bytes), mode="r") as container:
        for frame in container.decode(audio=0):
            for resampled in resampler.resample(frame):
                chunks.append(resampled.to_ndarray().reshape(-1))
        for resampled in resampler.resample(None):
            chunks.append(resampled.to_ndarray().reshape(-1))

    if not chunks:
        raise ValueError("Audio file contains no readable samples.")
    return np.concatenate(chunks).astype(np.float32) / 32768.0


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
    If STT model is loaded and functional, runs inference with agricultural Hindi prior context.
    Returns None if transcription could not be performed.
    """
    global _whisper_model

    if len(audio_bytes) == 0:
        return None

    if _whisper_model is None:
        try:
            load_stt_model(model_size="tiny")
        except Exception as e:
            logger.warning(f"Lazy STT model loading failed: {e}")

    if _whisper_model is not None:
        try:
            samples = _decode_audio(audio_bytes)
            initial_prompt = (
                "नमस्ते, आज का मौसम कैसा है? क्या आज बारिश होगी? टमाटर और गेहूं का मंडी भाव क्या है? फसल में रोग, कीड़े या पीली पत्तियों की दवा बताइए।"
                if language_hint == "hi" else
                "Hello, how is the weather today? Will it rain? What are the mandi prices for tomato and wheat? Please advise on crop diseases, pests, and fertilizer."
            )
            segments, _ = _whisper_model.transcribe(
                samples,
                language=language_hint or "hi",
                initial_prompt=initial_prompt,
                vad_filter=True,
                beam_size=5,
            )
            transcript = " ".join([seg.text for seg in segments]).strip()
            return transcript if transcript else None
        except Exception as e:
            logger.warning(f"Whisper inference error: {e}")
            return None

    return None
