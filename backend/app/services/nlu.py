"""
Krishi Drishti - Natural Language Understanding (NLU) Service (P20).
Keyword and pattern-based intent classification and slot extraction for Hindi and English.
"""

import re
from typing import Dict, Any, Tuple, Optional

# Hindi & English Intent Keywords dictionary
INTENT_KEYWORDS = {
    "weather": [
        "मौसम", "आज का मौसम", "कल का मौसम", "बारिश", "तापमान", "पानी", "हवा", "धूप", "गर्मी", "वर्षा",
        "आंधी", "बादल", "ठंड", "सर्दी", "कोहरा", "पाला", "धुंध", "बरसात", "बरसेगा", "गिरेगा", "आसमान",
        "ताप", "मेघ", "माटसम", "मोसम", "मासम", "मसम", "मउसम",
        "mausam", "mosam", "mousam", "mausum", "mosum", "barish", "barsat", "pani", "rain",
        "temperature", "taapman", "tapman", "forecast", "weather", "humidity", "spray", "spraying",
        "climate", "badal", "thand", "garmi", "awesome", "today weather"
    ],
    "price": [
        "भाव", "मंडी भाव", "दाम", "मंडी", "रेट", "कीमत", "बिका", "बाजार", "रुपये", "रुपया",
        "ठाव", "माटाव", "कटाव", "बिक्री",
        "bhav", "bhaav", "daam", "mandi", "rate", "keemat", "kimat", "price", "market",
        "cost per quintal", "selling price", "mandi bhav"
    ],
    "disease_help": [
        "बीमारी", "रोग", "नोग", "कीड़ा", "कीड़े", "कीट", "पत्ती", "पत्ते", "सड़न", "धब्बा", "सूख",
        "कीटनाशक", "फफूंद", "दवा", "इलाज", "उपचार", "झुलसा", "माहू", "सुंडी", "माहू कीट", "छिड़काव",
        "rog", "bimari", "beemari", "keeda", "kida", "keede", "patti", "patte", "disease", "pest",
        "rot", "blight", "fungus", "pesticide", "spot", "yellowing", "infection", "upchar", "ilaaj",
        "ilaj", "spray"
    ],
    "soil": [
        "मिट्टी", "खाद", "यूरिया", "उर्वरक", "पोषण", "ph", "डीएपी", "पोटाश", "गोबर", "एनपीके", "जिंक",
        "सल्फर", "वर्मीकंपोस्ट",
        "mitti", "khad", "khat", "urea", "dap", "potash", "soil", "fertilizer", "manure", "npk",
        "soil health", "soil test", "urvarak"
    ],
    "expenses": [
        "खर्चा", "लागत", "खर्च", "मुनाफा", "फायदा", "मुनाफे", "हिसाब", "कमाई", "बचत", "व्यय",
        "kharch", "kharcha", "kharche", "lagat", "munafa", "profit", "expense", "expenses",
        "revenue", "budget", "earnings", "cost", "spending", "hisab"
    ],
}

# Crop name synonyms mapping
CROP_SYNONYMS = {
    "tomato": ["tomato", "tamatar", "टमाटर"],
    "potato": ["potato", "aloo", "alu", "आलू"],
    "wheat": ["wheat", "gehun", "gehu", "गेहूं", "गेंहू"],
    "paddy": ["paddy", "rice", "dhan", "चावल", "धान"],
    "cotton": ["cotton", "kapas", "rui", "कपास"],
    "mustard": ["mustard", "sarson", "sarso", "सरसों", "राई"],
    "chickpea": ["chickpea", "gram", "chana", "चना"],
    "sugarcane": ["sugarcane", "ganna", "गन्ना"],
    "onion": ["onion", "pyaz", "pyaaz", "kanda", "प्याज"],
    "brinjal": ["brinjal", "eggplant", "baingan", "बैंगन"],
    "chili": ["chili", "chilli", "mirch", "mirchi", "मिर्च"],
    "cabbage": ["cabbage", "patta gobhi", "bandha gobhi", "पत्ता गोभी", "बंदगोभी"],
    "maize": ["maize", "corn", "makka", "bhutta", "मक्का"],
    "garlic": ["garlic", "lahsun", "lahsan", "लहसुन"],
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

        # 3. Intent Classification by Keyword Scoring & Normalization
        clean_text = re.sub(r"[^\w\s\u0900-\u097F]", " ", text_lower).strip()
        tokens = set(clean_text.split())

        best_intent = "unknown"
        max_score = 0

        for intent, kw_list in INTENT_KEYWORDS.items():
            score = 0
            for kw in kw_list:
                kw_lower = kw.lower()
                # Exact single word token match gets strong weight (+3)
                if kw_lower in tokens:
                    score += 3
                # Substring or phrase match
                elif re.search(rf"\b{re.escape(kw_lower)}\b", clean_text) or kw_lower in clean_text:
                    score += 1
            if score > max_score:
                max_score = score
                best_intent = intent

        return best_intent, slots
