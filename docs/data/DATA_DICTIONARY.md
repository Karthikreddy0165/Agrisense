# Data Dictionary — Agri

This document defines all entities, fields, data types, constraints, and business semantics across the Agri platform.

---

## 1. Geography Entities

### `states`
| Column Name | SQL Data Type | Nullable | Primary / Foreign Key | Description | Example |
|---|---|---|---|---|---|
| `id` | `VARCHAR(10)` | NO | PK | ISO/canonical 2-letter state identifier | `ka`, `pb`, `rj` |
| `name` | `VARCHAR(100)` | NO | - | Full state or union territory name | `Karnataka`, `Punjab` |
| `code` | `VARCHAR(10)` | NO | - | Official 2-letter postal code | `KA`, `PB`, `RJ` |

### `districts`
| Column Name | SQL Data Type | Nullable | Primary / Foreign Key | Description | Example |
|---|---|---|---|---|---|
| `id` | `VARCHAR(50)` | NO | PK | Composite slug (`state_id-district_slug`) | `ka-kolar`, `pb-ludhiana` |
| `state_id` | `VARCHAR(10)` | NO | FK ➔ `states(id)` | Parent state identifier | `ka` |
| `name` | `VARCHAR(100)` | NO | - | District administrative name | `Kolar`, `Ludhiana` |

### `mandis`
| Column Name | SQL Data Type | Nullable | Primary / Foreign Key | Description | Example |
|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | PK | Canonical slug (`state_id-mandi_slug`) | `ka-kolar-apmc`, `pb-khanna-apmc` |
| `district_id` | `VARCHAR(50)` | NO | FK ➔ `districts(id)` | District identifier | `ka-kolar` |
| `state_id` | `VARCHAR(10)` | NO | FK ➔ `states(id)` | State identifier | `ka` |
| `name` | `VARCHAR(150)` | NO | - | Display name of the APMC market | `Kolar APMC` |
| `full_name` | `VARCHAR(255)` | YES | - | Full descriptive market name with location | `Kolar APMC, Kolar, Karnataka` |
| `latitude` | `DOUBLE PRECISION`| YES | - | WGS84 Latitude (NULL if unresolved) | `13.1367` or `NULL` |
| `longitude`| `DOUBLE PRECISION`| YES | - | WGS84 Longitude (NULL if unresolved) | `78.1292` or `NULL` |
| `coordinate_source`| `VARCHAR(50)` | NO | - | Coordinate origin (`VERIFIED_SEED`, `GEOCODED`, `UNRESOLVED`) | `VERIFIED_SEED` |
| `coordinate_status`| `VARCHAR(50)` | NO | - | Integrity status (`VERIFIED`, `UNRESOLVED`) | `VERIFIED`, `UNRESOLVED` |

---

## 2. Commodity Entities

### `commodities`
| Column Name | SQL Data Type | Nullable | Primary / Foreign Key | Description | Example |
|---|---|---|---|---|---|
| `id` | `VARCHAR(50)` | NO | PK | Normalized commodity slug | `tomato`, `onion`, `wheat` |
| `name` | `VARCHAR(100)` | NO | - | Common English display name | `Tomato`, `Wheat` |
| `category` | `VARCHAR(50)` | NO | - | Agricultural classification | `vegetables`, `cereals`, `pulses` |
| `unit` | `VARCHAR(20)` | NO | - | Standard quotation unit | `₹/quintal` |
| `slug` | `VARCHAR(100)` | NO | - | URL-safe slug | `tomato` |

### `varieties`
| Column Name | SQL Data Type | Nullable | Primary / Foreign Key | Description | Example |
|---|---|---|---|---|---|
| `id` | `VARCHAR(100)` | NO | PK | Unique variety identifier | `tomato-hybrid`, `wheat-sharbati` |
| `commodity_id` | `VARCHAR(50)` | NO | FK ➔ `commodities(id)`| Parent crop identifier | `tomato` |
| `name` | `VARCHAR(100)` | NO | - | Cultivar / trade name | `Hybrid`, `Deshi`, `Sharbati` |

---

## 3. Transaction & Forecast Entities

### `price_observations`
| Column Name | SQL Data Type | Nullable | Primary / Foreign Key | Description | Example |
|---|---|---|---|---|---|
| `id` | `BIGSERIAL` | NO | PK | Auto-incrementing identifier | `1`, `2` |
| `mandi_id` | `VARCHAR(100)` | NO | FK ➔ `mandis(id)` | Mandi identifier | `ka-kolar-apmc` |
| `commodity_id` | `VARCHAR(50)` | NO | FK ➔ `commodities(id)`| Commodity identifier | `tomato` |
| `variety_id` | `VARCHAR(100)` | NO | FK ➔ `varieties(id)` | Variety identifier | `tomato-hybrid` |
| `observation_date`| `DATE` | NO | - | Date transaction recorded | `2026-04-19` |
| `modal_price` | `DOUBLE PRECISION`| NO | - | Most common transaction price (₹/qtl)| `1850.0` |
| `min_price` | `DOUBLE PRECISION`| NO | - | Minimum reported price for the day | `1650.0` |
| `max_price` | `DOUBLE PRECISION`| NO | - | Maximum reported price for the day | `2050.0` |
| `arrivals` | `DOUBLE PRECISION`| YES | - | Volume of arrivals (Metric Tonnes) | `85.0` |

### `forecast_runs`
| Column Name | SQL Data Type | Nullable | Primary / Foreign Key | Description | Example |
|---|---|---|---|---|---|
| `id` | `BIGSERIAL` | NO | PK | Forecast run identifier | `101` |
| `mandi_id` | `VARCHAR(100)` | NO | FK ➔ `mandis(id)` | Target market | `ka-kolar-apmc` |
| `commodity_id` | `VARCHAR(50)` | NO | FK ➔ `commodities(id)`| Target crop | `tomato` |
| `variety_id` | `VARCHAR(100)` | NO | - | Target cultivar | `tomato-hybrid` |
| `reference_date`| `DATE` | NO | - | Fixed evaluation anchor | `2026-11-23` |
| `generated_at` | `TIMESTAMP` | NO | - | Creation timestamp | `2026-11-23 16:05:31` |
| `forecast_horizon`| `INT` | NO | - | Number of days forecast | `14` |
| `model_version` | `VARCHAR(50)` | NO | - | Inference model version | `LightGBM-AgriPrice-v1` |
| `status` | `VARCHAR(20)` | NO | - | Execution status | `SUCCESS` |
| `latest_actual_price`| `DOUBLE PRECISION`| NO | - | Reference anchor price | `1000.0` |
| `expected_price_7d` | `DOUBLE PRECISION`| NO | - | Day 7 projected modal price | `1060.0` |
| `expected_price_14d`| `DOUBLE PRECISION`| NO | - | Day 14 projected modal price| `1120.0` |
| `percentage_change_14d`| `DOUBLE PRECISION`| NO| - | Projected 14-day % trajectory| `12.0` |
| `expected_direction` | `VARCHAR(20)` | NO | - | Direction classification | `Rising`, `Falling`, `Stable` |
