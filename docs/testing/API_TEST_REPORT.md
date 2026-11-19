# REST API Test Report — Agri

## 1. Test Suite Configuration

- **Suite File:** `tests/test_api_suite.py`
- **Target URL:** `http://localhost:8080/api/v1`
- **Scope:** 22 Automated test assertions covering all 15 controller endpoints, rate limit headers, query parameters, path variables, error cases, and latency benchmarks.

---

## 2. Test Execution Results (22/22 Passed)

```text
=====================================================================
  AgriForecasting API Comprehensive Verification Suite
  Target: http://localhost:8080/api/v1
=====================================================================
[PASS] Health Check                                  | HTTP 200 |  149.9ms | RL-Rem: None
[PASS] List States (All 30)                          | HTTP 200 |  285.8ms | RL-Rem: 59
[PASS] List Districts for Punjab                     | HTTP 200 |   26.8ms | RL-Rem: 58
[PASS] List Districts for Rajasthan                  | HTTP 200 |    5.6ms | RL-Rem: 57
[PASS] List Commodities                              | HTTP 200 |    6.2ms | RL-Rem: 56
[PASS] Get Commodity Details (Tomato)                | HTTP 200 |    9.5ms | RL-Rem: 55
[PASS] Get Commodity Details (Invalid ID)            | HTTP 404 |    3.7ms | RL-Rem: 54
[PASS] Mandi List Default Page                       | HTTP 200 |   25.4ms | RL-Rem: 53
[PASS] Mandi Filter by State (Punjab)                | HTTP 200 |    9.7ms | RL-Rem: 52
[PASS] Mandi Search by Name ('Khanna')               | HTTP 200 |   10.6ms | RL-Rem: 51
[PASS] Mandi Filter Geocoded Only                    | HTTP 200 |    7.6ms | RL-Rem: 50
[PASS] Get Specific Mandi (Kolar APMC)               | HTTP 200 |    4.0ms | RL-Rem: 49
[PASS] Get Specific Mandi (Legacy ID fallback)       | HTTP 200 |    8.3ms | RL-Rem: 48
[PASS] Get Non-existent Mandi                        | HTTP 404 |    7.7ms | RL-Rem: 47
[PASS] Nearby Mandis within 50km                     | HTTP 200 |   39.1ms | RL-Rem: 29
[PASS] Price History (Kolar Tomato 30d)              | HTTP 200 |   19.1ms | RL-Rem: 46
[PASS] Price History Summary                         | HTTP 200 |    8.0ms | RL-Rem: 45
[PASS] Price Latest Observation                      | HTTP 200 |    4.9ms | RL-Rem: 44
[PASS] Generate 14-Day Forecast (Kolar Tomato)       | HTTP 200 |   33.4ms | RL-Rem: 43
[PASS] Forecast History Retrieval                    | HTTP 200 |   11.1ms | RL-Rem: 42
[PASS] Compare Markets (2 Mandis)                    | HTTP 200 |   18.0ms | RL-Rem: 41
[PASS] Compare Markets (Exceeds 5 Mandis Limit)      | HTTP 400 |    3.5ms | RL-Rem: 40
=====================================================================
  Summary: 22 Passed, 0 Failed out of 22 tests.
=====================================================================
```
