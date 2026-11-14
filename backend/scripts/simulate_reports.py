"""
Krishi Drishti - Outbreak Simulation Script (P21).
Generates synthetic disease reports clustered around given coordinates to demonstrate
DBSCAN outbreak detection, or cleans them up with --delete.
"""

import sys
import os
import argparse
import random
import datetime
from pathlib import Path

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.crop import Crop, Disease
from app.models.report import DiseaseReport, DetectionMode
from app.models.outbreak import OutbreakAlert, AlertStatus
from app.core.security import hash_password
from geoalchemy2.elements import WKTElement


def simulate_outbreak(
    center_lat: float = 26.85,
    center_lon: float = 80.95,
    num_reports: int = 40,
    crop_name: str = "Tomato",
    disease_keyword: str = "Early_blight",
):
    db = SessionLocal()
    try:
        print(f"Creating simulated outbreak around ({center_lat}, {center_lon})...")

        # 1. Ensure at least 5 synthetic test farmers exist
        sim_farmers = []
        for i in range(1, 6):
            phone = f"999990000{i}"
            user = db.query(User).filter(User.phone == phone).first()
            if not user:
                user = User(
                    name=f"Simulated Farmer {i}",
                    phone=phone,
                    password_hash=hash_password("SimPass123!"),
                    role=UserRole.FARMER,
                    preferred_language="hi",
                )
                db.add(user)
                db.flush()
            sim_farmers.append(user)

        # 2. Find target crop and disease
        crop = db.query(Crop).filter(Crop.name.ilike(crop_name)).first()
        if not crop:
            print(f"Error: Crop '{crop_name}' not found in database.")
            return

        disease = (
            db.query(Disease)
            .filter(Disease.crop_id == crop.id, Disease.model_class_name.ilike(f"%{disease_keyword}%"))
            .first()
        )
        if not disease:
            disease = db.query(Disease).filter(Disease.crop_id == crop.id).first()

        print(f"Assigning simulated reports to Crop: {crop.name}, Disease: {disease.name}...")

        # 3. Create 40 clustered reports within ~5 km radius (0.045 degrees approx)
        now = datetime.datetime.now(datetime.timezone.utc)
        for i in range(num_reports):
            # Normal distribution around center
            offset_lat = random.gauss(0, 0.02)
            offset_lon = random.gauss(0, 0.02)
            r_lat = center_lat + offset_lat
            r_lon = center_lon + offset_lon
            assigned_farmer = random.choice(sim_farmers)

            report = DiseaseReport(
                user_id=assigned_farmer.id,
                farm_id=None,
                crop_id=crop.id,
                disease_id=disease.id,
                image_path="uploads/simulated_leaf.jpg",
                confidence=round(random.uniform(0.85, 0.98), 4),
                detection_mode=DetectionMode.ONLINE,
                is_simulated=True,
                latitude=r_lat,
                longitude=r_lon,
                location=WKTElement(f"POINT({r_lon} {r_lat})", srid=4326),
                created_at=now - datetime.timedelta(hours=random.randint(1, 48)),
            )
            db.add(report)

        db.commit()
        print(f"Successfully generated {num_reports} simulated disease reports.")

    finally:
        db.close()


def clean_simulation():
    db = SessionLocal()
    try:
        print("Cleaning up simulated disease reports and resolving simulated alerts...")
        deleted_count = db.query(DiseaseReport).filter(DiseaseReport.is_simulated == True).delete()
        
        # Mark alerts as resolved
        resolved_count = (
            db.query(OutbreakAlert)
            .filter(OutbreakAlert.is_simulated == True)
            .update({"status": AlertStatus.RESOLVED})
        )
        db.commit()
        print(f"Deleted {deleted_count} simulated reports. Resolved {resolved_count} simulated outbreak alerts.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate or clean disease outbreak data for Krishi Drishti.")
    parser.add_argument("--delete", action="store_true", help="Delete all simulated reports and resolve alerts")
    parser.add_argument("--lat", type=float, default=26.85, help="Centroid latitude (default 26.85)")
    parser.add_argument("--lon", type=float, default=80.95, help="Centroid longitude (default 80.95)")
    parser.add_argument("--count", type=int, default=40, help="Number of reports (default 40)")

    args = parser.parse_args()
    if args.delete:
        clean_simulation()
    else:
        simulate_outbreak(center_lat=args.lat, center_lon=args.lon, num_reports=args.count)
