import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement

from app.models.farm import Farm
from app.models.user import User
from app.schemas.farm import FarmCreate, FarmUpdate, AdminFarmResponse
from app.core.errors import NotFoundError


class FarmService:

    @staticmethod
    def create_farm(db: Session, user_id: uuid.UUID, farm_in: FarmCreate) -> Farm:
        # Create PostGIS Geography Point with SRID 4326 (Lon Lat order for WKT)
        point_geom = WKTElement(f"POINT({farm_in.longitude} {farm_in.latitude})", srid=4326)

        farm = Farm(
            user_id=user_id,
            farm_name=farm_in.farm_name,
            latitude=farm_in.latitude,
            longitude=farm_in.longitude,
            location=point_geom,
            area_acres=farm_in.area_acres,
            state=farm_in.state,
            district=farm_in.district
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)
        return farm

    @staticmethod
    def list_user_farms(db: Session, user_id: uuid.UUID) -> List[Farm]:
        return db.query(Farm).filter(Farm.user_id == user_id).order_by(Farm.created_at.desc()).all()

    @staticmethod
    def get_user_farm(db: Session, farm_id: uuid.UUID, user_id: uuid.UUID) -> Farm:
        # Enforce strict ownership: return 404 if not found OR belongs to another user
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == user_id).first()
        if not farm:
            raise NotFoundError("Farm not found.")
        return farm

    @staticmethod
    def update_farm(db: Session, farm_id: uuid.UUID, user_id: uuid.UUID, farm_in: FarmUpdate) -> Farm:
        farm = FarmService.get_user_farm(db, farm_id, user_id)

        update_data = farm_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(farm, field, value)

        # Keep PostGIS Geography Point in sync whenever coordinates change
        if "latitude" in update_data or "longitude" in update_data:
            farm.location = WKTElement(f"POINT({farm.longitude} {farm.latitude})", srid=4326)

        db.commit()
        db.refresh(farm)
        return farm

    @staticmethod
    def delete_farm(db: Session, farm_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """
        Deletes a farm.
        Note: The foreign key in disease_reports has ondelete='SET NULL'.
        Deleting this farm sets disease_reports.farm_id to NULL while keeping
        the disease report, image, and spatial GPS coordinates intact.
        """
        farm = FarmService.get_user_farm(db, farm_id, user_id)
        db.delete(farm)
        db.commit()
        return True

    @staticmethod
    def list_admin_farms(
        db: Session,
        state: Optional[str] = None,
        district: Optional[str] = None
    ) -> List[AdminFarmResponse]:
        query = db.query(Farm, User.name.label("owner_name")).join(User, Farm.user_id == User.id)

        if state:
            query = query.filter(Farm.state.ilike(f"%{state}%"))
        if district:
            query = query.filter(Farm.district.ilike(f"%{district}%"))

        results = query.order_by(Farm.created_at.desc()).all()

        admin_farms = []
        for farm, owner_name in results:
            admin_farms.append(
                AdminFarmResponse(
                    id=farm.id,
                    owner_name=owner_name,
                    farm_name=farm.farm_name,
                    latitude=farm.latitude,
                    longitude=farm.longitude,
                    area_acres=farm.area_acres,
                    state=farm.state,
                    district=farm.district,
                    created_at=farm.created_at
                )
            )
        return admin_farms


farm_service = FarmService()
