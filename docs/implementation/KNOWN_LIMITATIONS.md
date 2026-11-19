# Known Limitations & Honest Technical Constraints — Agri

In accordance with engineering integrity principles, this document records verified limitations and constraints of the current implementation.

---

## 1. Data & Geography Limitations

1. **Unresolved Coordinates (2,492 Mandis):**
   - **Condition:** 2,492 mandis out of 2,643 currently have `latitude = NULL` and `longitude = NULL`.
   - **Reason:** In strict adherence to the Owner's Zero-Fabrication policy, missing coordinates were never guessed or approximated.
   - **Impact:** These mandis cannot be plotted as markers on the Leaflet map and cannot have distance in km calculated.
   - **Mitigation:** They remain 100% discoverable, searchable, and usable in all list views, profile pages, forecast pages, and comparisons, marked with an honest `Coordinates Pending` badge.
2. **Historical Price Date Range:**
   - **Condition:** Historical transactions span `2025-06-12` to `2026-04-19`.
   - **Reason:** Sourced directly from the research dataset in `Hybrid-AgriPrice-Forecaster`.
   - **Impact:** Live data beyond April 2026 is not present until an official automated data ingestion pipeline is introduced.
3. **Fixed Evaluation Reference Date (`2026-11-23`):**
   - **Condition:** All forecasts are anchored to reference date `2026-11-23`, projecting `2026-11-24` to `2026-12-07`.
   - **Reason:** Prototype contract decision mandated by the Product Owner to provide standardized evaluation metrics against known historical holdout windows.

---

## 2. Machine Learning Model Limitations

1. **Single Model Artifact:**
   - The platform relies on a single serialized LightGBM booster (`price_lgbm_full_features.pkl`).
   - The model was trained primarily on high-volume national commodities (Onion, Potato, Tomato, Wheat, Rice, Mustard, Cotton, Gram, Maize, Soybean). For minor specialty crops, heuristic fallback mappings are used.
2. **Cold Start Latency:**
   - The first inference call to Python FastAPI takes ~900ms to allocate memory and load feature metadata. Subsequent cached runs respond in ~33ms.

---

## 3. Operational & Infrastructure Limitations

1. **Local Rate Limiting State:**
   - When running locally without Redis, the in-memory rate limiter stores state in JVM heap (`InMemorySlidingWindowRateLimiter`). Restarting the Spring Boot server resets the in-memory window. In production VPS, Redis provides persistent rate limiting across restarts.
2. **Client-Side Saved Markets Scope:**
   - Saved markets are stored in browser `localStorage`. Switching devices or clearing browser cache clears saved markets. This is by design to avoid requiring user accounts.
