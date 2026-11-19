# REST API Reference Specification — Agri

All endpoints use base URL: `http://localhost:8080/api/v1`

Responses follow a standardized JSON envelope:
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2026-11-23T16:05:24.657134"
}
```

---

## 1. System Endpoints

### `GET /health`
- **Description:** Application health and service status probe.
- **Rate Limit:** **Exempt** (not throttled).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Success",
    "data": {
      "status": "UP",
      "service": "agri-forecasting-java-backend",
      "timestamp": "2026-11-23T16:05:24.657012"
    }
  }
  ```

---

## 2. Geography & Mandi Endpoints

### `GET /states`
- **Description:** Returns all 30 Indian states and union territories.
- **Rate Limit Policy:** `read` (60 requests/min).
- **Response (200 OK):** Array of `{ id: "ka", name: "Karnataka", code: "KA" }`.

### `GET /districts`
- **Query Parameters:** `stateId` (optional, e.g. `pb`).
- **Description:** Returns districts for a given state or nationwide.
- **Response (200 OK):** Array of `{ id: "pb-ludhiana", stateId: "pb", name: "Ludhiana" }`.

### `GET /mandis`
- **Query Parameters:**
  - `stateId` (string, optional)
  - `districtId` (string, optional)
  - `search` (string, optional, matches name, full name, or ID slug)
  - `hasCoordinates` (boolean, optional: `true` for mapped mandis, `false` for pending)
  - `page` (integer, optional, 0-indexed, default: 0)
  - `size` (integer, optional, items per page)
  - `commodityId` (string, optional, populates latest observed price on mandi cards)
- **Response (200 OK):** Array of `MandiDto` objects.

### `GET /mandis/{id}`
- **Path Variable:** `id` (e.g. `ka-kolar-apmc` or legacy fallback `kolar-apmc`).
- **Response (200 OK / 404 Not Found):** Mandi details, lat/lon, coordinate status.

### `GET /mandis/nearby`
- **Query Parameters:** `latitude` (double), `longitude` (double), `radiusKm` (double, e.g. 50), `commodityId` (optional).
- **Description:** Returns mandis sorted by Haversine distance from the given coordinates. Excludes mandis with null coordinates.
- **Response (200 OK):** Array of `MandiDto` with populated `distanceKm`.

---

## 3. Commodities & Varieties

### `GET /commodities`
- **Description:** Lists all 15 agricultural commodities.
- **Response (200 OK):** Array of `{ id: "tomato", name: "Tomato", category: "vegetables", unit: "₹/quintal", slug: "tomato" }`.

### `GET /commodities/{commodityId}`
- **Response (200 OK / 404 Not Found):** Single commodity details.

### `GET /commodities/{commodityId}/varieties`
- **Response (200 OK):** Array of botanical varieties for the given crop (e.g. `tomato-hybrid`, `tomato-local`).

---

## 4. Historical Prices

### `GET /prices` or `GET /prices/{mandiId}/{commodityId}/latest`
- **Query/Path:** `mandiId`, `commodityId`.
- **Response (200 OK / 404 Not Found):** Latest observed `modalPrice`, `minPrice`, `maxPrice`, `arrivals`, and `observationDate`.

### `GET /prices/history` or `GET /prices/{mandiId}/{commodityId}/history`
- **Query Parameters:** `mandiId`, `commodityId`, `varietyId` (optional), `days` (default: 90).
- **Response (200 OK):** Chronological array of actual transaction observations from PostgreSQL.

### `GET /prices/summary` or `GET /prices/{mandiId}/{commodityId}/summary`
- **Response (200 OK):** Price history plus statistical metrics: `averageModalPrice`, `minObservedPrice`, `maxObservedPrice`, `volatilityPercentage`, and `trendDirection`.

---

## 5. 14-Day Price Forecasting

### `GET /forecasts` or `GET /forecast` or `GET /forecasts/generate`
- **Query Parameters:**
  - `mandiId` (string, required, e.g. `ka-kolar-apmc`)
  - `commodityId` (string, required, e.g. `tomato`)
  - `varietyId` (string, optional, e.g. `tomato-hybrid`)
- **Description:** Orchestrates LightGBM inference, caches run in DB, and returns 14 daily predictions.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "mandiId": "ka-kolar-apmc",
      "mandiName": "Kolar APMC",
      "commodityId": "tomato",
      "commodityName": "Tomato",
      "varietyId": "tomato-hybrid",
      "varietyName": "Hybrid",
      "referenceDate": "2026-11-23",
      "forecastStart": "2026-11-24",
      "forecastEnd": "2026-12-07",
      "horizon": 14,
      "latestActualPrice": 1000.0,
      "expectedPrice7d": 1060.0,
      "expectedPrice14d": 1120.0,
      "percentageChange14d": 12.0,
      "expectedDirection": "Rising",
      "expectedMin": 980.0,
      "expectedMax": 1250.0,
      "modelVersion": "LightGBM-AgriPrice-v1",
      "predictions": [
        {
          "date": "2026-11-24",
          "modalPrice": 1015.0,
          "minPrice": 974.4,
          "maxPrice": 1055.6,
          "percentageChangeFromReference": 1.5
        }
      ]
    }
  }
  ```

### `GET /forecasts/history`
- **Query Parameters:** `mandiId` (optional), `commodityId` (optional), `varietyId` (optional).
- **Description:** Returns previously generated forecast runs from PostgreSQL `forecast_runs`.

### `GET /forecasts/history/{id}`
- **Description:** Returns full details of run `id` with original predictions compared against any actual observations subsequently recorded.

---

## 6. Multi-Market Comparison

### `GET /comparisons` or `GET /comparison`
- **Query Parameters:**
  - `commodityId` (required)
  - `varietyId` (optional)
  - `mandiIds` (comma-separated list of 1 to 5 mandis)
- **Validation:** If `mandiIds.size() > 5`, returns **HTTP 400 Bad Request**.
- **Response (200 OK):** Multi-market comparison response with price spreads, individual forecasts, and market rankings.
