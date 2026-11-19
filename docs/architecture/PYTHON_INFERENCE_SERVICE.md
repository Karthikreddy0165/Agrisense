# Python Inference Service & Model Adapter — Agri

## 1. Service Specification

The Python inference service is a high-performance internal microservice located in `/Users/karthikreddy/Desktop/Agri/model-service`.

- **Framework:** FastAPI + Uvicorn
- **Default Port:** `8000` (Binding: `127.0.0.1:8000` or internal Docker network `agri-internal`)
- **Public Visibility:** **Zero** (Unexposed to public internet; only accessible by Java Spring Boot backend)
- **Model Artifact:** `/Users/karthikreddy/Desktop/Agri/model-service/model/price_lgbm_full_features.pkl`

---

## 2. Model Discovery & Feature Construction

Inspection of the pickled LightGBM booster (`booster = model.booster_`) revealed that the model expects **exactly 69 features** categorized into four distinct groups:

### 1. Calendar & Cyclical Signals
- `day`, `month`, `year`, `day_of_week`, `day_of_year`, `is_weekend`, `week_of_year`
- Fourier harmonics for annual seasonal curves:
  $$\sin_1 = \sin\left(\frac{2\pi \cdot \text{day\_of\_year}}{365.25}\right), \quad \cos_1 = \cos\left(\frac{2\pi \cdot \text{day\_of\_year}}{365.25}\right)$$
  $$\sin_2 = \sin\left(\frac{4\pi \cdot \text{day\_of\_year}}{365.25}\right), \quad \cos_2 = \cos\left(\frac{4\pi \cdot \text{day\_of\_year}}{365.25}\right)$$

### 2. Lag Features & Rolling Statistics
- `modal_lag_1`, `modal_lag_3`, `modal_lag_7`, `modal_lag_14`, `modal_lag_30`
- Rolling means and standard deviations: `rolling_mean_3`, `rolling_std_3`, `rolling_mean_7`, `rolling_std_7`, `rolling_mean_14`, `rolling_std_14`, `rolling_mean_30`, `rolling_std_30`

### 3. Market Dynamics & Volatility
- `MinPrice`, `MaxPrice`, `price_range`, `price_spread`, `norm_spread`
- `volatility_7`, `volatility_30`, `zscore_7`, `momentum_7`, `momentum_14`
- Arrivals signals: `Arrivals`, `arrivals_lag_1`, `arrivals_lag_3`, `arrivals_lag_7`, `arrivals_lag_14`, `arrivals_avg_7`, `arrivals_avg_30`, `arrival_change_7`
- Weather signals: `temp_avg`, `temp_max`, `temp_min`, `temp_range`, `humidity`, `rainfall`, `rain_intensity`, `solar_radiation`, `wind_speed`
- Geographic coordinates: `lat`, `lon`, `lat_sin`, `lat_cos`, `lon_sin`, `lon_cos`

### 4. Categorical Encodings (Pandas Categoricals)
- `series_id`, `Commodity_id`, `CropGroup_id`, `State_id`, `district_name_id`, `Mandi_id`, `Variety_id`, `Grade_id`
- Mapped dynamically into the model's exact internal categorical integer partitions (`booster.pandas_categorical`).

---

## 3. Autoregressive Horizon Rollout (Days 1–14)

Because predicting 14 days into the future requires features that depend on prior days' prices (e.g. `modal_lag_1`), the `ModelAdapter` executes an **autoregressive rollout**:

```python
for step in range(1, horizon + 1):
    target_date = ref_date + timedelta(days=step)
    # 1. Update calendar features for target_date
    # 2. Update lag features from current_history[-1], [-3], etc.
    # 3. Compute rolling stats over current_history
    # 4. Predict raw price using LightGBM
    raw_pred = float(self.model.predict(df_row)[0])
    
    # 5. Apply smooth autoregressive momentum
    momentum_factor = 0.7 * (raw_pred / (row['modal_lag_1'] + 1e-5)) + 0.3 * (row['momentum_7'])
    pred_modal = round(float(last_modal * (0.4 + 0.6 * momentum_factor)), 2)
    
    # 6. Apply expanding uncertainty cone (4% to 9% over 14 days)
    uncertainty_pct = 0.04 + (step / float(horizon)) * 0.05
    min_price = round(float(pred_modal * (1.0 - uncertainty_pct)), 2)
    max_price = round(float(pred_modal * (1.0 + uncertainty_pct)), 2)
    
    # 7. Append prediction to history for next day's step
    current_history.append(pred_modal)
```

---

## 4. API Endpoints

| Endpoint | Method | Purpose | Response Payload |
|---|---|---|---|
| `/health` | `GET` | Service liveness probe | `{"status": "ok", "service": "model-inference"}` |
| `/ready` | `GET` | Model readiness probe | `{"ready": true, "modelLoaded": true, "numFeatures": 69}` |
| `/internal/predict` | `POST` | 14-day inference pipeline | `ForecastResponse` with 14 daily predictions |
