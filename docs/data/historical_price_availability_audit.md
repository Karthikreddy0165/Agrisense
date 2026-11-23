# Agri — National Mandi Price Data Availability & Coverage Audit

**Date of Audit:** 24 November 2026  
**Authoritative Database:** PostgreSQL `agriforecasting`  
**Dataset Source:** `ALL_CROPS_DATA.csv` & `hierarchy_map.csv` (1,171,101 transactions)

---

## 1. Executive Summary

| Metric | Database Count | Notes |
|---|---|---|
| **Total Registered Mandis** | **2,643** | Covers 30 Indian States & UTs across 500+ districts |
| **Mandis with Historical Observations** | **2,643** (100.0%) | Every single registered mandi has records for &ge; 1 commodity |
| **Total Historical Price Observations** | **1,136,107** | Fully indexed in `price_observations` table |
| **Observation Date Range** | **12 June 2025 &rarr; 19 April 2026** | Real agricultural market transaction observations |
| **Commodities Catalogued** | **10 Crops** | Onion, Potato, Tomato, Wheat, Green Chilli, Banana, Rice, Groundnut, Watermelon, Red Chili |
| **Varieties Catalogued** | **252 Varieties** | Including Hybrid, Local, Desi, Organic, and Grade classifications |

---

## 2. Root Cause Analysis: Why Some Mandis Show Prices and Others Do Not

### The Core Finding
A common misconception was that some mandis have "missing data" or "ingestion failures" because opening them showed "Price pending" or an empty chart.

**The actual reason is Commodity Specialization across Indian agricultural markets:**
Indian APMC markets specialize in specific agricultural commodities depending on local agro-climatic zones and harvest seasons. For example:
- A wheat-belt mandi in rural Punjab or Madhya Pradesh does not report Tomato transactions.
- A south-Indian coastal mandi reporting Coconut and Banana does not report Mustard or Wheat.
- When the application previously defaulted to **Tomato** (`commodityId = 'tomato'`), any mandi that specializes in Wheat or Onion returned **0 observations for Tomato**.

Because the user interface did not communicate what crops a mandi actually trades, it appeared as though the mandi was broken or had missing data.

### Commodity Coverage Breakdown

| Commodity | Total Observations | Unique Mandis Trading | Mandi Coverage (% of 2,643) | Date Range |
|---|---|---|---|---|
| **Wheat** | 165,608 | **1,340** | 50.7% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Tomato** | 177,019 | **1,236** | 46.8% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Onion** | 196,873 | **1,213** | 45.9% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Potato** | 178,682 | **1,182** | 44.7% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Green Chilli** | 162,153 | **1,114** | 42.1% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Banana** | 151,070 | **856** | 32.4% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Groundnut** | 33,836 | **526** | 19.9% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Watermelon** | 17,830 | **413** | 15.6% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Rice (Paddy)** | 49,595 | **400** | 15.1% | 12 Jun 2025 &ndash; 19 Apr 2026 |
| **Red Chili** | 3,441 | **113** | 4.3% | 12 Jun 2025 &ndash; 19 Apr 2026 |

---

## 3. Product & Engineering Remediation

To ensure farmers and market traders are never confused by crop specialization:

1. **Market Explorer Traded Crops Detection**:
   When viewing a market, the interface dynamically displays the exact list of commodities traded at that market (via `/api/v1/prices/{mandiId}/commodities`), with 1-click pills to switch crops.
2. **Explicit Data Explanations**:
   If a market does not trade the currently selected crop, the UI states:
   > *"Tomato is not reported at this market. Crops traded here: Wheat (₹2,250), Onion (₹1,800), Potato (₹1,400)."*
3. **Filter by Crop Availability**:
   Market Explorer provides an instant filter toggle: *"Only show markets trading [Selected Crop]"* so users never have to browse through irrelevant mandis.
4. **Honest Date Labels**:
   Every price displays its actual observation date (e.g., *"Reported on 19 April 2026"*).
5. **Clear Forecast Transparency**:
   If a market has sufficient recent transaction density, the 14-day expected price forecast is shown with a disclaimer: *"Expected prices are estimates based on historical trends, not guaranteed selling prices."* If observations are sparse, the UI clearly states: *"Not enough recent transactions to generate a reliable 14-day forecast."*
