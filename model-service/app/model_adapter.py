import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas import PredictionItem, ForecastResponse, ForecastRequest

class ModelAdapter:
    def __init__(self, model_path: str = settings.MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.booster = None
        self.feature_names: List[str] = []
        self.cat_cols = [
            'series_id', 'Commodity_id', 'CropGroup_id', 'State_id',
            'district_name_id', 'Mandi_id', 'Variety_id', 'Grade_id'
        ]
        self.pandas_categorical: List[List[int]] = []
        self.is_loaded = False

    def load(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model artifact not found at {self.model_path}")
        
        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)
            
        self.booster = self.model.booster_
        self.feature_names = self.booster.feature_name()
        self.pandas_categorical = self.booster.pandas_categorical
        self.is_loaded = True
        print(f"Loaded LightGBM model successfully with {len(self.feature_names)} features.")

    def _get_commodity_code(self, comm_id: str) -> int:
        comm_map = {
            "onion": 0, "potato": 1, "tomato": 2, "wheat": 3, "rice": 4,
            "gram": 5, "mustard": 6, "soybean": 7, "maize": 8, "cotton": 9, "chilli": 2
        }
        return comm_map.get(comm_id.lower(), abs(hash(comm_id)) % 10)

    def _get_crop_group(self, comm_id: str) -> int:
        # 0: vegetable, 1: grain, 2: spice, 3: oilseed, 4: fibre
        group_map = {
            "tomato": 0, "onion": 0, "potato": 0,
            "wheat": 1, "rice": 1, "maize": 1,
            "chilli": 2,
            "mustard": 3, "soybean": 3,
            "cotton": 4
        }
        return group_map.get(comm_id.lower(), 0)

    def _get_variety_multiplier(self, variety_id: Optional[str]) -> float:
        if not variety_id or variety_id == "standard":
            return 1.0
        v = variety_id.lower()
        if "hybrid" in v or "shankar" in v:
            return 1.06
        elif "local" in v or "desi" in v:
            return 0.95
        elif "basmati" in v or "sharbati" in v or "teja" in v:
            return 1.15
        elif "chandramukhi" in v or "garwa" in v or "sonamasuri" in v:
            return 1.04
        elif "ir64" in v or "yellow" in v:
            return 0.94
        return 1.0

    def predict_horizon(self, request: ForecastRequest) -> ForecastResponse:
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not loaded.")

        ref_date = datetime.strptime(request.referenceDate, "%Y-%m-%d")
        horizon = request.horizon
        variety_mult = self._get_variety_multiplier(request.varietyId)

        # Seed recent price history (30 days of context)
        if request.recentPrices and len(request.recentPrices) >= 1:
            base_price = request.recentPrices[-1] * variety_mult
            history = [p * variety_mult for p in request.recentPrices]
            while len(history) < 30:
                history.insert(0, history[0])
        else:
            seed_val = (abs(hash(f"{request.mandiId}:{request.commodityId}")) % 3500 + 1500) * variety_mult
            base_price = float(seed_val)
            history = [base_price * (1.0 + 0.015 * np.sin(i / 3.0)) for i in range(30)]

        predictions: List[PredictionItem] = []
        current_history = list(history)
        
        # Category indices mapping
        comm_code = self._get_commodity_code(request.commodityId)
        crop_group = self._get_crop_group(request.commodityId)
        state_code = abs(hash(request.mandiId.split("-")[0])) % len(self.pandas_categorical[3])
        dist_code = abs(hash(f"dist:{request.mandiId}")) % len(self.pandas_categorical[4])
        mandi_code = abs(hash(request.mandiId)) % len(self.pandas_categorical[5])
        var_code = abs(hash(request.varietyId or "standard")) % len(self.pandas_categorical[6])
        series_code = abs(hash(f"{request.mandiId}:{request.commodityId}")) % len(self.pandas_categorical[0])
        grade_code = self.pandas_categorical[7][0]

        cat_values = [
            series_code, comm_code, crop_group, state_code,
            dist_code, mandi_code, var_code, grade_code
        ]

        # Daily iterative prediction
        for step in range(1, horizon + 1):
            target_date = ref_date + timedelta(days=step)
            
            row: Dict[str, Any] = {col: 0.0 for col in self.feature_names}
            
            # 1. Calendar signals
            row['day'] = target_date.day
            row['month'] = target_date.month
            row['year'] = target_date.year
            row['day_of_week'] = target_date.weekday()
            row['day_of_year'] = target_date.timetuple().tm_yday
            row['is_weekend'] = 1 if target_date.weekday() >= 5 else 0
            row['week_of_year'] = target_date.isocalendar()[1]
            
            # Fourier cyclical signals
            row['sin1'] = np.sin(2 * np.pi * target_date.timetuple().tm_yday / 365.25)
            row['cos1'] = np.cos(2 * np.pi * target_date.timetuple().tm_yday / 365.25)
            row['sin2'] = np.sin(4 * np.pi * target_date.timetuple().tm_yday / 365.25)
            row['cos2'] = np.cos(4 * np.pi * target_date.timetuple().tm_yday / 365.25)
            
            # 2. Lag features
            last_modal = current_history[-1]
            row['modal_lag_1'] = current_history[-1]
            row['modal_lag_3'] = current_history[-3] if len(current_history) >= 3 else current_history[-1]
            row['modal_lag_7'] = current_history[-7] if len(current_history) >= 7 else current_history[-1]
            row['modal_lag_14'] = current_history[-14] if len(current_history) >= 14 else current_history[-1]
            row['modal_lag_30'] = current_history[-30] if len(current_history) >= 30 else current_history[-1]
            
            # 3. Rolling statistics
            m3 = float(np.mean(current_history[-3:]))
            s3 = float(np.std(current_history[-3:])) + 1e-4
            m7 = float(np.mean(current_history[-7:]))
            s7 = float(np.std(current_history[-7:])) + 1e-4
            m14 = float(np.mean(current_history[-14:]))
            s14 = float(np.std(current_history[-14:])) + 1e-4
            m30 = float(np.mean(current_history[-30:]))
            s30 = float(np.std(current_history[-30:])) + 1e-4

            row['rolling_mean_3'] = m3
            row['rolling_std_3'] = s3
            row['rolling_mean_7'] = m7
            row['rolling_std_7'] = s7
            row['rolling_mean_14'] = m14
            row['rolling_std_14'] = s14
            row['rolling_mean_30'] = m30
            row['rolling_std_30'] = s30
            
            # 4. Spreads, volatility, momentum & market dynamics
            row['MinPrice'] = last_modal * 0.92
            row['MaxPrice'] = last_modal * 1.08
            row['price_range'] = row['MaxPrice'] - row['MinPrice']
            row['price_spread'] = (last_modal - row['MinPrice']) / (row['price_range'] + 1e-5)
            row['norm_spread'] = row['price_range'] / (last_modal + 1e-5)
            
            row['volatility_7'] = s7 / (m7 + 1e-5)
            row['volatility_30'] = s30 / (m30 + 1e-5)
            row['zscore_7'] = (last_modal - m7) / s7
            row['momentum_7'] = last_modal / (row['modal_lag_7'] + 1e-5)
            row['momentum_14'] = last_modal / (row['modal_lag_14'] + 1e-5)
            
            # Arrivals signals
            base_arrivals = 120.0 + (comm_code * 15.0)
            arrival_var = np.sin((step + target_date.day) / 3.0) * 20.0
            cur_arrivals = max(10.0, base_arrivals + arrival_var)
            row['Arrivals'] = cur_arrivals
            row['arrivals_lag_1'] = cur_arrivals * 0.98
            row['arrivals_lag_3'] = cur_arrivals * 1.02
            row['arrivals_lag_7'] = cur_arrivals * 0.95
            row['arrivals_lag_14'] = cur_arrivals * 1.05
            row['arrivals_avg_7'] = cur_arrivals
            row['arrivals_avg_30'] = cur_arrivals
            row['arrival_change_7'] = cur_arrivals / (row['arrivals_lag_7'] + 1e-5)
            
            # Weather signals
            row['temp_avg'] = 22.0 + np.sin(target_date.timetuple().tm_yday / 50.0) * 5.0
            row['temp_max'] = row['temp_avg'] + 6.0
            row['temp_min'] = row['temp_avg'] - 5.0
            row['temp_range'] = row['temp_max'] - row['temp_min']
            row['humidity'] = 55.0 + np.cos(target_date.timetuple().tm_yday / 40.0) * 10.0
            row['rainfall'] = 0.0
            row['rain_intensity'] = 0.0
            row['solar_radiation'] = 16.5
            row['wind_speed'] = 2.8
            
            # Coordinates
            lat = 20.0 + (state_code * 0.4)
            lon = 77.0 + (mandi_code % 10) * 0.5
            row['lat'] = lat
            row['lon'] = lon
            row['lat_sin'] = np.sin(np.radians(lat))
            row['lat_cos'] = np.cos(np.radians(lat))
            row['lon_sin'] = np.sin(np.radians(lon))
            row['lon_cos'] = np.cos(np.radians(lon))
            
            # 5. Build single-row DataFrame and assign categorical dtypes
            df_row = pd.DataFrame([row])
            for col, val, cats in zip(self.cat_cols, cat_values, self.pandas_categorical):
                mapped_val = val if val in cats else cats[val % len(cats)]
                df_row[col] = pd.Categorical([mapped_val], categories=cats)
                
            raw_pred = float(self.model.predict(df_row)[0])
            
            # Ensure model output tracks the actual recent price magnitude smoothly:
            # Autoregressive smoothing combines model raw inference with historical momentum
            momentum_factor = 0.7 * (raw_pred / (row['modal_lag_1'] + 1e-5)) + 0.3 * (row['momentum_7'])
            pred_modal = round(float(last_modal * (0.4 + 0.6 * momentum_factor)), 2)
            
            # Add expanding uncertainty band over the 14-day horizon
            uncertainty_pct = 0.04 + (step / float(horizon)) * 0.05
            min_price = round(float(pred_modal * (1.0 - uncertainty_pct)), 2)
            max_price = round(float(pred_modal * (1.0 + uncertainty_pct)), 2)
            
            predictions.append(
                PredictionItem(
                    date=target_date.strftime("%Y-%m-%d"),
                    modalPrice=pred_modal,
                    minPrice=min_price,
                    maxPrice=max_price
                )
            )
            current_history.append(pred_modal)

        return ForecastResponse(
            mandiId=request.mandiId,
            commodityId=request.commodityId,
            varietyId=request.varietyId,
            referenceDate=request.referenceDate,
            horizon=horizon,
            modelVersion=settings.MODEL_VERSION,
            predictions=predictions
        )

model_adapter = ModelAdapter()
