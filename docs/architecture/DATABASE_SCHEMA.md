# Database Schema & Entity Relationships — Agri

## 1. Database Specifications

- **Database Engine:** PostgreSQL 14 (compatible with 15 & 16)
- **Database Name:** `agriforecasting`
- **Default Port:** `5432`
- **Connection URL:** `jdbc:postgresql://localhost:5432/agriforecasting`
- **Dialect:** `org.hibernate.dialect.PostgreSQLDialect`
- **Connection Pool:** HikariCP (`maximum-pool-size: 20`, `minimum-idle: 5`)

---

## 2. Entity-Relationship Diagram

```mermaid
erDiagram
    STATES ||--o{ DISTRICTS : contains
    DISTRICTS ||--o{ MANDIS : contains
    COMMODITIES ||--o{ VARIETIES : classifies
    MANDIS ||--o{ PRICE_OBSERVATIONS : records
    COMMODITIES ||--o{ PRICE_OBSERVATIONS : specifies
    VARIETIES ||--o{ PRICE_OBSERVATIONS : refines
    MANDIS ||--o{ FORECAST_RUNS : generates
    COMMODITIES ||--o{ FORECAST_RUNS : targets
    FORECAST_RUNS ||--o{ FORECAST_RUN_ITEMS : details

    STATES {
        VARCHAR(10) id PK
        VARCHAR(100) name
        VARCHAR(10) code
    }

    DISTRICTS {
        VARCHAR(50) id PK
        VARCHAR(10) state_id FK
        VARCHAR(100) name
    }

    MANDIS {
        VARCHAR(100) id PK
        VARCHAR(50) district_id FK
        VARCHAR(10) state_id FK
        VARCHAR(150) name
        VARCHAR(255) full_name
        DOUBLE_PRECISION latitude
        DOUBLE_PRECISION longitude
        VARCHAR(50) coordinate_source
        VARCHAR(50) coordinate_status
    }

    COMMODITIES {
        VARCHAR(50) id PK
        VARCHAR(100) name
        VARCHAR(50) category
        VARCHAR(20) unit
        VARCHAR(100) slug
    }

    VARIETIES {
        VARCHAR(100) id PK
        VARCHAR(50) commodity_id FK
        VARCHAR(100) name
    }

    PRICE_OBSERVATIONS {
        BIGSERIAL id PK
        VARCHAR(100) mandi_id FK
        VARCHAR(50) commodity_id FK
        VARCHAR(100) variety_id FK
        DATE observation_date
        DOUBLE_PRECISION modal_price
        DOUBLE_PRECISION min_price
        DOUBLE_PRECISION max_price
        DOUBLE_PRECISION arrivals
    }

    FORECAST_RUNS {
        BIGSERIAL id PK
        VARCHAR(100) mandi_id FK
        VARCHAR(150) mandi_name
        VARCHAR(50) commodity_id FK
        VARCHAR(100) commodity_name
        VARCHAR(100) variety_id
        VARCHAR(100) variety_name
        DATE reference_date
        TIMESTAMP generated_at
        INT forecast_horizon
        VARCHAR(50) model_version
        VARCHAR(20) status
        DOUBLE_PRECISION latest_actual_price
        DOUBLE_PRECISION expected_price_7d
        DOUBLE_PRECISION expected_price_14d
        DOUBLE_PRECISION percentage_change_14d
        VARCHAR(20) expected_direction
    }

    FORECAST_RUN_ITEMS {
        BIGSERIAL id PK
        BIGINT forecast_run_id FK
        INT day_index
        DATE target_date
        DOUBLE_PRECISION predicted_price
        DOUBLE_PRECISION min_price
        DOUBLE_PRECISION max_price
        DOUBLE_PRECISION percentage_change_from_reference
        DOUBLE_PRECISION actual_price
    }
```

---

## 3. Physical DDL & Index Strategy

The schema is created via `scripts/create_schema.sql`:

```sql
-- Composite performance indexes for sub-millisecond retrieval

-- 1. Historical Prices (1.136M records)
CREATE INDEX idx_price_lookup 
    ON price_observations(mandi_id, commodity_id, observation_date DESC);

CREATE UNIQUE INDEX idx_price_unique_obs 
    ON price_observations(mandi_id, commodity_id, variety_id, observation_date);

-- 2. Mandi Geography & Search
CREATE INDEX idx_mandis_state_district 
    ON mandis(state_id, district_id);

CREATE INDEX idx_mandis_coords 
    ON mandis(latitude, longitude) WHERE latitude IS NOT NULL;

CREATE INDEX idx_mandis_name_trgm 
    ON mandis USING btree (LOWER(name));

-- 3. Forecast Runs & Items
CREATE INDEX idx_forecast_runs_lookup 
    ON forecast_runs(mandi_id, commodity_id, variety_id, reference_date);

CREATE INDEX idx_forecast_runs_gen 
    ON forecast_runs(generated_at DESC);

CREATE INDEX idx_forecast_run_items_parent 
    ON forecast_run_items(forecast_run_id, day_index);
```

---

## 4. Current Database Row Counts & Audit

Verified directly against PostgreSQL `localhost:5432/agriforecasting`:

| Table | Live Row Count | Ingestion Method | Notes |
|---|---|---|---|
| `states` | **30** | `ingest_national_geography.py` | 100% of Indian states and UTs in dataset |
| `districts` | **913** | `ingest_national_geography.py` | Hierarchical mapping from source records |
| `mandis` | **2,643** | `ingest_national_geography.py` | 2,548 verified geocoded (96.4%); 95 NULL coords |
| `commodities` | **15** | `ingest_national_geography.py` | Major cereal, pulse, vegetable, and oilseed crops |
| `varieties` | **262** | `ingest_national_geography.py` | Full botanical variety mapping |
| `price_observations` | **1,136,107** | `ingest_historical_prices.py` | 100% covered across all 2,643 mandis |
| `forecast_runs` | Dynamic | Application Runtime | Persistent forecast audit history |
| `forecast_run_items`| Dynamic | Application Runtime | Exactly 14 daily rows per forecast run |
