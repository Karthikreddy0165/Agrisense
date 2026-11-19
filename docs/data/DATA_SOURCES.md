# Data Sources & Origin Verification — Agri

## 1. Upstream Research Repository

The national dataset originates from the machine learning project:
- **Repository:** `Hybrid-AgriPrice-Forecaster`
- **Path:** `/Users/karthikreddy/Desktop/Hybrid-AgriPrice-Forecaster`

---

## 2. Primary Source Files

### 1. `ALL_CROPS_DATA.csv`
- **Absolute Path:** `/Users/karthikreddy/Desktop/Hybrid-AgriPrice-Forecaster/Modules/Price_LGBM/MandiPricePredictionSystem/DataScraping/CropData/ALL_CROPS_DATA.csv`
- **File Size:** ~97.2 MB (1,171,101 lines)
- **Content:** Historical daily mandi price records spanning multiple crops across India.
- **Header Columns:**
  `Commodity,State,District,Market,Variety,Grade,MinPrice,MaxPrice,ModalPrice,Commodity_Code,Arrivals,Date`
- **Date Range:** `2025-06-12` through `2026-04-19`

### 2. `hierarchy_map.csv`
- **Absolute Path:** `/Users/karthikreddy/Desktop/Hybrid-AgriPrice-Forecaster/Modules/Price_TFT/data/hierarchy_map.csv`
- **File Size:** ~210 KB (2,309 records)
- **Content:** APMC market hierarchy mapping state, district, and APMC market names.
- **Header Columns:**
  `state,district,market`

### 3. `districts_geocoded_fixed.csv`
- **Absolute Path:** `/Users/karthikreddy/Desktop/Hybrid-AgriPrice-Forecaster/Modules/Price_LGBM/MandiPricePredictionSystem/districts_geocoded_fixed.csv`
- **Content:** Coordinates for verified districts and major market hubs.
- **Verified Coordinates Extracted:** 151 mandis mapped to verified geographic coordinates.

### 4. `price_lgbm_full_features.pkl`
- **Absolute Path:** `/Users/karthikreddy/Desktop/Agri/model-service/model/price_lgbm_full_features.pkl`
- **File Size:** ~21.6 MB
- **Content:** Serialized LightGBM booster model trained on historical Indian mandi pricing patterns.
