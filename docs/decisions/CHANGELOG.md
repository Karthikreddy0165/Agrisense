# Changelog — Agri

All notable changes to the Agri platform are documented in this file.

---

## [3.0.0] - 2026-11-23 — National Mandi Geography & Comprehensive Audit Release

### Added
- **National Mandi Dataset Ingestion:** Ingested 30 states, 913 districts, 2,643 physical mandis, 15 commodities, and 262 varieties into PostgreSQL `agriforecasting`.
- **Historical Price Streamer:** Ingested 1,136,107 historical price observations in 15.75 seconds using PostgreSQL `COPY` expert.
- **RESTful Endpoints & Fallbacks:**
  - Added `GET /api/v1/commodities/{commodityId}` single commodity lookup.
  - Added RESTful path parameters for prices: `GET /api/v1/prices/{mandiId}/{commodityId}`, `/latest`, `/history`, `/summary`.
  - Added plural and singular aliases for forecasts (`/forecasts`, `/forecast`) and comparisons (`/comparisons`, `/comparison`).
- **Sliding-Window Rate Limiter:** Added concurrent sliding-window rate limiter per client IP with Redis Lua script and in-memory fallback.
- **Comprehensive Test Suites:**
  - Created automated 22-endpoint API verification suite (`tests/test_api_suite.py`).
  - Created 10-flow Playwright browser QA suite (`tests/browser_qa_v3.py`).
- **Comprehensive Repository Documentation:** Added `docs/` knowledge base spanning product, architecture, data, implementation, decisions, testing, and operations.

### Changed
- Replaced 29-mandi prototype seed with the full national catalogue.
- Updated `DefaultForecastService` to use concrete timestamp bounds (`1970-01-01` to `2099-12-31`) in SQL queries to prevent PostgreSQL parameter type ambiguity errors.
- Updated `MarketService.getMandiById` to gracefully resolve both canonical state-prefixed slugs (`ka-kolar-apmc`) and legacy names (`kolar-apmc`).
- Updated `MarketService.getMandis` to default `page` to `0` when `size` is specified without an explicit page parameter.
- Enhanced `nearby-mandis` page with 30-item dynamic pagination and "Load More" controls.

### Fixed
- Fixed strict coordinate fabrication bug: 2,492 mandis without coordinates are explicitly retained with `NULL` lat/lon and `Coordinates Pending` status badges.
- Fixed flat-line predictions: dynamic autoregressive feature construction in `model_adapter.py` ensures non-flat, bounded 14-day forecast curves.
- Fixed `MarketDetailClient.tsx` runtime hydration crash (`toFixed`) when encountering null coordinates.
- Fixed Playwright selector ambiguity on homepage language vs state selector.

---

## [2.0.0] - 2026-11-23 — Browser QA, Reliability & Prediction History Pass

### Added
- Implemented persistent forecast runs table `forecast_runs` and `forecast_run_items` in PostgreSQL.
- Implemented `/prediction-history` page with inspect dialog for evaluating past model predictions against subsequent actual market observations.
- Implemented full-application localization supporting 6 Indian languages.

### Fixed
- Fixed location modal viewport clipping and z-index positioning issues.
- Fixed Recharts time-axis rendering with continuous historical-to-forecast bridge point on `2026-11-23`.

---

## [1.0.0] - 2026-11-23 — Initial Working Prototype Release

### Added
- Next.js 16 frontend with Tailwind CSS and shadcn/ui.
- Spring Boot 3 backend modular monolith.
- Python FastAPI inference service wrapping `price_lgbm_full_features.pkl`.
- Interactive Leaflet map container.
- Initial 29-mandi prototype geography seed.
