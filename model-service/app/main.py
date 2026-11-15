from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import ForecastRequest, ForecastResponse, HealthResponse, ReadyResponse
from app.model_adapter import model_adapter

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load LightGBM model
    try:
        model_adapter.load()
    except Exception as e:
        print(f"Warning during model load: {e}")
    yield
    # Shutdown

app = FastAPI(
    title="AgriForecasting Model Inference Service",
    description="Python FastAPI service serving LightGBM 14-day Mandi Price Forecasts",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", service="model-inference")

@app.get("/ready", response_model=ReadyResponse)
def ready():
    return ReadyResponse(
        ready=model_adapter.is_loaded,
        modelLoaded=model_adapter.is_loaded,
        modelVersion=settings.MODEL_VERSION,
        numFeatures=len(model_adapter.feature_names)
    )

@app.post("/internal/predict", response_model=ForecastResponse)
def predict(request: ForecastRequest):
    if not model_adapter.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded or ready.")
    try:
        return model_adapter.predict_horizon(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
