import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.model_adapter import model_adapter

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def load_model():
    model_adapter.load()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "model-inference"

def test_ready():
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert data["modelLoaded"] is True
    assert data["numFeatures"] == 69

def test_14_day_forecast():
    request_data = {
        "mandiId": "lasalgaon-apmc",
        "commodityId": "onion",
        "varietyId": "red",
        "referenceDate": "2026-11-23",
        "horizon": 14,
        "recentPrices": [1800.0, 1850.0, 1820.0, 1900.0]
    }
    response = client.post("/internal/predict", json=request_data)
    assert response.status_code == 200
    data = response.json()
    
    assert data["referenceDate"] == "2026-11-23"
    assert data["horizon"] == 14
    assert len(data["predictions"]) == 14
    
    # Verify dates are exactly 2026-11-24 through 2026-12-07
    expected_dates = [
        "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28",
        "2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03",
        "2026-12-04", "2026-12-05", "2026-12-06", "2026-12-07"
    ]
    actual_dates = [p["date"] for p in data["predictions"]]
    assert actual_dates == expected_dates
    
    # Verify each prediction has positive prices
    for p in data["predictions"]:
        assert p["modalPrice"] > 0
        assert p["minPrice"] <= p["modalPrice"]
        assert p["maxPrice"] >= p["modalPrice"]

def test_invalid_horizon():
    request_data = {
        "mandiId": "lasalgaon-apmc",
        "commodityId": "onion",
        "referenceDate": "2026-11-23",
        "horizon": 20
    }
    response = client.post("/internal/predict", json=request_data)
    assert response.status_code == 422
