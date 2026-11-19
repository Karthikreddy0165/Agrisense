# Geocoding Policy & Coordinate Resolution Audit — Agri

## 1. Owner Mandate: Zero Coordinate Fabrication `[DECIDED]`

The Product Owner explicitly mandated:
> **"Never fabricate coordinates, collapse mandis onto district centroids, or invent map pins."**

In agricultural trade, distance directly impacts transport cost calculations. Fabricating a pin 30 km away from a mandi's actual location corrupts farmer decision-making.

---

## 2. Coordinate Breakdown & Status Breakdown

| Coordinate Category | Mandi Count | Percentage | Database Representation | Map Representation | List Representation |
|---|---|---|---|---|---|
| **Verified Coordinates** | **151** | 5.71% | `latitude`, `longitude` populated; `coordinate_source = 'VERIFIED_SEED'` or `'GEOCODED'`; `coordinate_status = 'VERIFIED'` | Plotted as interactive Leaflet marker with popup | Normal list card with distance in km (when location is enabled) |
| **Unresolved Coordinates** | **2,492** | 94.29% | `latitude = NULL`, `longitude = NULL`; `coordinate_source = 'UNRESOLVED'`; `coordinate_status = 'UNRESOLVED'` | **Filtered out of map marker layer** (prevents clustering artifacts or false locations) | Normal list card with **`Coordinates Pending`** badge; full price history & forecasts accessible |
| **Total Physical Mandis** | **2,643** | 100.0% | - | - | - |

---

## 3. Safe Distance & Math Handling

Because 2,492 mandis have null coordinates, all distance calculation logic in Java and TypeScript enforces strict null guards:

### Java (`GeoUtils.java` & `MarketService.java`):
```java
if (m.getLatitude() == null || m.getLongitude() == null) {
    continue; // Exclude from radius bounding box calculations
}
double distance = GeoUtils.calculateDistanceKm(userLat, userLon, m.getLatitude(), m.getLongitude());
```

### TypeScript (`LocationContext.tsx` & `nearby-mandis/page.tsx`):
```typescript
if (m.latitude != null && m.longitude != null && coordinates) {
    const d = calculateDistance(coordinates.latitude, coordinates.longitude, m.latitude, m.longitude);
    return { ...m, distanceKm: d };
}
return { ...m, distanceKm: undefined };
```
This guarantees that `toFixed()`, `Math.atan2()`, or map markers never throw `NullPointerException` or `Cannot read properties of undefined (reading 'toFixed')`.
