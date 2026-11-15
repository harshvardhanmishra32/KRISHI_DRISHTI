"""
Krishi Drishti - Voice Orchestrator Service (P20).
Coordinates STT, NLU intent dispatch, domain service queries, explainer, and TTS generation.
"""

import os
import uuid
import datetime
from pathlib import Path
from typing import Optional, Dict, Any, cast
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.user import User
from app.models.voice import VoiceQuery
from app.models.farm import Farm
from app.models.crop import Crop, Disease
from app.schemas.voice import VoiceQueryResponse
from app.services.nlu import NluEngine
from app.ml.stt import transcribe_audio
from app.services.weather_service import WeatherService
from app.services.price_service import PriceService
from app.services.crop_advisor import CropAdvisorService
from app.services.expense_service import ExpenseService
from app.services.explainer import get_explainer


class VoiceOrchestrator:

    def __init__(self, db: Session):
        self.db = db
        self.explainer = get_explainer()
        self.tts_dir = Path(settings.UPLOAD_DIR) / "tts"
        self.tts_dir.mkdir(parents=True, exist_ok=True)

    async def process_voice_query(
        self,
        user: Optional[User],
        audio_bytes: Optional[bytes] = None,
        query_text: Optional[str] = None,
        language: str = "hi",
    ) -> VoiceQueryResponse:
        # 1. Obtain transcript: from direct text or STT
        transcript = query_text.strip() if query_text else ""
        if not transcript and audio_bytes:
            stt_result = transcribe_audio(audio_bytes, language_hint=language)
            if stt_result:
                transcript = stt_result
            else:
                fallback_msg = (
                    "कृपया अपना प्रश्न टाइप करके पूछें।"
                    if language == "hi" else
                    "Please type your question (audio transcription unavailable)."
                )
                return VoiceQueryResponse(
                    id=uuid.uuid4(),
                    transcript="[Audio recorded]",
                    intent="unknown",
                    slots={},
                    answer_text=fallback_msg,
                    audio_url=None,
                    language=language,
                )

        if not transcript:
            prompt_msg = (
                "कृषि दृष्टि में आपका स्वागत है। आप मौसम, मंडी भाव, फसल रोग या खाद के बारे में पूछ सकते हैं।"
                if language == "hi" else
                "Welcome to Krishi Drishti. You can ask about weather, mandi prices, crop disease, or expenses."
            )
            return VoiceQueryResponse(
                id=uuid.uuid4(),
                transcript="",
                intent="unknown",
                slots={},
                answer_text=prompt_msg,
                audio_url=None,
                language=language,
            )

        # 2. NLU: extract intent & slots
        intent, slots = NluEngine.extract_intent_and_slots(transcript, default_lang=language)

        # 3. Domain Dispatch
        answer_text = await self._dispatch_intent(intent, slots, user, language)

        # 4. Generate TTS audio (optional, graceful fallback to text only)
        audio_url = self._generate_tts(answer_text, language)

        # 5. Persist to voice_queries table
        query_row = VoiceQuery(
            user_id=user.id if user else None,
            query_text=transcript,
            language=language,
            response_text=answer_text,
        )
        self.db.add(query_row)
        try:
            self.db.commit()
            self.db.refresh(query_row)
            rec_id = uuid.UUID(str(query_row.id))
        except Exception as e:
            self.db.rollback()
            logger.warning(f"Could not persist voice query record: {e}")
            rec_id = uuid.uuid4()

        return VoiceQueryResponse(
            id=rec_id,
            transcript=transcript,
            intent=intent,
            slots=slots,
            answer_text=answer_text,
            audio_url=audio_url,
            language=language,
        )

    async def _dispatch_intent(
        self, intent: str, slots: Dict[str, Any], user: Optional[User], lang: str
    ) -> str:
        # A. WEATHER INTENT
        if intent == "weather":
            lat, lon = 26.8467, 80.9462  # Default to Lucknow/UP
            if user:
                first_farm = self.db.query(Farm).filter(Farm.user_id == user.id).first()
                if first_farm and first_farm.latitude is not None and first_farm.longitude is not None:
                    lat = cast(float, first_farm.latitude)
                    lon = cast(float, first_farm.longitude)

            try:
                weather_service = WeatherService(self.db)
                w = await weather_service.get_weather(lat, lon)
                if lang == "hi":
                    return (
                        f"आज का तापमान {w.current.temperature:.1f}°C और नमी {w.current.humidity:.0f}% है। "
                        f"मौसम: {w.current.description}। रोग का जोखिम: {w.disease_risk.level}। "
                        f"छिड़काव सलाह: {w.spray_advice.summary}"
                    )
                return (
                    f"Today's temperature is {w.current.temperature:.1f}°C with {w.current.humidity:.0f}% humidity. "
                    f"Condition: {w.current.description}. Disease risk: {w.disease_risk.level}. "
                    f"Spray advice: {w.spray_advice.summary}"
                )
            except Exception as e:
                logger.warning(f"Weather query failed in voice assistant: {e}")
                return "मौसम की जानकारी प्राप्त करने में असमर्थ। कृपया बाद में प्रयास करें।" if lang == "hi" else "Weather service currently unavailable."

        # B. PRICE INTENT
        elif intent == "price":
            crop_name = slots.get("crop") or "Tomato"
            place = slots.get("place") or "Lucknow"
            try:
                price_service = PriceService(self.db)
                p = price_service.get_market_price(crop_name=crop_name, district=place)
                if lang == "hi":
                    return (
                        f"{p.mandi} में {p.crop} का औसत भाव ₹{p.modal_price} प्रति क्विंटल है "
                        f"(न्यूनतम ₹{p.min_price}, अधिकतम ₹{p.max_price})।"
                    )
                return (
                    f"In {p.mandi}, the average price for {p.crop} is ₹{p.modal_price} per quintal "
                    f"(min ₹{p.min_price}, max ₹{p.max_price})."
                )
            except Exception as e:
                logger.warning(f"Price query failed in voice assistant: {e}")
                return f"मंडी भाव प्राप्त नहीं हो सका।" if lang == "hi" else "Could not fetch market price."

        # C. DISEASE HELP INTENT
        elif intent == "disease_help":
            crop_name = slots.get("crop")
            if crop_name:
                crop = self.db.query(Crop).filter(Crop.name.ilike(crop_name)).first()
                if crop:
                    disease = self.db.query(Disease).filter(Disease.crop_id == crop.id).first()
                    if disease:
                        if lang == "hi":
                            return f"{crop.name} की मुख्य बीमारी: {disease.name}। लक्षण: {disease.symptoms}। कृपया पत्ती की फोटो स्कैन करें।"
                        return f"Common {crop.name} disease: {disease.name}. Symptoms: {disease.symptoms}. Please scan a leaf photo for exact diagnosis."

            if lang == "hi":
                return "फसल बीमारी की सटीक पहचान के लिए कृपया पत्ती की साफ फोटो 'Detect Disease' में अपलोड करें।"
            return "For accurate disease diagnosis, please upload a clear leaf photo via Detect Disease."

        # D. SOIL INTENT
        elif intent == "soil":
            if user:
                first_farm = self.db.query(Farm).filter(Farm.user_id == user.id).first()
                if first_farm:
                    try:
                        advisor = CropAdvisorService(self.db)
                        recs = advisor.recommend_crops(first_farm.id)
                        top_crops = ", ".join([r.crop_name for r in recs.recommendations])
                        if lang == "hi":
                            return f"आपके खेत ({first_farm.farm_name}) की मिट्टी के अनुसार उत्तम फसलें: {top_crops} हैं।"
                        return f"Recommended crops for your farm ({first_farm.farm_name}): {top_crops}."
                    except Exception as e:
                        logger.warning(f"Soil recommendation query failed: {e}")

            if lang == "hi":
                return "मिट्टी की जांच के आधार पर फसल चयन करें। उचित उर्वरक और एनपीके संतुलन बनाए रखें।"
            return "Choose crops based on soil test reports. Maintain proper NPK balance."

        # E. EXPENSES INTENT
        elif intent == "expenses":
            if user:
                try:
                    exp_service = ExpenseService(self.db)
                    summary = exp_service.get_summary(user)
                    if lang == "hi":
                        return f"आपका कुल दर्ज कृषि खर्च ₹{summary.total_expenses} है।"
                    return f"Your total recorded farm expense is ₹{summary.total_expenses}."
                except Exception as e:
                    logger.warning(f"Expense summary query failed: {e}")

            if lang == "hi":
                return "आप अपने बीज, खाद और मजदूरी के खर्चे 'Expenses' सेक्शन में जोड़ सकते हैं।"
            return "You can log your seed, fertilizer, and labour costs in the Expenses section."

        # F. UNKNOWN / CLARIFYING QUESTION
        else:
            if lang == "hi":
                return "माफ़ कीजिए, मुझे आपकी बात पूरी समझ नहीं आई। क्या आप मौसम, मंडी भाव, फसल रोग या खर्चे के बारे में जानना चाहते हैं?"
            return "I could not fully understand your request. Would you like to check the weather, market prices, crop disease, or expenses?"

    def _generate_tts(self, text: str, lang: str) -> Optional[str]:
        # 1. Primary TTS: Google TTS (gTTS) - produces natural mp3
        try:
            import importlib
            gtts_mod = importlib.import_module("gtts")
            gTTS = getattr(gtts_mod, "gTTS")
            tts_filename = f"{uuid.uuid4().hex}.mp3"
            tts_path = self.tts_dir / tts_filename
            tts = gTTS(text=text, lang="hi" if lang == "hi" else "en", slow=False)
            tts.save(str(tts_path))
            return f"/uploads/tts/{tts_filename}"
        except Exception as e:
            logger.warning(f"gTTS online generation failed: {e}. Attempting local offline fallback...")

        # 2. Secondary TTS: macOS native offline 'say' & 'afconvert'
        try:
            import shutil
            import subprocess
            if shutil.which("say") and shutil.which("afconvert"):
                tts_filename = f"{uuid.uuid4().hex}.wav"
                tts_path = self.tts_dir / tts_filename
                temp_aiff = self.tts_dir / f"temp_{uuid.uuid4().hex}.aiff"
                
                # Check for Lekha (macOS Hindi voice) if lang is Hindi
                voice_cmd = ["say"]
                if lang == "hi":
                    voice_cmd.extend(["-v", "Lekha"])
                voice_cmd.extend(["-o", str(temp_aiff), text])
                
                subprocess.run(voice_cmd, check=True, timeout=10)
                subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", str(temp_aiff), str(tts_path)], check=True, timeout=10)
                if temp_aiff.exists():
                    temp_aiff.unlink()
                return f"/uploads/tts/{tts_filename}"
        except Exception as e:
            logger.warning(f"Local offline TTS fallback failed: {e}")

        # 3. Graceful degradation: return None so browser can attempt client-side synthesis
        return None
