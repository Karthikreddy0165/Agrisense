# Frontend Feature Implementation — Agri

## 1. Key Component Implementations

### 1. `TopHeader.tsx` & Dynamic Location Modal
- Header displays active location badge: `Detecting...`, `Detected APMC`, `Saved Location`, or `Select location`.
- Language selector dropdown embedded in header supporting instant language switching.
- Location Modal (`LocationModal.tsx`) renders three synchronized dropdowns:
  1. `State`: Populated via `ApiService.getStates()`.
  2. `District`: Populated via `ApiService.getDistricts(tempState)`.
  3. `Mandi`: Populated via `ApiService.getMandis({ districtId: tempDistrict })`.
- Clicking "Apply Location" persists choice to `LocationContext` and updates header immediately.

### 2. `nearby-mandis/page.tsx` (Map + List Interface)
- Renders dual-pane Map + List interface.
- Filters:
  - Radius: 10 km, 25 km, 50 km, 100 km.
  - Search: Real-time debounced text query matching name, district, or state.
  - Commodity filter: Fetches and displays latest price on mandi cards.
- **Pagination:** Initial page loads 30 mandis; "Load More" button loads subsequent pages without page refresh.
- **Mobile Dual View:** On viewports < 768px, displays toggle buttons `[ List View ]` / `[ Map View ]`. Defaults to List View.

### 3. `ForecastClient.tsx`
- Combines 30 days of actual historical observations and 14 days of future projections into a single chronological array.
- Uses Recharts `<ComposedChart>`:
  - `<Area>` for shaded uncertainty bounds (`minPrice` to `maxPrice`).
  - `<Line type="monotone" dataKey="actualPrice" stroke="#166534" strokeWidth={3} />` for actual ground-truth history.
  - `<Line type="monotone" dataKey="forecastPrice" stroke="#059669" strokeDasharray="5 5" strokeWidth={3} />` for future projections.
  - Reference date bridge on `2026-11-23` ensures continuous line rendering.
- Tabular breakdown with daily expected price, change from reference %, and uncertainty ranges.

### 4. `MarketDetailClient.tsx`
- Dedicated APMC market profile at `/market/[mandiId]`.
- Top banner with mandi name, full address, GPS coordinates or `Coordinates Pending` status badge.
- Current modal price, min price, max price, arrivals, and 24-hour % change.
- Timeframe selector (7 days, 30 days, 90 days) dynamically updating Recharts volume and price charts.
- Action buttons: "Save Market", "Compare", "View 14-Day Forecast".
