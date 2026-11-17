"""
Krishi Drishti - Farm Expense & Profit Analysis Service (P18).
Implements Decimal-accurate expense tracking and multi-scenario profitability forecasts.
"""

import os
import uuid
import joblib
import datetime
import pandas as pd
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.logging import logger
from app.core.errors import NotFoundError, BadRequestError
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.finance import Expense, ExpenseType
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseSummaryResponse,
    ExpenseTypeTotal,
    ExpenseMonthTotal,
    ProfitSummaryResponse,
    ProfitScenario,
)
from app.services.price_service import PriceService
from app.services.crop_advisor import get_current_season


class ExpenseService:

    def __init__(self, db: Session):
        self.db = db
        self.price_service = PriceService(db)
        self.yield_model = None
        self._load_yield_model()

    def _load_yield_model(self):
        paths = [
            "backend/app/ml/yield_predictor.joblib",
            "app/ml/yield_predictor.joblib",
            "/Users/harshvardhanmishra/Desktop/Krishi Drishti/backend/app/ml/yield_predictor.joblib",
        ]
        for p in paths:
            if os.path.exists(p):
                try:
                    self.yield_model = joblib.load(p)
                    break
                except Exception as e:
                    logger.warning(f"Failed to load yield model from {p}: {e}")

    def create_expense(self, user: User, expense_in: ExpenseCreate) -> Expense:
        farm = self.db.query(Farm).filter(Farm.id == expense_in.farm_id, Farm.user_id == user.id).first()
        if not farm:
            raise NotFoundError("Farm not found or does not belong to current user.")

        crop = self.db.query(Crop).filter(Crop.id == expense_in.crop_id).first()
        if not crop:
            raise NotFoundError("Crop not found.")

        expense_date = expense_in.expense_date or datetime.date.today()
        expense = Expense(
            user_id=user.id,
            farm_id=farm.id,
            crop_id=crop.id,
            expense_type=expense_in.expense_type,
            amount=expense_in.amount,
            expense_date=expense_date,
            note=expense_in.note,
        )
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def list_expenses(
        self,
        user: User,
        farm_id: Optional[uuid.UUID] = None,
        crop_id: Optional[uuid.UUID] = None,
        expense_type: Optional[ExpenseType] = None,
        start_date: Optional[datetime.date] = None,
        end_date: Optional[datetime.date] = None,
    ) -> List[Expense]:
        query = self.db.query(Expense).filter(Expense.user_id == user.id)
        if farm_id:
            query = query.filter(Expense.farm_id == farm_id)
        if crop_id:
            query = query.filter(Expense.crop_id == crop_id)
        if expense_type:
            query = query.filter(Expense.expense_type == expense_type)
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)

        return query.order_by(Expense.expense_date.desc()).all()

    def get_expense(self, user: User, expense_id: uuid.UUID) -> Expense:
        expense = self.db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
        if not expense:
            raise NotFoundError("Expense record not found.")
        return expense

    def update_expense(self, user: User, expense_id: uuid.UUID, update_in: ExpenseUpdate) -> Expense:
        expense = self.get_expense(user, expense_id)
        update_data = update_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(expense, field, value)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def delete_expense(self, user: User, expense_id: uuid.UUID) -> bool:
        expense = self.get_expense(user, expense_id)
        self.db.delete(expense)
        self.db.commit()
        return True

    def get_summary(
        self,
        user: User,
        farm_id: Optional[uuid.UUID] = None,
        crop_id: Optional[uuid.UUID] = None,
    ) -> ExpenseSummaryResponse:
        expenses = self.list_expenses(user=user, farm_id=farm_id, crop_id=crop_id)

        type_totals: Dict[ExpenseType, Decimal] = {t: Decimal("0.00") for t in ExpenseType}
        month_totals: Dict[str, Decimal] = {}
        total = Decimal("0.00")

        for exp in expenses:
            total += exp.amount
            type_totals[exp.expense_type] += exp.amount
            month_key = exp.expense_date.strftime("%Y-%m")
            month_totals[month_key] = month_totals.get(month_key, Decimal("0.00")) + exp.amount

        by_type = [
            ExpenseTypeTotal(expense_type=t, total_amount=amt)
            for t, amt in type_totals.items()
            if amt > 0
        ]
        by_month = [
            ExpenseMonthTotal(month=m, total_amount=amt)
            for m, amt in sorted(month_totals.items())
        ]

        return ExpenseSummaryResponse(
            total_expenses=total,
            by_type=by_type,
            by_month=by_month,
        )

    def calculate_profit_summary(
        self,
        user: User,
        farm_id: uuid.UUID,
        crop_id: uuid.UUID,
        expected_yield_quintal: Optional[Decimal] = None,
    ) -> ProfitSummaryResponse:
        farm = self.db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == user.id).first()
        if not farm:
            raise NotFoundError("Farm not found or does not belong to current user.")

        crop = self.db.query(Crop).filter(Crop.id == crop_id).first()
        if not crop:
            raise NotFoundError("Crop not found.")

        # 1. Total Expenses for this Farm & Crop
        expenses = (
            self.db.query(Expense)
            .filter(Expense.user_id == user.id, Expense.farm_id == farm.id, Expense.crop_id == crop.id)
            .all()
        )
        total_expenses = sum((e.amount for e in expenses), Decimal("0.00"))

        assumptions = [
            f"Farm: {farm.farm_name} ({farm.area_acres} acres in {farm.district}, {farm.state}).",
            f"Crop: {crop.name}."
        ]

        # 2. Determine Yield
        is_yield_estimated = False
        yield_range = None
        if expected_yield_quintal is not None and expected_yield_quintal > Decimal("0.00"):
            actual_yield = expected_yield_quintal
            assumptions.append(f"Expected harvest yield provided by farmer: {actual_yield} Quintals.")
        else:
            is_yield_estimated = True
            est_yield = self._predict_crop_yield(crop.name, farm)
            actual_yield = est_yield
            low_y = (actual_yield * Decimal("0.85")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            high_y = (actual_yield * Decimal("1.15")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            yield_range = {
                "low": low_y,
                "high": high_y,
            }
            assumptions.append(
                f"Yield estimated via XGBoost ML model: {actual_yield} Quintals (Estimated range: {low_y} - {high_y} Q)."
            )

        # 3. Market Price Scenarios
        price_info = self.price_service.get_market_price(
            crop_name=crop.name,
            state=farm.state,
            district=farm.district,
        )
        modal_price = price_info.modal_price
        low_price = price_info.min_price
        high_price = price_info.max_price
        assumptions.append(
            f"Mandi prices referenced from {price_info.mandi}: Modal=Rs {modal_price}/Q, Low=Rs {low_price}/Q, High=Rs {high_price}/Q."
        )

        # 4. Compute Scenarios
        scenarios = []
        for name, price in [("low", low_price), ("modal", modal_price), ("high", high_price)]:
            rev = (actual_yield * price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            prof = (rev - total_expenses).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            scenarios.append(
                ProfitScenario(
                    scenario=name,
                    price_per_quintal=price,
                    revenue=rev,
                    profit=prof,
                )
            )

        # 5. Break-Even Price
        if actual_yield > Decimal("0.00"):
            break_even = (total_expenses / actual_yield).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            assumptions.append(f"Break-even cost of production: Rs {break_even} per Quintal.")
        else:
            break_even = Decimal("0.00")

        return ProfitSummaryResponse(
            farm_id=farm.id,
            crop_id=crop.id,
            crop_name=crop.name,
            total_expenses=total_expenses,
            yield_quintal=actual_yield,
            is_yield_estimated=is_yield_estimated,
            yield_estimation_range=yield_range,
            break_even_price_per_quintal=break_even,
            scenarios=scenarios,
            assumptions=assumptions,
        )

    def _predict_crop_yield(self, crop_name: str, farm: Farm) -> Decimal:
        season = get_current_season()
        area = float(farm.area_acres or 1.0)

        # Heuristic fallback benchmarks per acre if ML unavailable
        base_yields = {
            "tomato": 80.0,
            "potato": 75.0,
            "wheat": 18.0,
            "paddy": 22.0,
            "cotton": 8.0,
            "chickpea": 7.0,
            "sugarcane": 300.0,
            "onion": 70.0,
            "brinjal": 60.0,
            "cabbage": 65.0,
        }

        if self.yield_model:
            try:
                df = pd.DataFrame([{
                    "Crop": crop_name.capitalize(),
                    "Season": season,
                    "State": farm.state or "Uttar Pradesh",
                    "Area": area,
                    "Annual_Rainfall": 1000.0,
                    "Fertilizer": 120.0 * area,
                    "Pesticide": 2.5 * area,
                }])
                pred = float(self.yield_model.predict(df)[0])
                # Convert tons to quintals (1 ton = 10 quintals)
                quintals = max(1.0, pred * 10.0)
                return Decimal(str(round(quintals, 2)))
            except Exception as e:
                logger.warning(f"ML yield prediction failed: {e}. Using regional benchmark.")

        # Benchmark fallback
        benchmark = base_yields.get(crop_name.lower(), 20.0) * area
        return Decimal(str(round(benchmark, 2)))
