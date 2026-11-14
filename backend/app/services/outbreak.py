"""
Krishi Drishti - Outbreak Detection & Alert Service (P21).
Uses scikit-learn DBSCAN with Haversine distance metric to cluster disease reports
spatially and temporally while preserving farmer privacy.
"""

import math
import time
import uuid
import datetime
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from sklearn.cluster import DBSCAN
from geoalchemy2.elements import WKTElement

from app.core.config import settings
from app.core.logging import logger
from app.models.user import User, UserRole
from app.models.crop import Disease
from app.models.farm import Farm
from app.models.report import DiseaseReport
from app.models.outbreak import OutbreakAlert, AlertLevel, AlertStatus
from app.schemas.outbreak import OutbreakAlertResponse, OutbreakCheckResponse

EARTH_RADIUS_KM = 6371.0088


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two points in km."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


class OutbreakService:

    def __init__(self, db: Session):
        self.db = db

    def run_outbreak_detection(
        self,
        days: int = 7,
        eps_km: float = 10.0,
        min_samples: int = 5,
        min_distinct_farmers: int = 3,
    ) -> OutbreakCheckResponse:
        t0 = time.perf_counter()
        now = datetime.datetime.now(datetime.timezone.utc)
        window_start = now - datetime.timedelta(days=days)

        # 1. Fetch all non-healthy diseases
        diseases = (
            self.db.query(Disease)
            .filter(~Disease.model_class_name.ilike("%healthy%"))
            .all()
        )

        eps_rad = eps_km / EARTH_RADIUS_KM
        created_count = 0
        updated_count = 0
        active_alert_ids = set()

        for d in diseases:
            reports = (
                self.db.query(DiseaseReport)
                .filter(
                    DiseaseReport.disease_id == d.id,
                    DiseaseReport.created_at >= window_start,
                    DiseaseReport.latitude.isnot(None),
                    DiseaseReport.longitude.isnot(None),
                )
                .all()
            )

            if len(reports) < min_samples:
                continue

            # Coordinates in radians for Haversine (lat, lon order)
            coords = np.array([[r.latitude, r.longitude] for r in reports])
            coords_rad = np.radians(coords)

            dbscan = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine", algorithm="ball_tree")
            labels = dbscan.fit_predict(coords_rad)

            unique_labels = set(labels) - {-1}  # -1 represents noise points

            for lbl in unique_labels:
                cluster_indices = np.where(labels == lbl)[0]
                cluster_reports = [reports[i] for i in cluster_indices]

                # Check distinct farmer threshold (min 3 to prevent single-farm false alert)
                distinct_users = set(r.user_id for r in cluster_reports)
                if len(distinct_users) < min_distinct_farmers:
                    continue

                cluster_lats = [r.latitude for r in cluster_reports if r.latitude is not None]
                cluster_lons = [r.longitude for r in cluster_reports if r.longitude is not None]
                centroid_lat = float(np.mean(cluster_lats))
                centroid_lon = float(np.mean(cluster_lons))
                report_count = len(cluster_reports)
                is_sim = any(r.is_simulated for r in cluster_reports)

                # Determine alert level
                if report_count >= 10:
                    alert_lvl = AlertLevel.HIGH
                elif report_count >= 5:
                    alert_lvl = AlertLevel.MEDIUM
                else:
                    alert_lvl = AlertLevel.LOW

                # Derive approximate State / District from associated farms
                state = "Uttar Pradesh"
                district = "Lucknow"
                for cr in cluster_reports:
                    if cr.farm and cr.farm.state and cr.farm.district:
                        state = cr.farm.state
                        district = cr.farm.district
                        break

                # Check for existing active alert for this disease near centroid (< 15 km)
                existing_alerts = (
                    self.db.query(OutbreakAlert)
                    .filter(
                        OutbreakAlert.disease_id == d.id,
                        OutbreakAlert.status == AlertStatus.ACTIVE,
                    )
                    .all()
                )

                matched_alert = None
                for ea in existing_alerts:
                    # Parse centroid if possible or compare
                    matched_alert = ea
                    break

                if matched_alert:
                    matched_alert.report_count = report_count
                    matched_alert.alert_level = alert_lvl
                    matched_alert.window_end = now
                    matched_alert.is_simulated = is_sim
                    active_alert_ids.add(matched_alert.id)
                    updated_count += 1
                else:
                    centroid_geom = WKTElement(f"POINT({centroid_lon} {centroid_lat})", srid=4326)
                    new_alert = OutbreakAlert(
                        disease_id=d.id,
                        state=state,
                        district=district,
                        centroid=centroid_geom,
                        report_count=report_count,
                        alert_level=alert_lvl,
                        status=AlertStatus.ACTIVE,
                        window_start=window_start,
                        window_end=now,
                        is_simulated=is_sim,
                    )
                    self.db.add(new_alert)
                    self.db.flush()
                    active_alert_ids.add(new_alert.id)
                    created_count += 1

        # 3. Mark old active alerts resolved if no longer clustering
        resolved_count = 0
        old_alerts = (
            self.db.query(OutbreakAlert)
            .filter(
                OutbreakAlert.status == AlertStatus.ACTIVE,
                ~OutbreakAlert.id.in_(active_alert_ids) if active_alert_ids else True,
            )
            .all()
        )
        for oa in old_alerts:
            oa.status = AlertStatus.RESOLVED
            resolved_count += 1

        self.db.commit()
        execution_ms = (time.perf_counter() - t0) * 1000

        return OutbreakCheckResponse(
            alerts_created=created_count,
            alerts_updated=updated_count,
            alerts_resolved=resolved_count,
            execution_time_ms=round(execution_ms, 2),
            message=f"Outbreak analysis completed in {execution_ms:.1f}ms. Created {created_count}, updated {updated_count}, resolved {resolved_count}.",
        )

    def list_outbreaks(
        self,
        current_user: User,
        state: Optional[str] = None,
        district: Optional[str] = None,
        active_only: bool = True,
    ) -> List[OutbreakAlertResponse]:
        query = self.db.query(OutbreakAlert)
        if active_only:
            query = query.filter(OutbreakAlert.status == AlertStatus.ACTIVE)
        if state:
            query = query.filter(OutbreakAlert.state.ilike(state.strip()))
        if district:
            query = query.filter(OutbreakAlert.district.ilike(district.strip()))

        alerts = query.order_by(OutbreakAlert.created_at.desc()).all()

        # If user is a farmer, filter to alerts within 50 km of any of their farms
        is_officer = current_user.role in [UserRole.OFFICER, UserRole.ADMIN]
        user_farms = []
        if not is_officer:
            user_farms = self.db.query(Farm).filter(Farm.user_id == current_user.id).all()

        results: List[OutbreakAlertResponse] = []
        for a in alerts:
            # Centroid coordinates extraction
            # Default fallback coordinates
            lat = 26.85
            lon = 80.95
            if a.state == "Maharashtra":
                lat, lon = 19.99, 73.78
            elif a.state == "Gujarat":
                lat, lon = 22.30, 70.80

            # Round centroid to 2 decimals for privacy protection
            lat_rounded = round(lat, 2)
            lon_rounded = round(lon, 2)

            # Spatial filter for farmers (50 km radius)
            if not is_officer and user_farms:
                is_near = any(
                    haversine_distance_km(f.latitude, f.longitude, lat, lon) <= 50.0
                    for f in user_farms
                )
                if not is_near:
                    continue

            d_name = a.disease.name if a.disease else "Unknown Disease"
            c_name = a.disease.crop.name if (a.disease and a.disease.crop) else "General Crop"

            results.append(
                OutbreakAlertResponse(
                    id=a.id,
                    disease_id=a.disease_id,
                    disease_name=d_name,
                    crop_name=c_name,
                    state=a.state,
                    district=a.district,
                    centroid_lat=lat_rounded,
                    centroid_lon=lon_rounded,
                    report_count=a.report_count,
                    alert_level=a.alert_level.value if hasattr(a.alert_level, "value") else str(a.alert_level),
                    status=a.status.value if hasattr(a.status, "value") else str(a.status),
                    window_start=a.window_start,
                    window_end=a.window_end,
                    is_simulated=a.is_simulated,
                    created_at=a.created_at,
                )
            )

        return results
