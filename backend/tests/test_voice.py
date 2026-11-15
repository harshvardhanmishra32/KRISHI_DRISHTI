"""
Unit and Integration Tests for Multilingual NLU and Voice Assistant Pipeline (P20).
"""

from app.services.nlu import NluEngine
from app.main import app


def test_nlu_keyword_intent_classification():
    """Verify NLU accurately maps spoken/typed sentences to 5 intents and extracts slots."""
    test_cases = [
        ("Aaj mausam kaisa hai?", "weather", None),
        ("Kya kal barsat hogi?", "weather", None),
        ("Tamatar ka mandi bhav kya hai?", "price", "Tomato"),
        ("Lucknow me aloo ka rate batao", "price", "Potato"),
        ("Patti par kale daag dikh rahe hain", "disease_help", None),
        ("Tamatar ke paudhe me keeda lag gaya hai", "disease_help", "Tomato"),
        ("Mitti me DAP kitni dalni chahiye?", "soil", None),
        ("Khet me urea aur khad ka istemal", "soil", None),
        ("Mera kul kharcha kitna hua hai?", "expenses", None),
        ("Is mahine fasal me kitna munafa hoga?", "expenses", None),
        ("Hello what can you do?", "unknown", None),
    ]

    for query, expected_intent, expected_crop in test_cases:
        intent, slots = NluEngine.extract_intent_and_slots(query)
        assert intent == expected_intent, f"Failed for '{query}': got {intent}, expected {expected_intent}"
        if expected_crop:
            assert slots.get("crop") == expected_crop, f"Failed crop slot for '{query}': got {slots.get('crop')}"


def test_voice_query_text_fallback_endpoint(client):
    """POST /voice-query with query_text should parse intent and return structured response."""
    payload = {
        "query_text": "Tamatar ka bhav kya hai?",
        "language": "hi",
    }
    res = client.post("/voice-query", data=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "price"
    assert data["slots"]["crop"] == "Tomato"
    assert "answer_text" in data
    assert "₹" in data["answer_text"] or "भाव" in data["answer_text"]
    assert data["language"] == "hi"


def test_voice_query_unknown_intent_clarification(client):
    """Unknown queries should prompt a polite clarifying response in the chosen language."""
    payload = {
        "query_text": "Random unrelated query xyz 123",
        "language": "hi",
    }
    res = client.post("/voice-query", data=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "unknown"
    assert "मौसम" in data["answer_text"] or "मंडी भाव" in data["answer_text"]


def test_voice_query_generates_tts(client):
    """POST /voice-query should generate audio_url (MP3/WAV) for speech playback."""
    payload = {
        "query_text": "आज मौसम कैसा है?",
        "language": "hi",
    }
    res = client.post("/voice-query", data=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "weather"
    assert data["audio_url"] is not None
    assert data["audio_url"].startswith("/uploads/tts/")
