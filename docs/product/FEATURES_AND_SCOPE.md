# Features Matrix & Scope Boundaries — Agri

## 1. Traceability & Implementation Status Matrix

| ID | Feature / Component | Category | Owner Status | Implemented | Automated Test | Browser QA | Verification State |
|---|---|---|---|---|---|---|---|
| **FEAT-01** | Homepage & Crop Discovery | Frontend | `[DECIDED]` | Yes | `tsc --noEmit` | Test 1 | `[VERIFIED]` |
| **FEAT-02** | Location Modal 3-tier Cascade | Frontend / API | `[DECIDED]` | Yes | `test_api_suite.py` | Test 2 | `[VERIFIED]` |
| **FEAT-03** | Nearby Mandis Map + List View | Frontend / Geo | `[DECIDED]` | Yes | `GeoUtilsTest.java` | Test 3 | `[VERIFIED]` |
| **FEAT-04** | National Mandi Search (Name, City) | Backend / UI | `[DECIDED]` | Yes | `test_api_suite.py` | Test 4 | `[VERIFIED]` |
| **FEAT-05** | Mandi Market Profile ("My Market") | Frontend / API | `[DECIDED]` | Yes | `test_api_suite.py` | Test 5 | `[VERIFIED]` |
| **FEAT-06** | 14-Day Price Forecast Generation | ML / Backend | `[DECIDED]` | Yes | `ForecastServiceTest.java` | Test 6 | `[VERIFIED]` |
| **FEAT-07** | Forecast Persistence & Audit History | Database / UI | `[DECIDED]` | Yes | `test_api_suite.py` | Test 7 | `[VERIFIED]` |
| **FEAT-08** | Multi-Market Comparison (max 5) | Business Logic | `[DECIDED]` | Yes | `ComparisonServiceTest.java`| Test 8 | `[VERIFIED]` |
| **FEAT-09** | Saved Markets Watchlist (localStorage)| Storage / UI | `[DECIDED]` | Yes | `tsc --noEmit` | Test 9 | `[VERIFIED]` |
| **FEAT-10** | Mobile Responsive & Dual Toggle | UI / Layout | `[DECIDED]` | Yes | `tsc --noEmit` | Test 10 | `[VERIFIED]` |
| **FEAT-11** | Application-wide i18n (6 Languages)| UI / Context | `[DECIDED]` | Yes | `tsc --noEmit` | Tested (Hi, Ta) | `[VERIFIED]` |
| **FEAT-12** | Sliding-Window Rate Limiter (IP) | Security / API | `[DECIDED]` | Yes | `RateLimiterTest.java` | Verified in API | `[VERIFIED]` |
| **FEAT-13** | Coordinate Pending Policy (No fake GPS)| Data Policy | `[DECIDED]` | Yes | `ingest_geography.py` | Test 3 | `[VERIFIED]` |
| **FEAT-14** | 1.136M Historical Price Observations | Database | `[DECIDED]` | Yes | `ingest_prices.py` | Test 5 | `[VERIFIED]` |

---

## 2. Explicit Scope Exclusions `[DECIDED, REQUIRES OWNER APPROVAL]`

The following capabilities were explicitly evaluated and rejected by the Product Owner to protect focus, simplicity, and performance:

1. **User Authentication & Accounts:**
   - *Exclusion Reason:* High friction for farmers in rural settings; passwords, email confirmations, or OTPs discourage immediate price discovery.
   - *Approved Alternative:* Saved markets are persisted frictionlessly in browser `localStorage`.
2. **Agronomic Crop Recommendations:**
   - *Exclusion Reason:* Soil science, rainfall forecasting, and seed variety recommendations are distinct domains; Agri is strictly a price intelligence platform.
3. **Fertilizer & Pesticide Advisory:**
   - *Exclusion Reason:* Commercially biased agrochemical advice dilutes neutrality and trustworthiness.
4. **Payment Gateways & Subscriptions:**
   - *Exclusion Reason:* Agri is an open public utility platform designed for maximum accessibility.
5. **Admin Portals & CMS Overheads:**
   - *Exclusion Reason:* Increases attack surface without providing value to the core farmer persona.
6. **Microservices / Kubernetes Mesh:**
   - *Exclusion Reason:* Architectural over-engineering; a clean modular monolith in Spring Boot + FastAPI runs faster, uses less memory, and costs less to host.
7. **Automated Scraping Cron Jobs at this Stage:**
   - *Exclusion Reason:* Upstream government portal structures fluctuate; data ingestion is performed via verified, idempotent batch scripts.
8. **Automated MLOps Retraining Pipelines:**
   - *Exclusion Reason:* Untested automated retraining can introduce catastrophic distribution drift; model weights remain frozen and audited.
