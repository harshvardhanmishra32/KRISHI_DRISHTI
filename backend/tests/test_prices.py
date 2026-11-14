"""
Unit and Integration Tests for Mandi Market Prices (P16).
"""

from decimal import Decimal
from app.main import app


def test_get_market_price_sample_fallback(client):
    """GET /get-market-price for Tomato in Lucknow should return valid Mandi price from CSV."""
    res = client.get("/get-market-price?crop=Tomato&state=Uttar+Pradesh&district=Lucknow")
    assert res.status_code == 200
    data = res.json()
    assert data["crop"].lower() == "tomato"
    assert data["unit"] == "Rs/Quintal"
    assert float(data["modal_price"]) > 0
    assert float(data["min_price"]) <= float(data["modal_price"])
    assert float(data["max_price"]) >= float(data["modal_price"])
    assert data["source"] in ["live API", "database cache", "sample data"]


def test_get_market_price_unsupported_crop_404(client):
    """Requesting an unsupported crop returns 404."""
    res = client.get("/get-market-price?crop=Dragonfruit&state=Goa&district=Panaji")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_get_market_price_caching(client):
    """Subsequent call for same parameters returns rapidly with identical data."""
    url = "/get-market-price?crop=Potato&state=Uttar+Pradesh&district=Lucknow"
    res1 = client.get(url)
    assert res1.status_code == 200
    data1 = res1.json()

    res2 = client.get(url)
    assert res2.status_code == 200
    data2 = res2.json()

    assert data1["modal_price"] == data2["modal_price"]
    assert data1["crop"] == data2["crop"]
