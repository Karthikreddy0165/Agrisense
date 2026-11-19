# Playwright Browser QA Report — Agri

## 1. Test Environment & Suite Configuration

- **Suite File:** `/Users/karthikreddy/Desktop/Agri/tests/browser_qa_v3.py`
- **Execution Engine:** Playwright Chromium (Headless)
- **Viewport Sizes:** Desktop (1280x800), Mobile (375x667 iPhone Viewport)
- **Target URL:** `http://localhost:3000`
- **Backend API:** `http://localhost:8080` (Spring Boot connected to PostgreSQL & FastAPI)

---

## 2. Test Execution Results (10/10 Passed)

| Flow # | Test Identifier | Target Workflow & Assertion | Status | Visual Evidence File |
|---|---|---|---|---|
| **1** | `test_1_home_cascade` | Homepage 3-tier geography selector; loaded 30 states; selected Rajasthan (`rj`) with 72 dynamic districts loaded. | ✅ **PASSED** | `screenshots/national_01_home_rajasthan_cascade.png` |
| **2** | `test_2_location_modal` | Location modal opened; loaded 31 state options; selected Punjab (`pb`) with 63 districts; applied selection; header updated. | ✅ **PASSED** | `screenshots/national_02_location_modal_punjab.png` |
| **3** | `test_3_nearby_mandis` | Nearby Mandis page loaded; verified header `2643 of 2643 mandis across 30 States`; verified `Coordinates Pending` badges; verified Leaflet container. | ✅ **PASSED** | `screenshots/national_03_nearby_mandis_national.png` |
| **4** | `test_4_search_mandi` | Searched for `Khanna`; verified immediate card matching Khanna APMC (Ludhiana, Punjab). | ✅ **PASSED** | `screenshots/national_04_search_khanna.png` |
| **5** | `test_5_market_profile` | Navigated to `/market/ka-kolar-apmc?commodity=tomato`; verified modal price `₹1,000` from PostgreSQL; verified Recharts trend chart. | ✅ **PASSED** | `screenshots/national_05_kolar_market_profile.png` |
| **6** | `test_6_14day_forecast` | Navigated to `/forecast`; verified 14-day horizon `24 Nov – 07 Dec 2026`; verified non-flat curve; verified 42 table cells with prices. | ✅ **PASSED** | `screenshots/national_06_14day_forecast.png` |
| **7** | `test_7_prediction_history` | Navigated to `/prediction-history`; verified persisted forecast run records for Kolar with model version `LightGBM-AgriPrice-v1`. | ✅ **PASSED** | `screenshots/national_07_prediction_history.png` |
| **8** | `test_8_compare` | Navigated to `/compare`; verified multi-market comparison chart and price differential cards across state APMCs. | ✅ **PASSED** | `screenshots/national_08_market_comparison.png` |
| **9** | `test_9_saved` | Navigated to `/saved`; verified client-side watchlist persistence and quick-action navigation buttons. | ✅ **PASSED** | `screenshots/national_09_saved_watchlist.png` |
| **10** | `test_10_mobile_toggle` | Mobile viewport (375x667); verified mobile layout, default list view, and responsive `Map View` toggle button. | ✅ **PASSED** | `screenshots/national_10_mobile_map_toggle.png` |

---

## 3. Playwright Log Output

```text
=== Starting Browser QA V3: National Scale Mandi Geography Verification ===

--- Test 1: Home Page & Dynamic Geography Cascade ---
Total states in homepage dropdown: 30
Rajasthan districts loaded: 72 (e.g. ['Ajmer', 'Alwar', 'Anupgarh'])
Rajasthan mandis loaded: 2 (e.g. ['Ajmer(F&V) APMC', 'Madanganj Kishangarh APMC'])
Captured: national_01_home_rajasthan_cascade.png

--- Test 2: Location Modal Dynamic Cascade ---
Modal state options: 31
Modal Punjab districts: 63
Captured: national_02_location_modal_punjab.png
Header location after apply: PunjabChange Location...

--- Test 3: Nearby Mandis Page & National Geography ---
Nearby mandis count text: Using manual location: Punjab (Saved) • Showing 2643 of 2643 mandis across 30 States
Mandis with 'Coordinates Pending' badge displayed in initial view: 25
Captured: national_03_nearby_mandis_national.png

--- Test 4: Search Mandi by Name ---
Cards found matching 'Khanna': 1
Captured: national_04_search_khanna.png

--- Test 5: Mandi Profile with PostgreSQL Historical Prices ---
Kolar APMC modal price displayed: ₹1,000
Captured: national_05_kolar_market_profile.png

--- Test 6: 14-Day Price Forecast Generation ---
Forecast daily prediction table entries: 42
Captured: national_06_14day_forecast.png

--- Test 7: Prediction History Verification ---
Prediction history records for Kolar: 4
Captured: national_07_prediction_history.png

--- Test 8: Market Comparison Across States ---
Comparison chart containers: 1
Captured: national_08_market_comparison.png

--- Test 9: Saved Markets Watchlist ---
Captured: national_09_saved_watchlist.png

--- Test 10: Mobile Responsiveness & List/Map Toggle ---
Captured: national_10_mobile_map_toggle.png

=== QA Test Results Summary ===
  test_1_home_cascade: PASSED
  test_2_location_modal: PASSED
  test_3_nearby_mandis: PASSED
  test_4_search_mandi: PASSED
  test_5_market_profile: PASSED
  test_6_14day_forecast: PASSED
  test_7_prediction_history: PASSED
  test_8_compare: PASSED
  test_9_saved: PASSED
  test_10_mobile_toggle: PASSED

ALL 10 QA SUITE FLOWS PASSED SUCCESSFULLY!
```
