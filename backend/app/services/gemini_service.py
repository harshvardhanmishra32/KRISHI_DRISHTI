"""
Krishi Drishti - Gemini AI Agricultural Advisor Service
Uses Google Gemini Interactions API to answer general farmer queries with agricultural guardrails.
"""

import re
import httpx
from typing import Optional
from app.core.config import settings
from app.core.logging import logger


class GeminiAdvisorService:
    """Service wrapping Google Gemini Interactions API for real-time agricultural advisories."""

    INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"

    @classmethod
    def ask_advisor(
        cls,
        query: str,
        lang: str = "hi",
        farm_context: Optional[str] = None,
    ) -> Optional[str]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None

        model_name = settings.GEMINI_MODEL or "gemini-3.1-flash-lite"

        # Agricultural system instructions
        system_instruction = (
            "You are 'Krishi Drishti AI' (कृषि दृष्टि), an expert empathetic agricultural assistant for Indian farmers. "
            "The farmer may speak colloquial Hindi, Hinglish, or with slight phonetic speech-to-text variations (e.g. 'माटसम' or 'मौसम' for weather, 'कीड़ा' for pests). "
            "Answer the farmer's question directly, practically, and warmly in 35-45 words. "
            "STRICT RULES:\n"
            "1. Give realistic agronomic advice (weather, sowing, irrigation, organic/chemical pest control, fertilizer balance).\n"
            "2. Keep sentences clear, positive, and natural to speak aloud via Text-to-Speech.\n"
            "3. If language is 'hi', reply in clean, simple Hindi (Devanagari script).\n"
            "4. If language is 'en', reply in clear, friendly English.\n"
        )
        if farm_context:
            system_instruction += f"Farmer's Field Context: {farm_context}\n"

        full_prompt = f"{system_instruction}\n\nFarmer's Question: {query}\nAdvice:"

        payload = {
            "model": model_name,
            "input": full_prompt,
        }

        try:
            url = f"{cls.INTERACTIONS_URL}?key={api_key}"
            with httpx.Client(timeout=12.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    response_text = cls._extract_text_from_interaction(data)
                    if response_text:
                        # Clean asterisks / markdown formatting for clean TTS pronunciation
                        clean_text = cls._clean_for_speech(response_text)
                        return clean_text
                else:
                    logger.warning(
                        f"Gemini API returned status {res.status_code}: {res.text[:200]}"
                    )
        except Exception as e:
            logger.warning(f"Gemini advisor query failed: {e}")

        return None

    @classmethod
    def _extract_text_from_interaction(cls, data: dict) -> Optional[str]:
        steps = data.get("steps", [])
        for step in steps:
            if step.get("type") == "model_output":
                for c in step.get("content", []):
                    if c.get("type") == "text":
                        text = c.get("text", "").strip()
                        if text:
                            return text
        return None

    @classmethod
    def _clean_for_speech(cls, text: str) -> str:
        # Remove bold markdown and list bullets
        cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
        cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
        cleaned = re.sub(r"^\s*[-*•]\s+", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"\n+", " ", cleaned)
        return cleaned.strip()
