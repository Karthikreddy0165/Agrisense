# Technical Implementation Details — Agri

## 1. Modular Monolith Architecture

The Java backend (`backend/src/main/java/com/agriforecasting`) is designed as a modular monolith:

### Key Design Patterns Used:
- **Repository Pattern:** Spring Data JPA repositories abstract database interactions.
- **Service Layer Pattern:** Encapsulates business logic, DTO transformations, and transaction boundaries (`@Transactional(readOnly = true)`).
- **Adapter Pattern:** `PythonModelClient` encapsulates HTTP communication with the Python FastAPI inference service.
- **Strategy Pattern:** `RateLimiter` interface implemented by `RedisSlidingWindowRateLimiter` (production) and `InMemorySlidingWindowRateLimiter` (development).
- **Controller Advice Pattern:** `GlobalExceptionHandler` converts exceptions to structured `ApiResponse<T>` objects.

---

## 2. Request Lifecycle: Browser to Database

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Browser Client
    participant Filter as RateLimitFilter
    participant Controller as MarketController
    participant Service as MarketService
    participant Repo as MandiRepository
    participant DB as PostgreSQL

    Farmer->>Filter: GET /api/v1/mandis?stateId=pb&size=20
    Filter->>Filter: Check IP quota in sliding window
    alt Quota Exceeded
        Filter-->>Farmer: HTTP 429 Too Many Requests
    else Quota Available
        Filter->>Controller: Forward request
        Controller->>Service: getMandis(stateId='pb', size=20)
        Service->>Repo: searchMandis('pb', PageRequest.of(0, 20))
        Repo->>DB: SELECT * FROM mandis WHERE state_id='pb' ORDER BY name ASC LIMIT 20
        DB-->>Repo: 20 Mandi entities
        Repo-->>Service: Page<Mandi>
        Service->>Service: Map to MandiDto list
        Service-->>Controller: List<MandiDto>
        Controller-->>Farmer: HTTP 200 OK + ApiResponse envelope + RateLimit headers
    end
```

---

## 3. Data Transformation & DTO Isolation

Entities (`Mandi`, `PriceObservation`, `ForecastRun`) never leak directly to API consumers.

Every service uses explicit DTO mapping:
- `toDto(mandi, userLat, userLon, commodityId)`
- `PriceObservationDto(id, mandiId, commodityId, varietyId, observationDate, modalPrice, minPrice, maxPrice, arrivals)`
- `ForecastPredictionDto(date, modalPrice, minPrice, maxPrice, percentageChangeFromReference)`

This guarantees backward compatibility if internal database column structures evolve.
