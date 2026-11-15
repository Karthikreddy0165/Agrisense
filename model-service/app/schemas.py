from pydantic import BaseModel, Field
from typing import List, Optional

class PredictionItem(BaseModel):
    date: str = Field(..., description="Forecast date YYYY-MM-DD")
    modalPrice: float = Field(..., description="Predicted modal price in ₹/quintal")
    minPrice: float = Field(..., description="Predicted minimum price in ₹/quintal")
    maxPrice: float = Field(..., description="Predicted maximum price in ₹/quintal")

class ForecastRequest(BaseModel):
    mandiId: str = Field(..., description="Mandi identifier")
    commodityId: str = Field(..., description="Commodity identifier")
    varietyId: Optional[str] = Field("standard", description="Crop variety identifier")
    referenceDate: str = Field("2026-11-23", description="Reference cutoff date YYYY-MM-DD")
    horizon: int = Field(14, ge=1, le=14, description="Forecast horizon in days (default 14)")
    recentPrices: Optional[List[float]] = Field(None, description="Optional recent modal prices to seed autoregression")

class ForecastResponse(BaseModel):
    mandiId: str
    commodityId: str
    varietyId: Optional[str]
    referenceDate: str
    horizon: int
    modelVersion: str
    predictions: List[PredictionItem]

class HealthResponse(BaseModel):
    status: str
    service: str

class ReadyResponse(BaseModel):
    ready: bool
    modelLoaded: bool
    modelVersion: str
    numFeatures: int
