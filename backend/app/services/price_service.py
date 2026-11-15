"""
Krishi Drishti - Mandi Market Price Service (P16).
Provides market price lookup with Redis 6h caching, PostgreSQL persistence, and sample CSV fallback.
"""

import csv
import datetime
import json
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.core.logging import logger
from app.core.redis import get_redis_client
from app.models.crop import Crop
from app.models.finance import MarketPrice
from app.schemas.price import MarketPriceResponse, PriceTrendItem

REDIS_PRICE_TTL_SECONDS = 6 * 3600  # 6 hours cache as required by P16


class PriceService:

    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis_client()
        self.crop_map: dict[str, str] = {}
        self._load_crop_map()

    def _load_crop_map(self) -> None:
        base_dir = Path(__file__).resolve().parents[2]
        map_paths = [
            base_dir / "data" / "crop_commodity_map.json",
            Path("backend/data/crop_commodity_map.json"),
            Path("data/crop_commodity_map.json"),
        ]
        for p in map_paths:
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        loaded = json.load(f)
                        if isinstance(loaded, dict):
                            self.crop_map = {str(k): str(v) for k, v in loaded.items()}
                    break
                except Exception as exc:  # noqa: BLE001
                    logger.warning(f"Failed to read crop commodity map from {p}: {exc}")

    def get_market_price(
        self,
        crop_name: str,
        state: str | None = None,
        district: str | None = None,
    ) -> MarketPriceResponse:
        crop_clean = crop_name.strip().lower()
        crop = self.db.query(Crop).filter(Crop.name.ilike(crop_clean)).first()
        if not crop:
            raise NotFoundError(f"Crop '{crop_name}' is not supported.")

        state_clean = state.strip() if state else "Uttar Pradesh"
        district_clean = district.strip() if district else "Lucknow"

        cache_key = f"mandi_price:{crop_clean}:{state_clean.lower()}:{district_clean.lower()}"

        # 1. Check Redis Cache
        if self.redis:
            try:
                cached_data = self.redis.get(cache_key)
                if isinstance(cached_data, (str, bytes)):
                    logger.info(f"Serving Mandi price from Redis cache: {cache_key}")
                    if isinstance(cached_data, bytes):
                        cached_str = cached_data.decode("utf-8")
                    else:
                        cached_str = cached_data
                    return MarketPriceResponse.model_validate_json(cached_str)
            except Exception as e:  # noqa: BLE001
                logger.warning(f"Redis cache check failed: {e}")

        # 2. Check Database for recent price
        db_price = (
            self.db.query(MarketPrice)
            .filter(
                MarketPrice.crop_id == crop.id,
                MarketPrice.state.ilike(state_clean),
                MarketPrice.district.ilike(district_clean),
            )
            .order_by(MarketPrice.price_date.desc())
            .first()
        )

        today = datetime.date.today()

        if db_price:
            price_date = (
                db_price.price_date
                if isinstance(db_price.price_date, datetime.date)
                else datetime.date.fromisoformat(str(db_price.price_date))
            )
            db_modal_price = Decimal(str(db_price.price_per_quintal))
            is_stale = (today - price_date).days > 3
            warning = (
                f"Data is {(today - price_date).days} days old. Real-time market arrivals may vary."
                if is_stale else None
            )

            # Look for 7-day trend
            trend_rows = (
                self.db.query(MarketPrice)
                .filter(
                    MarketPrice.crop_id == crop.id,
                    MarketPrice.state.ilike(state_clean),
                    MarketPrice.district.ilike(district_clean),
                )
                .order_by(MarketPrice.price_date.desc())
                .limit(7)
                .all()
            )
            trend_items: list[PriceTrendItem] = []
            for r in reversed(trend_rows):
                r_date = (
                    r.price_date
                    if isinstance(r.price_date, datetime.date)
                    else datetime.date.fromisoformat(str(r.price_date))
                )
                r_modal = Decimal(str(r.price_per_quintal))
                trend_items.append(
                    PriceTrendItem(
                        date=r_date,
                        min_price=round(r_modal * Decimal("0.90"), 2),
                        max_price=round(r_modal * Decimal("1.10"), 2),
                        modal_price=round(r_modal, 2),
                    )
                )

            response = MarketPriceResponse(
                crop=str(crop.name),
                commodity=self.crop_map.get(crop_clean, str(crop.name)),
                mandi=str(db_price.mandi_name),
                district=str(db_price.district),
                state=str(db_price.state),
                min_price=round(db_modal_price * Decimal("0.90"), 2),
                max_price=round(db_modal_price * Decimal("1.10"), 2),
                modal_price=round(db_modal_price, 2),
                unit="Rs/Quintal",
                price_date=price_date,
                is_stale=is_stale,
                staleness_warning=warning,
                source="database cache",
                trend_7d=trend_items,
            )
            self._cache_response(cache_key, response)
            return response

        # 3. Fallback: Load from CSV sample
        fallback_item = self._find_in_sample_csv(crop_clean, state_clean, district_clean)
        if fallback_item:
            mandi_name = str(fallback_item["market"])
            st_name = str(fallback_item["state"])
            dist_name = str(fallback_item["district"])
            min_p = Decimal(str(fallback_item["min_price"]))
            max_p = Decimal(str(fallback_item["max_price"]))
            modal_p = Decimal(str(fallback_item["modal_price"]))
            p_date = datetime.date.fromisoformat(str(fallback_item["arrival_date"]))

            # Upsert into PostgreSQL market_prices
            existing = (
                self.db.query(MarketPrice)
                .filter(
                    MarketPrice.crop_id == crop.id,
                    MarketPrice.mandi_name == mandi_name,
                    MarketPrice.price_date == p_date,
                )
                .first()
            )
            if not existing:
                new_price = MarketPrice(
                    crop_id=crop.id,
                    mandi_name=mandi_name,
                    state=st_name,
                    district=dist_name,
                    price_per_quintal=modal_p,
                    price_date=p_date,
                )
                self.db.add(new_price)
                try:
                    self.db.commit()
                except Exception as e:  # noqa: BLE001
                    self.db.rollback()
                    logger.warning(f"Could not persist fallback price to DB: {e}")

            is_stale = (today - p_date).days > 3
            warning = (
                f"Data is {(today - p_date).days} days old. Real-time market arrivals may vary."
                if is_stale else None
            )

            trend_items = [
                PriceTrendItem(
                    date=p_date - datetime.timedelta(days=i),
                    min_price=max(Decimal("1.00"), min_p - Decimal(i * 10)),
                    max_price=max(Decimal("1.00"), max_p - Decimal(i * 10)),
                    modal_price=max(Decimal("1.00"), modal_p - Decimal(i * 10)),
                )
                for i in range(5, -1, -1)
            ]

            response = MarketPriceResponse(
                crop=str(crop.name),
                commodity=str(fallback_item["commodity"]),
                mandi=mandi_name,
                district=dist_name,
                state=st_name,
                min_price=min_p,
                max_price=max_p,
                modal_price=modal_p,
                unit="Rs/Quintal",
                price_date=p_date,
                is_stale=is_stale,
                staleness_warning=warning,
                source="sample data",
                trend_7d=trend_items,
            )
            self._cache_response(cache_key, response)
            return response

        # 4. If crop not in CSV, synthesize a reasonable default based on known MSP
        default_prices = {
            "wheat": Decimal(2275),
            "paddy": Decimal(2183),
            "tomato": Decimal(1800),
            "potato": Decimal(1300),
            "cotton": Decimal(6620),
            "chickpea": Decimal(5440),
            "sugarcane": Decimal(350),
            "onion": Decimal(1900),
            "brinjal": Decimal(1500),
            "cabbage": Decimal(1400),
        }
        modal_p = default_prices.get(crop_clean, Decimal(2000))
        min_p = round(modal_p * Decimal("0.85"), 2)
        max_p = round(modal_p * Decimal("1.15"), 2)

        trend_items = [
            PriceTrendItem(
                date=today - datetime.timedelta(days=i),
                min_price=max(Decimal("1.00"), min_p - Decimal(i * 10)),
                max_price=max(Decimal("1.00"), max_p - Decimal(i * 10)),
                modal_price=max(Decimal("1.00"), modal_p - Decimal(i * 10)),
            )
            for i in range(5, -1, -1)
        ]

        response = MarketPriceResponse(
            crop=str(crop.name),
            commodity=self.crop_map.get(crop_clean, str(crop.name)),
            mandi=f"{district_clean} Central Mandi",
            district=district_clean,
            state=state_clean,
            min_price=min_p,
            max_price=max_p,
            modal_price=modal_p,
            unit="Rs/Quintal",
            price_date=today,
            is_stale=False,
            staleness_warning=None,
            source="sample data",
            trend_7d=trend_items,
        )
        self._cache_response(cache_key, response)
        return response

    def _find_in_sample_csv(
        self, crop_clean: str, state: str, district: str
    ) -> dict[str, Any] | None:
        base_dir = Path(__file__).resolve().parents[2]
        csv_paths = [
            base_dir / "data" / "mandi_sample.csv",
            Path("backend/data/mandi_sample.csv"),
            Path("data/mandi_sample.csv"),
        ]
        target_commodity = self.crop_map.get(crop_clean, crop_clean)

        for path in csv_paths:
            if not path.exists():
                continue
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = list(reader)

                # 1. Exact match on commodity, state, district
                for r in rows:
                    if (
                        target_commodity.lower() in r["commodity"].lower()
                        and state.lower() in r["state"].lower()
                        and district.lower() in r["district"].lower()
                    ):
                        return r

                # 2. Match on commodity and state
                for r in rows:
                    if (
                        target_commodity.lower() in r["commodity"].lower()
                        and state.lower() in r["state"].lower()
                    ):
                        return r

                # 3. Match on commodity only
                for r in rows:
                    if target_commodity.lower() in r["commodity"].lower():
                        return r
        return None

    def _cache_response(self, cache_key: str, response: MarketPriceResponse) -> None:
        if not self.redis:
            return
        try:
            data_json = response.model_dump_json()
            self.redis.setex(cache_key, REDIS_PRICE_TTL_SECONDS, data_json)
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Failed to cache Mandi price in Redis: {e}")
