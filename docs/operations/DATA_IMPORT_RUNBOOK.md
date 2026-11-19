# National Data Import Runbook — Agri

## 1. Overview & Source Prerequisite

Before executing data imports, ensure that the upstream research dataset exists at `/Users/karthikreddy/Desktop/Hybrid-AgriPrice-Forecaster` (or provide the updated CSV path via environment variables).

---

## 2. Ingestion Execution Order

Imports must strictly be executed in this order to respect foreign key constraints:

### Step 1: Geography Ingestion
```bash
/tmp/agri_test_venv/bin/python3 /Users/karthikreddy/Desktop/Agri/scripts/ingest_national_geography.py
```
- Ingests `states`, `districts`, `mandis`, `commodities`, and `varieties`.
- Reconciles 30 states, 913 districts, 2,643 mandis.
- Preserves 151 verified geocoded mandis and assigns `NULL` coordinates to 2,492 pending mandis.
- Validates against `scripts/geography_reconciliation.json`.

### Step 2: Historical Prices Streaming Ingestion
```bash
/tmp/agri_test_venv/bin/python3 /Users/karthikreddy/Desktop/Agri/scripts/ingest_historical_prices.py
```
- Drops secondary indexes for high-speed streaming.
- Streams 1,171,101 rows; deduplicates 34,994 duplicates.
- Inserts 1,136,107 clean records in ~16 seconds.
- Automatically recreates composite indexes.
- Validates against `scripts/price_reconciliation.json`.

---

## 3. Idempotency & Re-run Safety

Both ingestion scripts are **idempotent**:
- `ingest_national_geography.py` uses `ON CONFLICT (id) DO UPDATE ...`.
- `ingest_historical_prices.py` clears existing observations if invoked with `--force` or truncates cleanly before re-streaming.
- Backend `DataInitializer.java` automatically detects if `mandiRepository.count() > 0` on startup and skips seed insertion, preventing double-seeding.
