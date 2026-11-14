"""Idempotent seed script for Krishi Drishti.

Loads crops, diseases, and treatments from JSON files in backend/seed_data/.
Upserts by unique name so running repeatedly creates no duplicates.
"""
import sys
import os
import json
import logging
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import Crop, Disease, Treatment

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed")

SEED_DIR = Path(__file__).parent.parent / "seed_data"
MANDATORY_SAFETY_NOTE = "Follow the product label and confirm the dose with your local agriculture officer or Krishi Vigyan Kendra before spraying."


def validate_crops_json(crops_data: list[dict]):
    required = ["name", "category", "season", "ideal_soil_type"]
    for idx, item in enumerate(crops_data):
        for field in required:
            if field not in item or not str(item[field]).strip():
                raise ValueError(f"Crop JSON validation failed: Item #{idx} is missing required field '{field}'")


def validate_diseases_json(diseases_data: list[dict]):
    required = ["crop_name", "name", "symptoms", "severity_level", "model_class_name"]
    for idx, item in enumerate(diseases_data):
        for field in required:
            if field not in item or not str(item[field]).strip():
                raise ValueError(f"Disease JSON validation failed: Item #{idx} is missing required field '{field}'")


def validate_treatments_json(treatments_data: list[dict]):
    required = ["disease_name"]
    for idx, item in enumerate(treatments_data):
        for field in required:
            if field not in item or not str(item[field]).strip():
                raise ValueError(f"Treatment JSON validation failed: Item #{idx} is missing required field '{field}'")


