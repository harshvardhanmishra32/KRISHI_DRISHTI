"""
Krishi Drishti - Crop Advisor Service (P17).
Provides RuleBasedAdvisor and ML-based recommendations for Indian crops.
"""

import os
import uuid
import joblib
import datetime
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.crop import Crop
from app.models.soil import SoilRecord
from app.models.farm import Farm
from app.schemas.soil import CropRecommendationItem, CropRecommendationResponse

# Default Season Months configuration: Kharif Jun-Oct, Rabi Nov-Mar, Zaid Apr-May
SEASON_MONTHS = {
    "Kharif": [6, 7, 8, 9, 10],
    "Rabi": [11, 12, 1, 2, 3],
    "Zaid": [4, 5],
}


def get_current_season(date: Optional[datetime.date] = None) -> str:
    month = (date or datetime.date.today()).month
    for season, months in SEASON_MONTHS.items():
        if month in months:
            return season
    return "Kharif"


def get_fertilizer_guidance(crop_name: str, typical_npk: Optional[str]) -> str:
    npk_val = typical_npk or "120:60:40"
    return (
        f"Recommended N:P:K target: {npk_val} kg/ha. "
        "Apply 100% P, 100% K, and 50% N as basal dose at sowing/transplanting; "
        "top-dress remaining 50% N in two equal splits during active vegetative growth."
    )


