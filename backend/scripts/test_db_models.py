"""Verification script to test SQLAlchemy 2.0 models and relationships.

Inserts 1 User, 1 Farm, 1 Crop, 1 Disease, and 1 DiseaseReport,
then reads them back through relationships.
"""
import sys
import os
import uuid
import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from geoalchemy2.elements import WKTElement
from app.db.session import SessionLocal, engine
from app.models import (
    User, UserRole,
    Farm,
    Crop, Disease, Treatment,
    DiseaseReport, DetectionMode
)


def run_verification():
    db = SessionLocal()
    print("Testing database connection and relationship graph...")
    try:
        # 1. Create a User
        unique_phone = f"987{uuid.uuid4().hex[:7]}"
        test_user = User(
            name="Ramesh Kumar",
            phone=unique_phone,
            email="ramesh.farmer@example.com",
            password_hash="$2b$12$e6QZ...fake_hash",
            preferred_language="hi",
            role=UserRole.FARMER
        )
        db.add(test_user)
        db.flush()
        print(f"✅ Created User: {test_user.name} (ID: {test_user.id})")

        # 2. Create a Farm with PostGIS Geography Point
        lat, lon = 26.8467, 80.9462  # Lucknow, Uttar Pradesh (India)
        test_farm = Farm(
            user_id=test_user.id,
            farm_name="Kisan Kalyan Farm",
            latitude=lat,
            longitude=lon,
            location=WKTElement(f"POINT({lon} {lat})", srid=4326),
            area_acres=3.5,
            state="Uttar Pradesh",
            district="Lucknow"
        )
        db.add(test_farm)
        db.flush()
        print(f"✅ Created Farm: {test_farm.farm_name} (ID: {test_farm.id})")

        # 3. Create a Crop and Disease
        crop_name = f"Tomato_{uuid.uuid4().hex[:5]}"
        test_crop = Crop(
            name=crop_name,
            scientific_name="Solanum lycopersicum",
            category="vegetable",
            season="rabi",
            ideal_soil_type="Loamy Soil",
            water_requirement_mm=500.0,
            ideal_ph_min=6.0,
            ideal_ph_max=7.0,
            typical_npk="120:60:60"
        )
        db.add(test_crop)
        db.flush()

        model_class = f"tomato_early_blight_{uuid.uuid4().hex[:5]}"
        test_disease = Disease(
            crop_id=test_crop.id,
            name="Tomato Early Blight",
            causal_organism="Alternaria solani",
            symptoms="Target-like brown concentric rings on lower leaves.",
            severity_level="medium",
            model_class_name=model_class
        )
        db.add(test_disease)
        db.flush()

        test_treatment = Treatment(
            disease_id=test_disease.id,
            fertilizer_recommendation="Avoid excess nitrogen; balance with potassium.",
            pesticide_recommendation="Spray Copper Oxychloride 50 WP @ 3g/L.",
            organic_option="Spray Trichoderma viride or neem oil 1500 ppm.",
            dosage="3g per liter of water",
            application_method="Foliar spray in early morning",
            safety_note="Follow the product label and confirm the dose with your local agriculture officer or Krishi Vigyan Kendra before spraying."
        )
        db.add(test_treatment)
        db.flush()
        print(f"✅ Created Crop: {test_crop.name} and Disease: {test_disease.name}")

        # 4. Create a DiseaseReport
        test_report = DiseaseReport(
            user_id=test_user.id,
            farm_id=test_farm.id,
            crop_id=test_crop.id,
            disease_id=test_disease.id,
            image_path="uploads/2026/11/sample_leaf.jpg",
            confidence=0.945,
            detection_mode=DetectionMode.ONLINE,
            latitude=lat,
            longitude=lon,
            location=WKTElement(f"POINT({lon} {lat})", srid=4326)
        )
        db.add(test_report)
        db.commit()
        print(f"✅ Created DiseaseReport (ID: {test_report.id})")

        # 5. Verify reading through relationships
        db.refresh(test_user)
        assert len(test_user.farms) == 1
        assert test_user.farms[0].farm_name == "Kisan Kalyan Farm"

        retrieved_farm = test_user.farms[0]
        assert len(retrieved_farm.disease_reports) == 1
        report = retrieved_farm.disease_reports[0]
        assert report.crop.name == crop_name
        assert report.disease.name == "Tomato Early Blight"
        assert len(report.disease.treatments) == 1

        print("\n🎉 Relationship verification SUCCESS:")
        print(f"   User '{test_user.name}' owns farm '{retrieved_farm.farm_name}'")
        print(f"   Farm has report for crop '{report.crop.name}' infected with '{report.disease.name}'")
        print(f"   Treatment safety note verified: '{report.disease.treatments[0].safety_note}'")

    except Exception as exc:
        db.rollback()
        print(f"❌ Error during verification: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    run_verification()
