# User Flows & Interaction Specifications — Agri

## Overview

This document specifies the primary user journeys through Agri, mapping user interactions, system state transitions, API calls, and edge-case handling.

---

## Flow 1: Location Discovery & Immediate Market Highlight

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer / User
    participant Browser as Next.js Client
    participant LocationCtx as LocationContext
    participant Backend as Spring Boot (:8080)
    participant DB as PostgreSQL (:5432)

    Farmer->>Browser: Opens Agri Homepage (/)
    Browser->>LocationCtx: Check localStorage for saved location
    alt Saved location exists
        LocationCtx-->>Browser: Set state to SAVED location
    else No saved location
        Browser->>Farmer: Prompt for Browser Geolocation Permission
        alt Permission Granted
            Farmer-->>Browser: Allow Geolocation
            Browser->>LocationCtx: Set coords (e.g. 28.4595, 77.0266)
            LocationCtx->>Backend: GET /api/v1/mandis/nearby?lat=...&lon=...&radiusKm=50
            Backend->>DB: Query mandis with coordinates within radius
            DB-->>Backend: Mandi records sorted by Haversine distance
            Backend-->>Browser: Nearest Mandis list (e.g. Gurgaon APMC)
            LocationCtx-->>Browser: Update nearest detected mandi badge
        else Permission Denied or Unavailable
            Farmer-->>Browser: Deny or Dismiss
            Browser->>LocationCtx: Fallback to manual selection prompt
        end
    end
```

---

## Flow 2: Dynamic Location Modal Cascade

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Modal as LocationSelectorModal
    participant Api as ApiService
    participant Backend as Spring Boot

    User->>Modal: Clicks "Change Location"
    Modal->>Api: getStates()
    Api->>Backend: GET /api/v1/states
    Backend-->>Modal: Return 30 States
    User->>Modal: Selects State (e.g. Punjab 'pb')
    Modal->>Api: getDistricts('pb')
    Api->>Backend: GET /api/v1/districts?stateId=pb
    Backend-->>Modal: Return 63 Districts in Punjab
    User->>Modal: Selects District (e.g. Ludhiana)
    Modal->>Api: getMandis({ districtId: 'pb-ludhiana' })
    Api->>Backend: GET /api/v1/mandis?districtId=pb-ludhiana
    Backend-->>Modal: Return Mandis in Ludhiana (Khanna APMC, etc.)
    User->>Modal: Selects Mandi and clicks "Apply Location"
    Modal->>LocationCtx: Update active location (label, stateId, districtId, mandiId)
    Modal-->>User: Closes modal; top header updates to "Punjab (Saved)"
```

---

## Flow 3: 14-Day Price Forecast Generation & Audit Archive

```mermaid
sequenceDiagram
    autonumber
    actor User as Farmer
    participant UI as ForecastClient (/forecast)
    participant Java as Spring Boot Backend
    participant Fast as FastAPI Inference (:8000)
    participant Model as LightGBM Booster
    participant DB as PostgreSQL

    User->>UI: Selects Mandi (Kolar APMC), Commodity (Tomato), Variety (Hybrid)
    UI->>Java: GET /api/v1/forecasts?mandiId=ka-kolar-apmc&commodityId=tomato&varietyId=tomato-hybrid
    Java->>DB: Check deduplication (recent run in last 15 min for ref date 2026-11-23)
    alt Recent Run Cached in DB
        DB-->>Java: Cached ForecastRun record
    else New Run Required
        Java->>DB: Fetch 30-day price history for ka-kolar-apmc & tomato
        DB-->>Java: Recent actual price observations
        Java->>Fast: POST /internal/predict (mandiId, commodityId, refDate: 2026-11-23, recentPrices)
        Fast->>Model: Compute 69 lag, rolling, cyclical & categorical features
        Model-->>Fast: Daily predictions for Day 1 through 14
        Fast-->>Java: JSON predictions (2026-11-24 to 2026-12-07)
        Java->>DB: INSERT into forecast_runs and forecast_run_items
        DB-->>Java: Committed forecastRunId
    end
    Java-->>UI: Return ForecastResponse (referenceDate, horizon: 14, predictions)
    UI-->>User: Render connected historical-to-forecast chart & day-by-day breakdown
```

---

## Flow 4: Cross-Mandi Price Comparison

1. User navigates to `/compare`.
2. User selects a single commodity (e.g., `Tomato`) and variety (e.g., `Hybrid`).
3. User selects 2 to 5 mandis across any state (e.g., `Kolar APMC (Karnataka)` and `Amritsar APMC (Punjab)`).
4. System executes `GET /api/v1/comparisons?commodityId=tomato&varietyId=tomato-hybrid&mandiIds=ka-kolar-apmc,pb-amritsar-apmc`.
5. Backend verifies `mandiIds.size() <= 5` (returns HTTP 400 if exceeded).
6. Backend orchestrates current prices, historical observations, and 14-day forecasts for each market.
7. Frontend displays comparative price differential cards (identifying the highest and lowest markets) and multi-line Recharts visualization.

---

## Flow 5: Prediction History & Verification Audit

1. User opens `/prediction-history`.
2. Frontend queries `GET /api/v1/forecasts/history`.
3. Backend retrieves historical `forecast_runs` from PostgreSQL ordered by `generated_at DESC`.
4. User clicks "Inspect" on any run card.
5. Frontend requests `GET /api/v1/forecasts/history/{id}`.
6. Backend loads `forecast_run_items` and checks `price_observations` for any actual observations matching `target_date`.
7. Modal displays the original prediction alongside actual ground-truth market prices once recorded, calculating variance percentage.
