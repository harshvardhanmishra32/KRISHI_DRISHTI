"""
Krishi Drishti - Natural Language Understanding (NLU) Service (P20).
Keyword and pattern-based intent classification and slot extraction for Hindi and English.
"""

import re
from typing import Dict, Any, Tuple, Optional

# Hindi & English Intent Keywords dictionary
INTENT_KEYWORDS = {
    "weather": [
        "मौसम", "बारिश", "तापमान", "पानी", "हवा", "धूप", "गर्मी", "वर्षा", "आंधी",
        "mausam", "barish", "barsat", "rain", "temperature", "forecast", "weather",
        "humidity", "spray", "spraying", "climate"
    ],
    "price": [
        "भाव", "दाम", "मंडी", "रेट", "कीमत", "बिका", "बाजार",
        "bhav", "daam", "mandi", "rate", "keemat", "price", "market",
        "cost per quintal", "selling price"
    ],
    "disease_help": [
        "बीमारी", "रोग", "कीड़ा", "पत्ती", "सड़न", "धब्बा", "सूख", "कीटनाशक", "फफूंद",
        "rog", "bimari", "keeda", "patti", "disease", "pest", "rot", "blight",
        "fungus", "pesticide", "spot", "yellowing", "infection"
    ],
    "soil": [
        "मिट्टी", "खाद", "यूरिया", "उर्वरक", "पोषण", "ph", "डीएपी",
        "mitti", "khat", "urea", "dap", "soil", "fertilizer", "manure", "npk",
        "soil health", "soil test"
    ],
    "expenses": [
        "खर्चा", "लागत", "खर्च", "मुनाफा", "फायदा", "मुनाफे", "हिसाब", "कमाई",
        "kharch", "kharcha", "lagat", "munafa", "profit", "expense", "revenue",
        "budget", "earnings", "cost", "spending"
    ],
}

# Crop name synonyms mapping
CROP_SYNONYMS = {
    "tomato": ["tomato", "tamatar", "टमाटर"],
    "potato": ["potato", "aloo", "alu", "आलू"],
    "wheat": ["wheat", "gehun", "gehu", "गेहूं", "गेंहू"],
    "paddy": ["paddy", "rice", "dhan", "चावल", "धान"],
    "cotton": ["cotton", "kapas", "rui", "कपास"],
    "chickpea": ["chickpea", "gram", "chana", "चना"],
    "sugarcane": ["sugarcane", "ganna", "गन्ना"],
    "onion": ["onion", "pyaz", "pyaaz", "kanda", "प्याज"],
    "brinjal": ["brinjal", "eggplant", "baingan", "बैंगन"],
    "cabbage": ["cabbage", "patta gobhi", "bandha gobhi", "पत्ता गोभी", "बंदगोभी"],
}

# Place synonyms
KNOWN_PLACES = [
    "lucknow", "लखनऊ",
    "delhi", "दिल्ली",
    "varanasi", "वाराणसी", "बनारस",
    "nashik", "नासिक",
    "pune", "पुणे",
    "indore", "इंदौर",
    "patna", "पटना",
    "kolar", "कोलार",
    "ludhiana", "लुधियाना",
    "karnal", "करनाल",
    "rajkot", "राजकोट",
    "meerut", "मेरठ",
    "nagpur", "नागपुर",
]


class NluEngine:

    @staticmethod
    def extract_intent_and_slots(text: str, default_lang: str = "hi") -> Tuple[str, Dict[str, Any]]:
        text_lower = text.lower().strip()

        # 1. Slot Extraction: Crop
        detected_crop = None
        for canonical, syns in CROP_SYNONYMS.items():
            for s in syns:
                if s.lower() in text_lower:
                    detected_crop = canonical.capitalize()
                    break
            if detected_crop:
                break

        # 2. Slot Extraction: Place
        detected_place = None
        for place in KNOWN_PLACES:
            if place.lower() in text_lower:
                detected_place = place.title()
                break

        slots = {
            "crop": detected_crop,
            "place": detected_place,
        }

        # 3. Intent Classification by Keyword Scoring
        best_intent = "unknown"
        max_score = 0

        for intent, kw_list in INTENT_KEYWORDS.items():
            score = 0
            for kw in kw_list:
                # Count occurrences or exact word matches
                if re.search(rf"\b{re.escape(kw.lower())}\b", text_lower) or kw.lower() in text_lower:
                    score += 1
            if score > max_score:
                max_score = score
                best_intent = intent

        return best_intent, slots
