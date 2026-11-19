# Product Overview — Agri

## 1. Product Identity

- **Official Name:** Agri `[DECIDED]`
- **Repository Root:** `/Users/karthikreddy/Desktop/Agri`
- **Predecessor Research:** `Hybrid-AgriPrice-Forecaster`
- **Product Classification:** Agricultural Mandi Price Intelligence & Short-Term Forecasting Platform `[DECIDED]`
- **Target Geography:** Pan-India (All 30 States & Union Territories, 913 Districts, 2,643 Mandis) `[IMPLEMENTED, VERIFIED]`

---

## 2. Problem Statement

Indian farmers routinely sell produce at local Agricultural Produce Market Committee (APMC) yards with asymmetrical information:
1. They lack real-time visibility into current modal, minimum, and maximum prices in neighboring mandis.
2. They cannot easily assess whether transporting harvest 20–50 km further would yield a net-positive price premium after logistics costs.
3. They lack reliable price forecasts to decide whether to harvest today or hold for 3–5 days.
4. Existing government portals (such as Agmarknet) often feature unintuitive tabular interfaces that are difficult to navigate on mobile devices in regional languages.

---

## 3. Product Vision & Proposition

**Agri** bridges this intelligence gap by providing a modern, fast, mobile-first web application designed specifically for Indian agricultural producers and traders.

### Core Value Propositions:
1. **Nearby Mandi Discovery:** Automatically discovers markets within 10, 25, 50, or 100 km using device GPS or cascading manual selection (`State` ➔ `District` ➔ `Mandi`).
2. **True Market Ground Truth:** Displays authentic historical mandi price observations without hallucinated or filled-in numbers.
3. **14-Day Price Forecasting:** Provides short-term expected price trajectories with bounded uncertainty bands, calculated by a trained LightGBM machine learning model.
4. **Cross-Mandi Comparison:** Side-by-side comparison of up to 5 mandis for the same commodity and variety, comparing latest modal prices, trends, and projected trajectories.
5. **No Authentication Friction:** Farmers can save watched markets directly to local storage without creating accounts or entering passwords.
6. **Multi-Lingual Accessibility:** Full-application localization across English, Hindi (हिन्दी), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Marathi (मराठी), and Tamil (தமிழ்).

---

## 4. Target Personas

| Persona | Needs & Goals | Core Application Flow |
|---|---|---|
| **Smallholder Farmer (1-5 Acres)** | Needs quick mobile lookup in local language; wants to know if prices are rising or falling before harvesting. | Location modal ➔ Select crop ➔ View 14-day forecast ➔ Check nearest mandi price. |
| **Progressive Farmer / FPO Manager** | Compares multiple district mandis; evaluates whether to hire a truck to transport produce to a larger regional hub. | Nearby Mandis (Map + List) ➔ Select 3–4 mandis ➔ Compare Markets ➔ Evaluate price differentials. |
| **Mandi Commission Agent / Trader** | Monitors price trends, volume arrivals, and daily volatility across key agricultural commodities. | My Market Profile ➔ 90-day historical chart ➔ Prediction History audit. |
| **Agricultural Analyst / Evaluator** | Validates machine learning forecasting accuracy against actual historical market observations. | Prediction History ➔ Forecast Run Inspect modal ➔ Compare predicted vs actual prices. |

---

## 5. Scope Exclusions (Owner Mandated) `[DECIDED, REQUIRES OWNER APPROVAL]`

To maintain razor-sharp product focus and avoid bloated software anti-patterns, the following are **strictly excluded**:
- ❌ **No User Authentication / Sign-up / Passwords** (unnecessary friction for farmers).
- ❌ **No Crop Recommendations** (agronomic advisory is out of scope).
- ❌ **No Fertilizer or Pesticide Advisory** (not an agrochemical sales platform).
- ❌ **No Payment Gateways or Monetization Modules**.
- ❌ **No Complex Microservices / Kubernetes** (runs efficiently as a modular monolith on single VPS + Vercel).
- ❌ **No Automated Scraping Pipelines at this stage**.
- ❌ **No Live Model Retraining / MLOps complexity** (uses frozen validated LightGBM model artifact).
