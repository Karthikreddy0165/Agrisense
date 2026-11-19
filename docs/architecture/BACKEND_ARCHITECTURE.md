# Backend Architecture — Agri

## 1. Architectural Style & Principles

The backend is built as a **modular monolith** in Spring Boot 3.3.5 running on Java 17/21 LTS.

Key Design Principles:
1. **Modular Domain Packages:** Feature-based package packaging (`market`, `price`, `forecast`, `comparison`, `commodity`, `ratelimit`).
2. **Layered Separation:** `Controller` ➔ `Service` ➔ `Repository` ➔ `Entity`.
3. **Constructor Injection:** All Spring components use explicit constructor injection for immutability and easy testability.
4. **DTO Immutability:** Java records and DTOs enforce immutable data transfer across API boundaries.
5. **Centralized Error Handling:** `@RestControllerAdvice` translates unchecked domain exceptions into standard `ApiResponse<T>` error payloads with consistent timestamps.

---

## 2. Package & Module Structure

```text
backend/src/main/java/com/agriforecasting/
├── AgriForecastingApplication.java       # Main entry point & Banner
│
├── config/                               # Application configurations
│   ├── DataInitializer.java              # Database bootstrapper (skips if DB already populated)
│   ├── ForecastConfig.java               # Global reference date (2026-11-23), horizon (14)
│   ├── RestClientConfig.java             # HTTP client for Python model service with timeouts
│   └── WebConfig.java                    # CORS, Rate limiting interceptor registration
│
├── common/                               # Cross-cutting utilities
│   ├── ApiResponse.java                  # Standard {success, message, data, timestamp} envelope
│   ├── GeoUtils.java                     # Haversine distance calculations
│   └── GlobalExceptionHandler.java       # Centralized HTTP 400, 404, 429, 500 translation
│
├── market/                               # Geography & APMC directory
│   ├── domain/                           # State, District, Mandi JPA entities
│   ├── repository/                       # MandiRepository (paged search, filter, geocoded query)
│   ├── service/                          # MarketService (caching, DTO mapping, distance sorting)
│   └── controller/                       # MarketController (/states, /districts, /mandis)
│
├── commodity/                            # Agricultural crops & varieties
│   ├── domain/                           # Commodity, Variety JPA entities
│   ├── repository/                       # CommodityRepository, VarietyRepository
│   ├── service/                          # CommodityService
│   └── controller/                       # CommodityController (/commodities, /{id}, /{id}/varieties)
│
├── price/                                # Physical market price transactions
│   ├── domain/                           # PriceObservation JPA entity (1.136M records)
│   ├── repository/                       # PriceObservationRepository (chronological queries, latest)
│   ├── service/                          # PriceService (summaries, volatility, latest modal)
│   └── controller/                       # PriceController (/prices, /prices/history, /prices/summary)
│
├── forecast/                             # 14-day price forecasting pipeline
│   ├── domain/                           # ForecastRun, ForecastRunItem JPA entities
│   ├── repository/                       # ForecastRunRepository, ForecastRunItemRepository
│   ├── client/                           # PythonModelClient (FastAPI HTTP adapter)
│   ├── service/                          # DefaultForecastService (orchestrator, persistence, audit)
│   └── controller/                       # ForecastController (/forecasts, /forecasts/history)
│
├── comparison/                           # Cross-mandi comparative analysis
│   ├── dto/                              # ComparisonResponse, MandiComparisonItem
│   ├── service/                          # ComparisonService (max 5 mandis rule, spread calculation)
│   └── controller/                       # ComparisonController (/comparisons)
│
└── ratelimit/                            # Sliding-window rate limiting engine
    ├── RateLimitFilter.java              # HttpServletRequest filter extracting client IP
    ├── RateLimiter.java                  # Core interface
    ├── RedisSlidingWindowRateLimiter.java# Redis + Lua script implementation
    └── InMemorySlidingWindowRateLimiter.java # Local development concurrent sliding window
```

---

## 3. Core Business Services

### 1. `MarketService`
- Handles national mandi lookups across all 30 states and 913 districts.
- Implements flexible pagination:
  ```java
  if (size != null && size > 0) {
      int pageNum = (page != null && page >= 0) ? page : 0;
      Pageable pageable = PageRequest.of(pageNum, size, Sort.by("name").ascending());
      return mandiRepository.searchMandis(stateId, districtId, hasCoordinates, search, pageable).getContent();
  }
  ```
- Implements dual lookup in `getMandiById`: checks exact canonical slug (e.g. `ka-kolar-apmc`), falling back to name/search matches if legacy unprefixed IDs are passed.

### 2. `DefaultForecastService`
- **Orchestration Flow:**
  1. Checks recent cached run in `forecast_runs` (within last 15 mins for same mandi/commodity/refDate).
  2. If absent, loads 30-day historical prices from `price_observations`.
  3. Prepares `ForecastRequest` with fixed reference date `2026-11-23` and horizon `14`.
  4. Calls `PythonModelClient.predict(request)` over internal HTTP.
  5. Persists the generated run and 14 items to `forecast_runs` and `forecast_run_items`.
  6. Returns structured `ForecastResponse`.

### 3. `ComparisonService`
- Enforces hard limit: `if (mandiIds.size() > 5) throw new IllegalArgumentException("Maximum 5 mandis permitted.");`.
- Fetches parallel forecasts and historical prices for each market.
- Computes price differential matrices, identifying the most lucrative market for farmers.