def seed_database():
    crops_file = SEED_DIR / "crops.json"
    diseases_file = SEED_DIR / "diseases.json"
    treatments_file = SEED_DIR / "treatments.json"

    if not crops_file.exists() or not diseases_file.exists() or not treatments_file.exists():
        raise FileNotFoundError(f"Missing required seed JSON files in {SEED_DIR}")

    with open(crops_file, "r", encoding="utf-8") as f:
        crops_data = json.load(f)
    with open(diseases_file, "r", encoding="utf-8") as f:
        diseases_data = json.load(f)
    with open(treatments_file, "r", encoding="utf-8") as f:
        treatments_data = json.load(f)

    # Validate inputs before touching database
    validate_crops_json(crops_data)
    validate_diseases_json(diseases_data)
    validate_treatments_json(treatments_data)
    logger.info("JSON validation passed for crops, diseases, and treatments.")

    db: Session = SessionLocal()
    crops_added = 0
    crops_updated = 0
    diseases_added = 0
    diseases_updated = 0
    treatments_added = 0
    treatments_updated = 0

    try:
        # 1. Upsert Crops
        crop_name_to_obj = {}
        for c in crops_data:
            existing_crop = db.query(Crop).filter(Crop.name == c["name"]).first()
            if existing_crop:
                existing_crop.scientific_name = c.get("scientific_name")
                existing_crop.category = c["category"]
                existing_crop.season = c["season"]
                existing_crop.ideal_soil_type = c["ideal_soil_type"]
                existing_crop.water_requirement_mm = c.get("water_requirement_mm")
                existing_crop.ideal_ph_min = c.get("ideal_ph_min")
                existing_crop.ideal_ph_max = c.get("ideal_ph_max")
                existing_crop.typical_npk = c.get("typical_npk")
                crops_updated += 1
                crop_name_to_obj[c["name"]] = existing_crop
            else:
                new_crop = Crop(
                    name=c["name"],
                    scientific_name=c.get("scientific_name"),
                    category=c["category"],
                    season=c["season"],
                    ideal_soil_type=c["ideal_soil_type"],
                    water_requirement_mm=c.get("water_requirement_mm"),
                    ideal_ph_min=c.get("ideal_ph_min"),
                    ideal_ph_max=c.get("ideal_ph_max"),
                    typical_npk=c.get("typical_npk")
                )
                db.add(new_crop)
                crops_added += 1
                crop_name_to_obj[c["name"]] = new_crop

        db.flush()

        # 2. Upsert Diseases
        disease_name_to_obj = {}
        for d in diseases_data:
            crop_obj = crop_name_to_obj.get(d["crop_name"]) or db.query(Crop).filter(Crop.name == d["crop_name"]).first()
            if not crop_obj:
                raise ValueError(f"Disease references unknown crop '{d['crop_name']}'")

            existing_disease = db.query(Disease).filter(
                Disease.crop_id == crop_obj.id,
                Disease.name == d["name"]
            ).first()

            if existing_disease:
                existing_disease.causal_organism = d.get("causal_organism")
                existing_disease.symptoms = d["symptoms"]
                existing_disease.severity_level = d["severity_level"]
                existing_disease.model_class_name = d["model_class_name"]
                diseases_updated += 1
                disease_name_to_obj[d["name"]] = existing_disease
            else:
                new_disease = Disease(
                    crop_id=crop_obj.id,
                    name=d["name"],
                    causal_organism=d.get("causal_organism"),
                    symptoms=d["symptoms"],
                    severity_level=d["severity_level"],
                    model_class_name=d["model_class_name"]
                )
                db.add(new_disease)
                diseases_added += 1
                disease_name_to_obj[d["name"]] = new_disease

        db.flush()

        # Ensure every crop has a Healthy disease row
        for crop_name, crop_obj in crop_name_to_obj.items():
            healthy_model_class = f"{crop_name.lower()}_healthy"
            healthy_check = db.query(Disease).filter(
                (Disease.crop_id == crop_obj.id) & (
                    (Disease.name == "Healthy") | (Disease.model_class_name == healthy_model_class)
                )
            ).first()
            if not healthy_check:
                healthy_disease = Disease(
                    crop_id=crop_obj.id,
                    name="Healthy",
                    causal_organism="None",
                    symptoms="Healthy foliage and stem without visual disease symptoms.",
                    severity_level="none",
                    model_class_name=healthy_model_class
                )
                db.add(healthy_disease)
                diseases_added += 1
                disease_name_to_obj[f"{crop_name}_Healthy"] = healthy_disease

        db.flush()

        # 3. Upsert Treatments
        for t in treatments_data:
            disease_obj = disease_name_to_obj.get(t["disease_name"]) or db.query(Disease).filter(Disease.name == t["disease_name"]).first()
            if not disease_obj:
                logger.warning(f"Skipping treatment for unknown disease: '{t['disease_name']}'")
                continue

            existing_treatment = db.query(Treatment).filter(Treatment.disease_id == disease_obj.id).first()
            safety_note = t.get("safety_note") or MANDATORY_SAFETY_NOTE

            if existing_treatment:
                existing_treatment.fertilizer_recommendation = t.get("fertilizer_recommendation")
                existing_treatment.pesticide_recommendation = t.get("pesticide_recommendation")
                existing_treatment.organic_option = t.get("organic_option")
                existing_treatment.dosage = t.get("dosage")
                existing_treatment.application_method = t.get("application_method")
                existing_treatment.safety_note = safety_note
                treatments_updated += 1
            else:
                new_treatment = Treatment(
                    disease_id=disease_obj.id,
                    fertilizer_recommendation=t.get("fertilizer_recommendation"),
                    pesticide_recommendation=t.get("pesticide_recommendation"),
                    organic_option=t.get("organic_option"),
                    dosage=t.get("dosage"),
                    application_method=t.get("application_method"),
                    safety_note=safety_note
                )
                db.add(new_treatment)
                treatments_added += 1

        db.commit()

        print("\n🌱 Seed Data Execution Summary:")
        print(f"   Crops:      {crops_added} added, {crops_updated} updated.")
        print(f"   Diseases:   {diseases_added} added, {diseases_updated} updated.")
        print(f"   Treatments: {treatments_added} added, {treatments_updated} updated.")
        print("✅ Seeding completed successfully and idempotently.\n")

    except Exception as exc:
        db.rollback()
        logger.error(f"Error seeding database: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
