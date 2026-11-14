"""
FastAPI Router for Outbreak Detection & Alerts (P21).
Provides GET /outbreaks (spatial privacy filtered) and POST /admin/run-outbreak-check.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.routers.auth import get_current_active_user
from app.core.errors import ForbiddenError
from app.schemas.outbreak import OutbreakAlertResponse, OutbreakCheckResponse
from app.services.outbreak import OutbreakService

router = APIRouter(tags=["Disease Outbreak Alerts"])


@router.get(
    "/outbreaks",
    response_model=List[OutbreakAlertResponse],
    summary="List disease outbreak alerts (Privacy-safe centroid, 50km farmer filter)",
    description=(
        "Returns active outbreak alerts clustered by DBSCAN. "
        "Agricultural officers see all alerts nationwide. "
        "Farmers only receive alerts within 50 km of their registered farms to avoid information overload. "
        "Coordinates are rounded to 2 decimals (~1.1 km resolution) to safeguard farmer privacy."
    )
)
def list_outbreaks(
    state: Optional[str] = Query(None, description="Optional state filter"),
    district: Optional[str] = Query(None, description="Optional district filter"),
    active_only: bool = Query(True, description="Filter for currently active outbreaks"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = OutbreakService(db)
    return service.list_outbreaks(
        current_user=current_user,
        state=state,
        district=district,
        active_only=active_only,
    )


@router.post(
    "/admin/run-outbreak-check",
    response_model=OutbreakCheckResponse,
    summary="Trigger DBSCAN epidemiology outbreak detection (Officer/Admin only)",
    description="Clusters recent disease reports with coordinates and minimum 3 distinct farmers. Creates or resolves alerts."
)
def run_outbreak_check(
    days: int = Query(7, ge=1, le=60, description="Temporal sliding window in days"),
    eps_km: float = Query(10.0, ge=1.0, le=100.0, description="Spatial cluster radius in kilometers"),
    min_samples: int = Query(5, ge=2, le=50, description="Minimum reports required to form cluster"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.OFFICER, UserRole.ADMIN]:
        raise ForbiddenError("Only agricultural officers or administrators can trigger outbreak detection.")

    service = OutbreakService(db)
    return service.run_outbreak_detection(
        days=days,
        eps_km=eps_km,
        min_samples=min_samples,
    )
