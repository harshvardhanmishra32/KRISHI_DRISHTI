"""
Pydantic Schemas for Mandi Market Prices (P16).
"""

import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class PriceTrendItem(BaseModel):
    date: datetime.date
    min_price: Decimal
    max_price: Decimal
    modal_price: Decimal


class MarketPriceResponse(BaseModel):
    crop: str
    commodity: str
    mandi: str
    district: str
    state: str
    min_price: Decimal
    max_price: Decimal
    modal_price: Decimal
    unit: str = "Rs/Quintal"
    price_date: datetime.date
    is_stale: bool
    staleness_warning: Optional[str] = None
    source: str  # "live API", "cached", or "sample data"
    trend_7d: List[PriceTrendItem] = []
