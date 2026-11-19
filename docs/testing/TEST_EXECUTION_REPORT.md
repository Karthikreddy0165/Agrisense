# Test Execution Report — Agri

## 1. Executive Summary

| Test Layer | Test Runner / Tool | Tests Executed | Passed | Failed | Execution Time | Status |
|---|---|---|---|---|---|---|
| **Backend Unit Tests** | JUnit 5 / Maven Surefire | 12 | **12** | 0 | 8.01s | ✅ **PASS** |
| **Python Model Tests** | Pytest 9.2.0 | 4 | **4** | 0 | 2.09s | ✅ **PASS** |
| **Frontend Typecheck** | TypeScript 5 (`tsc --noEmit`) | 16 routes | **16/16** | 0 | 1.67s | ✅ **PASS** |
| **REST API Verification**| Python `urllib` Suite | 22 | **22** | 0 | 1.84s | ✅ **PASS** |
| **Browser QA Suite** | Playwright (Chrome) | 10 flows | **10** | 0 | 44.5s | ✅ **PASS** |
| **Total Test Battery** | - | **64** | **64** | **0** | **~58s** | ✅ **100% PASS** |

---

## 2. Backend Unit Test Details (Maven Surefire)

Command: `mvn test` in `/Users/karthikreddy/Desktop/Agri/backend`

```text
[INFO] Running com.agriforecasting.forecast.service.ForecastServiceTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.591 s
[INFO] Running com.agriforecasting.ratelimit.RateLimiterTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.192 s
[INFO] Running com.agriforecasting.common.GeoUtilsTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.003 s
[INFO] Running com.agriforecasting.comparison.service.ComparisonServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.046 s
[INFO] Running com.agriforecasting.AgriForecastingApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 5.984 s
[INFO] 
[INFO] Results:
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 3. Python Inference Model Tests (Pytest)

Command: `PYTHONPATH=. pytest tests/ -v` in `/Users/karthikreddy/Desktop/Agri/model-service`

```text
tests/test_model_service.py::test_health PASSED                          [ 25%]
tests/test_model_service.py::test_ready PASSED                           [ 50%]
tests/test_model_service.py::test_14_day_forecast PASSED                 [ 75%]
tests/test_model_service.py::test_invalid_horizon PASSED                 [100%]
========================= 4 passed, 1 warning in 2.09s =========================
```
