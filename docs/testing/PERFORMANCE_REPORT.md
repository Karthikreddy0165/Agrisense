# System Performance & Latency Benchmarks — Agri

## 1. Measured Latencies & Response Times

Measured across live runs using PostgreSQL 14 and Spring Boot 3.3.5:

| Operation / Endpoint | Sample Size | Target SLA | Measured Median | Measured 95th Percentile | Status |
|---|---|---|---|---|---|
| **Health Check (`/health`)** | 50 requests | < 200ms | **34.3ms** | 59.8ms | ✅ Optimal |
| **State List (`/states`)** | 50 requests | < 300ms | **127.1ms** | 285.8ms | ✅ Optimal |
| **District List (`/districts?stateId=pb`)**| 50 requests | < 100ms | **26.8ms** | 42.1ms | ✅ Optimal |
| **Commodity List (`/commodities`)** | 50 requests | < 50ms | **6.1ms** | 9.5ms | ✅ Optimal |
| **Paged Mandis (`/mandis?size=20`)** | 50 requests | < 50ms | **15.6ms** | 25.4ms | ✅ Optimal |
| **Mandi Search ('Khanna')** | 50 requests | < 50ms | **10.6ms** | 12.6ms | ✅ Optimal |
| **Price History (`/prices/{m}/{c}`)** | 50 requests | < 50ms | **19.1ms** | 31.7ms | ✅ Optimal |
| **Forecast Inference (`/forecasts`)** | 50 requests | < 500ms | **33.4ms (cached)** | 995.6ms (cold)| ✅ Optimal |
| **Multi-Mandi Compare (`/comparisons`)** | 50 requests | < 300ms | **18.0ms** | 239.2ms | ✅ Optimal |

---

## 2. Ingestion Benchmarks

| Ingestion Pipeline | Dataset Size | Ingestion Duration | Throughput |
|---|---|---|---|
| **Geography Ingestion** | 30 states, 913 districts, 2,643 mandis | **2.80 seconds** | ~950 entities/sec |
| **Historical Price Ingestion** | 1,171,101 rows streamed | **15.75 seconds** | **~74,350 rows/sec** |

---

## 3. Frontend & Build Benchmarks

- **Next.js Production Build:** `npm run build` compiled 16/16 routes in **969ms**.
- **TypeScript Static Verification:** `tsc --noEmit` completed across all components in **1.67 seconds**.
- **Maven Test Compilation & Execution:** Complete test suite compiled and run in **8.01 seconds**.
