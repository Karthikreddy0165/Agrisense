# Data Quality & Reconciliation Audit Report — Agri

## 1. Executive Data Quality Summary

This report documents the completeness, integrity, and reconciliation audit of the national agricultural datasets ingested into PostgreSQL (`agriforecasting`).

---

## 2. Integrity Verification Matrix

| Quality Dimension | Test / Check | Result | Evidence / Action Taken |
|---|---|---|---|
| **Referential Integrity** | Foreign keys on all child tables | 100% Valid | Every mandi links to a valid district & state; every price observation links to a valid mandi, commodity, and variety. |
| **Deduplication** | Primary key and composite unique constraints | 100% Unique | 34,994 duplicate transaction records dropped safely during COPY streaming. |
| **Coordinate Truth** | Zero hallucinated coordinates | Verified | 2,492 mandis have explicit `NULL` lat/lon; 151 mandis have verified coordinates. |
| **Mandi Coverage** | Every mandi has price observations | 100% Covered | All 2,643 physical mandis have real historical observations in `price_observations`. |
| **Date Monotonicity** | Observation dates chronological | Verified | Date range `2025-06-12` to `2026-04-19` ordered descending via B-tree index. |
| **Price Plausibility** | Positive prices & Min <= Modal <= Max | Verified | All modal prices > 0; minPrice <= modalPrice <= maxPrice constraint holds across 1.136M records. |

---

## 3. Discrepancy & Collision Analysis

1. **Cross-State Mandi Name Collisions:**
   - In raw datasets, 28 APMC mandi names exist in multiple states.
   - Example: `Adampur APMC` exists in Punjab and Haryana; `Banda APMC` exists in Uttar Pradesh and Madhya Pradesh.
   - *Resolution:* Prefixed with ISO state codes (`pb-adampur-apmc` vs `hr-adampur-apmc`), guaranteeing 100% entity preservation.
2. **Missing Daily Price Observations:**
   - In real-world APMC operations, mandis do not trade every crop every single day (e.g., Sundays, holidays, seasonal gaps).
   - *Resolution:* Gaps are left as authentic missing observations. Neither the backend nor the database creates synthetic transaction records.
