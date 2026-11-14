"""
Pydantic Schemas for Farm Expense Management and Profit & Loss Analysis (P18).
"""

import uuid
import datetime
from decimal import Decimal
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

from app.models.finance import ExpenseType


class ExpenseCreate(BaseModel):
    farm_id: uuid.UUID
    crop_id: uuid.UUID
    expense_type: ExpenseType
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Monetary expense amount in INR (must be positive)")
    expense_date: Optional[datetime.date] = None
    note: Optional[str] = None


class ExpenseUpdate(BaseModel):
    expense_type: Optional[ExpenseType] = None
    amount: Optional[Decimal] = Field(None, gt=Decimal("0.00"))
    expense_date: Optional[datetime.date] = None
    note: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    farm_id: uuid.UUID
    crop_id: uuid.UUID
    expense_type: ExpenseType
    amount: Decimal
    expense_date: datetime.date
    note: Optional[str] = None


class ExpenseTypeTotal(BaseModel):
    expense_type: ExpenseType
    total_amount: Decimal


class ExpenseMonthTotal(BaseModel):
    month: str  # YYYY-MM
    total_amount: Decimal


class ExpenseSummaryResponse(BaseModel):
    total_expenses: Decimal
    by_type: List[ExpenseTypeTotal]
    by_month: List[ExpenseMonthTotal]


class ProfitScenario(BaseModel):
    scenario: str  # "low", "modal", "high"
    price_per_quintal: Decimal
    revenue: Decimal
    profit: Decimal


class ProfitSummaryResponse(BaseModel):
    farm_id: uuid.UUID
    crop_id: uuid.UUID
    crop_name: str
    total_expenses: Decimal
    yield_quintal: Decimal
    is_yield_estimated: bool
    yield_estimation_range: Optional[Dict[str, Decimal]] = None
    break_even_price_per_quintal: Decimal
    scenarios: List[ProfitScenario]
    assumptions: List[str]
