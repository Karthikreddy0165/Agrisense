import os
from pydantic_settings import BaseSettings

class Settings:
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "model", "price_lgbm_full_features.pkl")
    )
    MODEL_VERSION: str = "LightGBM-AgriPrice-v1"
    DEFAULT_REFERENCE_DATE: str = "2026-11-23"
    DEFAULT_HORIZON: int = 14

settings = Settings()
