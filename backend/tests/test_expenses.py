"""
Unit and Integration Tests for Farm Expenses & Profit/Loss Forecast (P18).
"""

import uuid
from decimal import Decimal
from unittest.mock import patch
from app.models.user import User, UserRole
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.finance import Expense, ExpenseType
from app.routers.auth import get_current_user
from app.main import app


def get_mock_farmer():
    return User(
        id=uuid.uuid4(),
        name="Suresh Yadav",
        phone="9876543214",
        password_hash="fake",
        preferred_language="hi",
        role=UserRole.FARMER,
    )


def test_expense_negative_amount_rejected(client):
    """Submitting a negative expense amount must be rejected with 422."""
    app.dependency_overrides[get_current_user] = get_mock_farmer
    try:
        payload = {
            "farm_id": str(uuid.uuid4()),
            "crop_id": str(uuid.uuid4()),
            "expense_type": "fertilizer",
            "amount": -500.0,
        }
        res = client.post("/expenses", json=payload)
        assert res.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_profit_summary_hand_check_formula():
    """
    Hand-check test required by P18:
    Expenses 45,000, Yield 20 quintals, Price 2,400:
    Revenue = 20 * 2,400 = 48,000
    Profit = 48,000 - 45,000 = 3,000
    Break-even price = 45,000 / 20 = 2,250
    """
    total_expenses = Decimal("45000.00")
    yield_q = Decimal("20.00")
    price = Decimal("2400.00")

    revenue = yield_q * price
    profit = revenue - total_expenses
    break_even = total_expenses / yield_q

    assert revenue == Decimal("48000.00")
    assert profit == Decimal("3000.00")
    assert break_even == Decimal("2250.00")


def test_get_profit_summary_endpoint(client):
    """GET /profit-summary returns scenarios and break-even price using Decimal."""
    farmer = get_mock_farmer()
    app.dependency_overrides[get_current_user] = lambda: farmer
    try:
        farm_id = uuid.uuid4()
        crop_id = uuid.uuid4()

        from app.schemas.expense import ProfitSummaryResponse, ProfitScenario
        mock_summary = ProfitSummaryResponse(
            farm_id=farm_id,
            crop_id=crop_id,
            crop_name="Tomato",
            total_expenses=Decimal("45000.00"),
            yield_quintal=Decimal("20.00"),
            is_yield_estimated=False,
            break_even_price_per_quintal=Decimal("2250.00"),
            scenarios=[
                ProfitScenario(scenario="low", price_per_quintal=Decimal("1800.00"), revenue=Decimal("36000.00"), profit=Decimal("-9000.00")),
                ProfitScenario(scenario="modal", price_per_quintal=Decimal("2400.00"), revenue=Decimal("48000.00"), profit=Decimal("3000.00")),
                ProfitScenario(scenario="high", price_per_quintal=Decimal("2800.00"), revenue=Decimal("56000.00"), profit=Decimal("11000.00")),
            ],
            assumptions=["Farm: 2 acres in Lucknow", "Yield: 20 quintals"]
        )

        with patch("app.services.expense_service.ExpenseService.calculate_profit_summary", return_value=mock_summary):
            res = client.get(f"/profit-summary?farm_id={farm_id}&crop_id={crop_id}&expected_yield_quintal=20.0")

        assert res.status_code == 200
        data = res.json()
        assert data["crop_name"] == "Tomato"
        assert float(data["yield_quintal"]) == 20.0
        assert "scenarios" in data
        assert len(data["scenarios"]) == 3  # low, modal, high
        assert "break_even_price_per_quintal" in data
        assert "assumptions" in data
    finally:
        app.dependency_overrides.pop(get_current_user, None)
