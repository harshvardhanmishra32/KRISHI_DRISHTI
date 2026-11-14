"""
FastAPI Router for Farm Expenses & Profit/Loss Forecasts (P18).
"""

import uuid
import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.finance import ExpenseType
from app.routers.auth import get_current_active_user
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseSummaryResponse,
    ProfitSummaryResponse,
)
from app.services.expense_service import ExpenseService

router = APIRouter(tags=["Expenses & Profit Tracking"])


@router.post(
    "/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a farm expense",
    description="Records an agricultural expense (seed, fertilizer, labour, etc.) in INR. Amount must be positive."
)
def create_expense(
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    exp = service.create_expense(current_user, expense_in)
    return ExpenseResponse(
        id=exp.id,
        farm_id=exp.farm_id,
        crop_id=exp.crop_id,
        expense_type=exp.expense_type,
        amount=exp.amount,
        expense_date=exp.expense_date,
        note=exp.note,
    )


@router.get(
    "/expenses",
    response_model=List[ExpenseResponse],
    summary="List farm expenses with filtering",
)
def list_expenses(
    farm_id: Optional[uuid.UUID] = Query(None, description="Optional farm filter"),
    crop_id: Optional[uuid.UUID] = Query(None, description="Optional crop filter"),
    expense_type: Optional[ExpenseType] = Query(None, description="Optional expense type filter"),
    start_date: Optional[datetime.date] = Query(None, description="Optional start date"),
    end_date: Optional[datetime.date] = Query(None, description="Optional end date"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    records = service.list_expenses(
        user=current_user,
        farm_id=farm_id,
        crop_id=crop_id,
        expense_type=expense_type,
        start_date=start_date,
        end_date=end_date,
    )
    return [
        ExpenseResponse(
            id=e.id,
            farm_id=e.farm_id,
            crop_id=e.crop_id,
            expense_type=e.expense_type,
            amount=e.amount,
            expense_date=e.expense_date,
            note=e.note,
        )
        for e in records
    ]


@router.get(
    "/expenses/summary",
    response_model=ExpenseSummaryResponse,
    summary="Get aggregated expense summary by category and month",
)
def get_expense_summary(
    farm_id: Optional[uuid.UUID] = Query(None, description="Optional farm filter"),
    crop_id: Optional[uuid.UUID] = Query(None, description="Optional crop filter"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    return service.get_summary(user=current_user, farm_id=farm_id, crop_id=crop_id)


@router.get(
    "/expenses/{id}",
    response_model=ExpenseResponse,
    summary="Get expense record by ID",
)
def get_expense(
    id: uuid.UUID = Path(..., description="Expense UUID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    exp = service.get_expense(current_user, id)
    return ExpenseResponse(
        id=exp.id,
        farm_id=exp.farm_id,
        crop_id=exp.crop_id,
        expense_type=exp.expense_type,
        amount=exp.amount,
        expense_date=exp.expense_date,
        note=exp.note,
    )


@router.put(
    "/expenses/{id}",
    response_model=ExpenseResponse,
    summary="Update an existing expense record",
)
def update_expense(
    id: uuid.UUID = Path(..., description="Expense UUID"),
    expense_in: ExpenseUpdate = ...,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    exp = service.update_expense(current_user, id, expense_in)
    return ExpenseResponse(
        id=exp.id,
        farm_id=exp.farm_id,
        crop_id=exp.crop_id,
        expense_type=exp.expense_type,
        amount=exp.amount,
        expense_date=exp.expense_date,
        note=exp.note,
    )


@router.delete(
    "/expenses/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an expense record",
)
def delete_expense(
    id: uuid.UUID = Path(..., description="Expense UUID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    service.delete_expense(current_user, id)
    return None


@router.get(
    "/profit-summary",
    response_model=ProfitSummaryResponse,
    summary="Calculate expected harvest revenue, profit scenarios, and break-even cost",
    description="Provides multi-scenario returns (low, modal, high Mandi prices) and break-even price per quintal."
)
def get_profit_summary(
    farm_id: uuid.UUID = Query(..., description="Farm UUID"),
    crop_id: uuid.UUID = Query(..., description="Crop UUID"),
    expected_yield_quintal: Optional[Decimal] = Query(None, gt=Decimal("0.00"), description="Optional harvest yield in quintals"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    return service.calculate_profit_summary(
        user=current_user,
        farm_id=farm_id,
        crop_id=crop_id,
        expected_yield_quintal=expected_yield_quintal,
    )
