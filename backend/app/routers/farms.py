import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse, AdminFarmResponse
from app.services.farm_service import farm_service
from app.routers.auth import get_current_user, require_role

router = APIRouter(tags=["Farms"])


@router.post(
    "/farms",
    response_model=FarmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new farm"
)
def create_farm(
    farm_in: FarmCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Registers a new farm boundary under the authenticated farmer.
    Coordinates must be within India (Lat 6.0-38.0, Lon 68.0-98.0).
    """
    return farm_service.create_farm(db=db, user_id=current_user.id, farm_in=farm_in)


@router.get(
    "/farms",
    response_model=List[FarmResponse],
    summary="List all farms owned by current farmer"
)
def list_my_farms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all farms owned by the currently authenticated user.
    """
    return farm_service.list_user_farms(db=db, user_id=current_user.id)


@router.get(
    "/farms/{farm_id}",
    response_model=FarmResponse,
    summary="Get details of a specific farm"
)
def get_farm(
    farm_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves farm details. Returns 404 if the farm does not exist
    or is owned by another farmer (to prevent information leakage).
    """
    return farm_service.get_user_farm(db=db, farm_id=farm_id, user_id=current_user.id)


@router.put(
    "/farms/{farm_id}",
    response_model=FarmResponse,
    summary="Update farm details"
)
def update_farm(
    farm_id: uuid.UUID,
    farm_in: FarmUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates farm details and synchronizes PostGIS Geography point.
    Returns 404 if the farm is not found or owned by another user.
    """
    return farm_service.update_farm(db=db, farm_id=farm_id, user_id=current_user.id, farm_in=farm_in)


@router.delete(
    "/farms/{farm_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a farm"
)
def delete_farm(
    farm_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a farm. Historical disease reports are preserved
    by setting their `farm_id` to NULL.
    """
    farm_service.delete_farm(db=db, farm_id=farm_id, user_id=current_user.id)
    return None


# -----------------------------------------------------------------------------
# Officer & Admin Farm Monitoring Endpoint
# -----------------------------------------------------------------------------
@router.get(
    "/admin/farms",
    response_model=List[AdminFarmResponse],
    summary="List regional farms (Officers/Admins only)"
)
def list_admin_farms(
    state: Optional[str] = Query(None, description="Filter by Indian State"),
    district: Optional[str] = Query(None, description="Filter by District"),
    current_officer: User = Depends(require_role("officer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Allows Agriculture Officers and Admins to inspect farms across states and districts.
    Phone numbers are excluded from this endpoint for farmer privacy.
    """
    return farm_service.list_admin_farms(db=db, state=state, district=district)
