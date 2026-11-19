# Historical Price Observations Ingestion Pipeline — Agri

## 1. High-Throughput Streaming Ingestion

The historical price ingestion engine is implemented in `scripts/ingest_historical_prices.py`.

It streams **1,171,101 rows** from `ALL_CROPS_DATA.csv` and loads them into PostgreSQL `price_observations` table using the high-performance PostgreSQL **`COPY` expert** mechanism.

---

## 2. Ingestion Strategy & Performance Optimization

Loading 1.17 million rows via standard JPA `repository.saveAll()` takes over 25 minutes.

To achieve sub-20 second execution, the script employs a 3-stage optimization:
1. **Pre-Ingestion:** Drop composite secondary indexes on `price_observations`.
2. **Streaming COPY:** Stream sanitized, normalized CSV rows directly into PostgreSQL via an in-memory `StringIO` buffer using `cursor.copy_expert("COPY price_observations (...) FROM STDIN WITH CSV", buffer)`.
3. **Post-Ingestion:** Rebuild composite B-tree indexes (`idx_price_lookup`, `idx_price_unique_obs`).

---

## 3. Ingestion Metrics & Deduplication Audit

| Metric | Measured Value | Verification Method |
|---|---|---|
| **Source Rows Streamed** | `1,171,101` | Line count of `ALL_CROPS_DATA.csv` |
| **Duplicates Dropped** | `34,994` | Deduplicated on `(mandi_id, commodity_id, variety_id, observation_date)` |
| **Unique Rows Inserted** | **`1,136,107`** | `SELECT COUNT(*) FROM price_observations;` |
| **Earliest Observation Date** | `2025-06-12` | `SELECT MIN(observation_date) FROM price_observations;` |
| **Latest Observation Date** | `2026-04-19` | `SELECT MAX(observation_date) FROM price_observations;` |
| **Mandis with Price Data** | **`2,643` (100.0%)** | `SELECT COUNT(DISTINCT mandi_id) FROM price_observations;` |
| **Total Execution Time** | **`15.75 seconds`** | High-throughput streaming benchmark |

Audit record preserved at `scripts/price_reconciliation.json`:
```json
{
  "total_source_rows": 1171101,
  "duplicates_dropped": 34994,
  "total_inserted_rows": 1136107,
  "min_observation_date": "2025-06-12",
  "max_observation_date": "2026-04-19",
  "mandis_with_prices": 2643,
  "commodities_with_prices": 10,
  "execution_time_seconds": 15.75
}
```
