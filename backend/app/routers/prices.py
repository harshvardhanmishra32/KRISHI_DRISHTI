"""
FastAPI Router for Krishi Drishti Mandi Market Prices (P16).
Provides GET /get-market-price with Redis 6h caching and graceful CSV fallback.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.price_service import PriceService
from app.schemas.price import MarketPriceResponse

router = APIRouter(tags=["Market Prices"])


@router.get(
    "/get-market-price",
    response_model=MarketPriceResponse,
    summary="Get Mandi market prices with 6-hour caching and fallback",
    description=(
        "Returns current min, max, and modal prices per quintal for the specified crop, state, and district. "
        "Cached in Redis for 6 hours. Automatically falls back to local sample dataset if upstream API is unreachable."
    )
)
def get_market_price(
    crop: str = Query(..., description="Crop name (e.g. Tomato, Potato, Wheat)"),
    state: Optional[str] = Query(None, description="State name (e.g. Uttar Pradesh, Maharashtra)"),
    district: Optional[str] = Query(None, description="District name (e.g. Lucknow, Nashik)"),
    db: Session = Depends(get_db),
):
    service = PriceService(db)
    return service.get_market_price(crop_name=crop, state=state, district=district)