class RuleBasedAdvisor:
    """
    Rule-based agronomic scoring engine for the 10 core Indian crops.
    Evaluates:
    - Soil pH suitability (30 points)
    - Soil texture compatibility (30 points)
    - Current agro-climatic season alignment (30 points)
    - Nutrient availability (10 points)
    """

    @staticmethod
    def evaluate(
        crops: List[Crop],
        ph: float,
        soil_type: str,
        n: float,
        p: float,
        k: float,
        season: str,
    ) -> List[Dict[str, Any]]:
        results = []
        soil_lower = soil_type.lower()

        for c in crops:
            score = 0.0
            reasons = []
            cautions = []

            # 1. Season Alignment (30 pts)
            crop_season = c.season.strip()
            if crop_season.lower() == season.lower() or crop_season.lower() in ["annual", "all season", "perennial"]:
                score += 30.0
                reasons.append(f"Well-suited for the current {season} cultivation cycle.")
            elif crop_season.lower() in ["kharif / rabi", "rabi / zaid"]:
                score += 20.0
                reasons.append(f"Tolerant to seasonal transition in {season}.")
            else:
                cautions.append(f"Typical optimal season is {crop_season}, while current season is {season}.")

            # 2. Soil pH Alignment (30 pts)
            ph_min = c.ideal_ph_min or 6.0
            ph_max = c.ideal_ph_max or 7.5
            if ph_min <= ph <= ph_max:
                score += 30.0
                reasons.append(f"Current soil pH {ph:.1f} is within optimal range ({ph_min:.1f} - {ph_max:.1f}).")
            elif (ph_min - 0.5) <= ph <= (ph_max + 0.5):
                score += 18.0
                reasons.append(f"Soil pH {ph:.1f} is moderately close to preferred range ({ph_min:.1f} - {ph_max:.1f}).")
            else:
                cautions.append(f"Soil pH {ph:.1f} is suboptimal (ideal: {ph_min:.1f} - {ph_max:.1f}). Lime or gypsum correction advised.")

            # 3. Soil Texture Alignment (30 pts)
            ideal_soil = c.ideal_soil_type.lower()
            if any(term in soil_lower for term in ideal_soil.split()) or any(term in ideal_soil for term in soil_lower.split()):
                score += 30.0
                reasons.append(f"{soil_type.title()} soil provides optimal drainage and structure for root development.")
            elif "loam" in soil_lower or "alluvial" in soil_lower:
                score += 20.0
                reasons.append(f"{soil_type.title()} is adequately fertile for sustainable cultivation.")
            else:
                score += 10.0
                cautions.append(f"Prefers {c.ideal_soil_type}; organic matter enrichment recommended.")

            # 4. Nutrient Profile (10 pts)
            if n > 50 and p > 20 and k > 50:
                score += 10.0
                reasons.append("Adequate primary macronutrients (N, P, K) detected.")
            else:
                score += 5.0
                cautions.append("Low macronutrients; basal fertilizer application required at sowing.")

            results.append({
                "crop": c,
                "score": round(min(100.0, score), 1),
                "source": "rule_engine",
                "reasons": reasons,
                "cautions": cautions,
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results


class MlAdvisor:
    """
    ML Random Forest / XGBoost Crop Advisor loaded from P11 artifacts.
    Provides probability distribution for covered crops.
    """

    def __init__(self):
        self.model = None
        self.encoder = None
        self._load_artifacts()

    def _load_artifacts(self):
        model_paths = [
            "backend/app/ml/crop_recommender.joblib",
            "app/ml/crop_recommender.joblib",
            "/Users/harshvardhanmishra/Desktop/Krishi Drishti/backend/app/ml/crop_recommender.joblib",
        ]
        enc_paths = [
            "backend/app/ml/crop_label_encoder.joblib",
            "app/ml/crop_label_encoder.joblib",
            "/Users/harshvardhanmishra/Desktop/Krishi Drishti/backend/app/ml/crop_label_encoder.joblib",
        ]

        for p in model_paths:
            if os.path.exists(p):
                try:
                    self.model = joblib.load(p)
                    break
                except Exception as e:
                    logger.warning(f"Could not load ML crop model from {p}: {e}")

        for p in enc_paths:
            if os.path.exists(p):
                try:
                    self.encoder = joblib.load(p)
                    break
                except Exception as e:
                    logger.warning(f"Could not load label encoder from {p}: {e}")

    def predict_probs(
        self, n: float, p: float, k: float, temp: float, humidity: float, ph: float, rainfall: float
    ) -> Dict[str, float]:
        if not self.model or not self.encoder:
            return {}

        features = np.array([[n, p, k, temp, humidity, ph, rainfall]])
        probs = self.model.predict_proba(features)[0]
        class_probs = {}
        for idx, cls_name in enumerate(self.encoder.classes_):
            # Normalize crop name: "rice" -> "paddy"
            normalized_name = "paddy" if cls_name.lower() == "rice" else cls_name.lower()
            class_probs[normalized_name] = float(probs[idx])
        return class_probs


class CropAdvisorService:

    def __init__(self, db: Session):
        self.db = db
        self.ml_advisor = MlAdvisor()

    def recommend_crops(self, farm_id: uuid.UUID) -> CropRecommendationResponse:
        farm = self.db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            from app.core.errors import NotFoundError
            raise NotFoundError(f"Farm with id '{farm_id}' not found.")

        # Latest soil record for this farm
        soil = (
            self.db.query(SoilRecord)
            .filter(SoilRecord.farm_id == farm_id)
            .order_by(SoilRecord.test_date.desc())
            .first()
        )

        current_season = get_current_season()
        crops = self.db.query(Crop).all()

        # Defaults if no soil record exists yet
        ph = soil.ph if soil else 6.5
        soil_type = soil.soil_type if soil else "Alluvial Soil"
        n = soil.nitrogen if soil else 80.0
        p = soil.phosphorus if soil else 35.0
        k = soil.potassium if soil else 120.0

        # 1. Run Rule-based engine
        rule_evals = RuleBasedAdvisor.evaluate(
            crops=crops,
            ph=ph,
            soil_type=soil_type,
            n=n,
            p=p,
            k=k,
            season=current_season,
        )

        # 2. Run ML Recommender if features are available
        # Default environmental conditions for seasonal baseline (temp 26C, humidity 65%, rainfall 150mm)
        ml_probs = self.ml_advisor.predict_probs(
            n=n, p=p, k=k, temp=26.0, humidity=65.0, ph=ph, rainfall=150.0
        )

        # 3. Combine scores
        combined_items: List[CropRecommendationItem] = []
        for item in rule_evals:
            crop_name_lower = item["crop"].name.lower()
            rule_score = item["score"]

            if crop_name_lower in ml_probs:
                ml_prob = ml_probs[crop_name_lower]
                # Hybrid score: 60% rule agronomy + 40% ML probability
                final_score = round(0.6 * rule_score + 0.4 * (ml_prob * 100.0), 1)
                source = "hybrid"
                reasons = list(item["reasons"])
                reasons.append(f"Machine learning model confidence: {ml_prob * 100:.1f}%.")
            else:
                final_score = rule_score
                source = "rule_engine"
                reasons = list(item["reasons"])

            crop_obj = item["crop"]
            typical_npk = crop_obj.typical_npk or "120:60:40"
            fert_guidance = get_fertilizer_guidance(crop_obj.name, typical_npk)

            combined_items.append(
                CropRecommendationItem(
                    crop_name=crop_obj.name,
                    score=min(100.0, max(0.0, final_score)),
                    source=source,
                    reasons=reasons,
                    cautions=item["cautions"],
                    typical_npk=typical_npk,
                    fertilizer_guidance=fert_guidance,
                )
            )

        # Top 3 recommendations
        combined_items.sort(key=lambda x: x.score, reverse=True)
        top3 = combined_items[:3]

        return CropRecommendationResponse(
            farm_id=farm.id,
            season=current_season,
            soil_record_id=soil.id if soil else None,
            recommendations=top3,
            note="Indicative only - confirm with a soil test (Soil Health Card or nearest lab)",
        )
