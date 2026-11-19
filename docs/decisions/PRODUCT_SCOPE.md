# Product Scope Boundaries & Constraints — Agri

## 1. Allowed & In-Scope Functional Boundaries

| Domain | Allowed Features | Explicit Constraints |
|---|---|---|
| **Geography** | 30 States, 913 Districts, 2,643 Mandis | Must not drop mandis; must not fabricate coordinates. |
| **Commodities** | 15 National Crops, 262 Varieties | Standard units (₹/quintal); genuine variety mappings. |
| **Historical Data** | Actual physical market transactions | Sourced from `price_observations`; no synthetic fills. |
| **Forecasting** | 14-day predictions anchored to 2026-11-23 | LightGBM inference only; bounded uncertainty ±(4-9%). |
| **Comparison** | Multi-mandi comparison | Maximum 5 mandis per comparison. |
| **Localization** | 6 Indian languages (en, hi, te, kn, mr, ta) | Complete UI translation including dialogs and empty states. |
| **Saved Markets** | Local storage watchlist | No user registration or credentials required. |

---

## 2. Strictly Excluded Features `[REQUIRES OWNER APPROVAL]`

Under no circumstances should any engineer implement the following without formal written sign-off from the Product Owner:

1. **User Authentication & Authorization:**
   - No login screens, user tables, JWT cookies, session stores, or OAuth providers.
2. **Agronomic Crop Recommendations:**
   - No soil NPK calculations, sowing calendars, or crop suitability calculators.
3. **Pesticide & Fertilizer Advisory:**
   - No agrochemical recommendations or brand partnerships.
4. **Payment Processing:**
   - No payment gateways (Stripe, Razorpay, UPI) or subscription paywalls.
5. **Kubernetes Infrastructure:**
   - No Helm charts, ingress controllers, or multi-cluster microservice meshes.
6. **Live Model Retraining Daemons:**
   - No unmonitored scheduled scripts modifying model weights.
