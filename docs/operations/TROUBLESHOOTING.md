# Operational Troubleshooting Guide — Agri

## 1. Common Issues & Fast Resolutions

### Issue 1: Backend Fails with "Port 8080 already in use"
- **Symptom:** `Web server failed to start. Port 8080 was already in use.`
- **Cause:** Previous background task or orphaned Java process holding the socket.
- **Resolution:**
  ```bash
  lsof -ti :8080 | xargs kill -9
  ```

### Issue 2: PostgreSQL Error "could not determine data type of parameter $7"
- **Symptom:** JDBC exception when querying `/api/v1/forecasts/history`.
- **Cause:** Passing null timestamp parameters into a JPQL query without concrete type inference.
- **Resolution:** Already resolved in `DefaultForecastService.java` by using concrete epoch bounds (`1970-01-01` to `2099-12-31`) when `fromDate`/`toDate` are not specified.

### Issue 3: Next.js Hydration Warning: "Text content does not match server-rendered HTML"
- **Symptom:** React hydration mismatch on client render.
- **Cause:** Timezone discrepancies or formatting differences on client dates.
- **Resolution:** Dynamic pages use client wrappers with `Suspense` and explicit client-side mounting flags.

### Issue 4: Python Model Service Fails with "No module named 'app'"
- **Symptom:** `ModuleNotFoundError: No module named 'app'` when running pytest.
- **Cause:** `PYTHONPATH` not including the `model-service` directory root.
- **Resolution:** Run pytest with `PYTHONPATH=. pytest tests/` from inside `model-service`.

### Issue 5: Leaflet Map Icons Broken or Markers Not Showing
- **Symptom:** Missing Leaflet marker images or blank map tiles.
- **Cause:** Leaflet default icon asset paths in Next.js bundlers.
- **Resolution:** `components/map/MandiMap.tsx` overrides Leaflet default prototype icon options with custom inline SVG markers.
