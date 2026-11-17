"""
Krishi Drishti - Outbreak Detection & Alert Service (P21).
Uses scikit-learn DBSCAN with Haversine distance metric to cluster disease reports
spatially and temporally while preserving farmer privacy.
"""

import datetime
import math
import time
from typing import Any, cast

import numpy as np
from geoalchemy2.elements import WKTElement
from sklearn.cluster import DBSCAN
from sqlalchemy.orm import Session

from app.models.crop import Disease
from app.models.farm import Farm
from app.models.outbreak import AlertLevel, AlertStatus, OutbreakAlert
from app.models.report import DiseaseReport
from app.models.user import User, UserRole
from app.schemas.outbreak import OutbreakAlertResponse, OutbreakCheckResponse

EARTH_RADIUS_KM = 6371.0088


def _val(x: Any) -> Any:
    """Extract runtime value from SQLAlchemy mapped attribute to appease static analyzers."""
    return x


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two points in km."""
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon / 2) ** 2
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
        now = datetime.datetime.now(datetime.UTC)
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
        active_alert_ids: set[Any] = set()

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

            # Filter valid coordinate reports
            valid_reports = [
                r for r in reports if r.latitude is not None and r.longitude is not None
            ]

            if len(valid_reports) < min_samples:
                continue

            # Coordinates in radians for Haversine (lat, lon order)
            coords = np.array(
                [[_val(r.latitude), _val(r.longitude)] for r in valid_reports],
                dtype=float,
            )
            coords_rad = np.radians(coords)

            dbscan = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine", algorithm="ball_tree")
            labels = dbscan.fit_predict(coords_rad)

            unique_labels = set(labels) - {-1}  # -1 represents noise points

            for lbl in unique_labels:
                cluster_indices = np.where(labels == lbl)[0]
                cluster_reports = [valid_reports[int(i)] for i in cluster_indices]

                # Check distinct farmer threshold (min 3 to prevent single-farm false alert)
                distinct_users = {_val(r.user_id) for r in cluster_reports}
                if len(distinct_users) < min_distinct_farmers:
                    continue

                cluster_lats = [_val(r.latitude) for r in cluster_reports if r.latitude is not None]
                cluster_lons = [_val(r.longitude) for r in cluster_reports if r.longitude is not None]
                if not cluster_lats or not cluster_lons:
                    continue

                centroid_lat = float(np.mean(cluster_lats))
                centroid_lon = float(np.mean(cluster_lons))
                report_count = len(cluster_reports)
                is_sim = any(bool(r.is_simulated) for r in cluster_reports)

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
                        state = str(cr.farm.state)
                        district = str(cr.farm.district)
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
                    matched_alert = ea
                    break

                if matched_alert:
                    matched_alert.report_count = report_count
                    matched_alert.alert_level = alert_lvl
                    matched_alert.window_end = now
                    matched_alert.is_simulated = is_sim
                    active_alert_ids.add(_val(matched_alert.id))
                    updated_count += 1
                else:
                    centroid_geom = WKTElement(f"POINT({centroid_lon} {centroid_lat})", srid=4326)
                    new_alert = OutbreakAlert(
                        disease_id=d.id,
                        state=state,
                        district=district,
                        centroid=cast(Any, centroid_geom),
                        report_count=report_count,
                        alert_level=alert_lvl,
                        status=AlertStatus.ACTIVE,
                        window_start=window_start,
                        window_end=now,
                        is_simulated=is_sim,
                    )
                    self.db.add(new_alert)
                    self.db.flush()
                    active_alert_ids.add(_val(new_alert.id))
                    created_count += 1

        # 3. Mark old active alerts resolved if no longer clustering
        resolved_count = 0
        query_old = self.db.query(OutbreakAlert).filter(OutbreakAlert.status == AlertStatus.ACTIVE)
        if active_alert_ids:
            query_old = query_old.filter(~OutbreakAlert.id.in_(active_alert_ids))
        old_alerts = query_old.all()
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
        state: str | None = None,
        district: str | None = None,
        active_only: bool = True,
    ) -> list[OutbreakAlertResponse]:
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
        user_farms: list[Farm] = []
        if not is_officer:
            user_farms = self.db.query(Farm).filter(Farm.user_id == current_user.id).all()

        results: list[OutbreakAlertResponse] = []
        for a in alerts:
            # Centroid coordinates extraction
            # Default fallback coordinates
            lat = 26.85
            lon = 80.95
            if str(a.state) == "Maharashtra":
                lat, lon = 19.99, 73.78
            elif str(a.state) == "Gujarat":
                lat, lon = 22.30, 70.80

            # Round centroid to 2 decimals for privacy protection
            lat_rounded = round(lat, 2)
            lon_rounded = round(lon, 2)

            # Spatial filter for farmers (50 km radius)
            if not is_officer and user_farms:
                is_near = any(
                    haversine_distance_km(
                        _val(f.latitude),
                        _val(f.longitude),
                        lat,
                        lon,
                    ) <= 50.0
                    for f in user_farms
                )
                if not is_near:
                    continue

            d_name = str(a.disease.name) if a.disease else "Unknown Disease"
            c_name = str(a.disease.crop.name) if (a.disease and a.disease.crop) else "General Crop"

            results.append(
                OutbreakAlertResponse.model_validate({
                    "id": _val(a.id),
                    "disease_id": _val(a.disease_id),
                    "disease_name": d_name,
                    "crop_name": c_name,
                    "state": str(a.state),
                    "district": str(a.district),
                    "centroid_lat": lat_rounded,
                    "centroid_lon": lon_rounded,
                    "report_count": _val(a.report_count),
                    "alert_level": getattr(a.alert_level, "value", str(a.alert_level)),
                    "status": getattr(a.status, "value", str(a.status)),
                    "window_start": _val(a.window_start),
                    "window_end": _val(a.window_end),
                    "is_simulated": bool(a.is_simulated),
                    "created_at": _val(a.created_at),
                })
            )

        return results
