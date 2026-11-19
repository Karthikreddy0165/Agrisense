# Frontend Architecture — Agri

## 1. Directory Structure

The frontend is located at `/Users/karthikreddy/Desktop/Agri/frontend` and organized according to Next.js App Router conventions:

```text
frontend/
├── app/                              # Next.js App Router Pages
│   ├── layout.tsx                    # Root layout (TopHeader, Navigation, LocationProvider, LanguageProvider)
│   ├── page.tsx                      # Homepage & Crop Discovery Hero
│   ├── nearby-mandis/page.tsx        # Nearby Mandis (Map + List split view)
│   ├── market/                       # Market profile root & dynamic router
│   │   ├── page.tsx                  # Market explorer redirect/selector
│   │   └── [mandiId]/page.tsx        # Dynamic market detail view (/market/:id)
│   ├── forecast/page.tsx             # 14-Day Price Forecast Client
│   ├── compare/page.tsx              # Multi-mandi Comparison Client
│   ├── prediction-history/page.tsx   # Model forecast audit & inspect dialogs
│   ├── saved/page.tsx                # Saved markets watchlist
│   ├── settings/page.tsx             # App preferences & units
│   └── about/page.tsx                # Platform background & methodology
│
├── components/                       # Modular UI Components
│   ├── ui/                           # shadcn/ui primitives (button, card, dialog, badge, tabs, etc.)
│   ├── header/TopHeader.tsx          # Top bar with location button, language select, mobile menu
│   ├── location/LocationModal.tsx    # 3-tier dynamic cascading location selector
│   ├── map/MandiMap.tsx              # Leaflet map container with geocoded pins & popups
│   ├── forecast/ForecastClient.tsx   # Forecast charts, cards, uncertainty bands, breakdown table
│   ├── market/MarketDetailClient.tsx # Historical price charts, arrival trends, metrics
│   └── compare/CompareClient.tsx     # Multi-market spread comparison & charts
│
├── lib/
│   ├── context/                      # React State Contexts
│   │   ├── LocationContext.tsx       # Geolocation, manual coords, state/district/mandi persistence
│   │   └── LanguageContext.tsx       # Active language, translation function t()
│   ├── services/
│   │   ├── api.ts                    # Backend API Client (fetchWithFallback, rate-limit handling)
│   │   └── geography.service.ts      # Geography lookup service with in-memory caching
│   ├── data/                         # Static fallback seed datasets (10 states, 29 mandis)
│   ├── hooks/useSavedMarkets.ts      # localStorage hook for saved markets
│   └── utils/                        # Formatters (currency, dates, distances)
```

---

## 2. Key State Management Patterns

### 1. `LocationContext`
- **Responsibilities:**
  - Manages `coordinates: { latitude: number; longitude: number } | null`.
  - Manages `locationLabel`, `stateId`, `districtId`, `mandiId`.
  - Tracks status: `IDLE`, `DETECTING`, `DETECTED`, `ERROR`, `MANUAL`.
  - Computes distance to any mandi using safe null-guarded Haversine calculations:
    ```typescript
    if (m.latitude != null && m.longitude != null && coordinates) {
      // compute distance in km
    }
    ```
  - Persists manual selections to `localStorage['agri_saved_location']`.

### 2. `LanguageContext` & i18n
- **Languages Supported:** `en` (English), `hi` (हिन्दी), `te` (తెలుగు), `kn` (ಕನ್ನಡ), `mr` (मराठी), `ta` (தமிழ்).
- **Reactive Translation Function:** `t(key: string, fallback?: string): string`.
- Stored in `localStorage['agri_language']`. Reactively re-renders all text components without requiring page reloads.

### 3. `useSavedMarkets`
- Lightweight custom hook wrapping `localStorage['agri_saved_markets']`.
- Methods: `save(mandiId, commodityId, varietyId)`, `remove(id)`, `isSaved(...)`, `toggle(...)`.

---

## 3. Map & List Integration (Nearby Mandis)

- **Desktop View:** Synchronized dual-pane layout (`grid grid-cols-12`).
  - Left pane (7 cols): Scrollable list of mandis with pagination (30 per page + Load More).
  - Right pane (5 cols): Leaflet interactive map with custom green map markers.
- **Marker Synchronization:** Hovering or clicking a list card invokes `map.flyTo([lat, lon], 12)`. Clicking a map marker scrolls the target card into view with active ring styling.
- **Null Coordinate Handling:** Mandis with `latitude == null` are skipped by the Leaflet marker layer and rendered in the list with a distinct grey `Coordinates Pending` pill.

---

## 4. Recharts Visualization Strategy

- **Dual-Series Continuity:**
  - In `/forecast`, the chart displays both historical observations and future forecasts on one continuous X-axis.
  - A bridge point on `2026-11-23` (reference date) shares the latest actual price as the starting point for the forecast line, preventing awkward visual disconnects.
- **Uncertainty Bounds:** Rendered via SVG `<Area>` using `minPrice` and `maxPrice` with a semi-transparent emerald fill (`opacity: 0.15`) surrounding the dashed `modalPrice` forecast line.
