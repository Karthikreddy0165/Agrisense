# Database Migrations & Schema Initialization — Agri

## 1. Schema Lifecycle & Idempotency

Database schema management is defined in:
- `scripts/create_schema.sql` (Authoritative DDL)
- Spring JPA auto-validation (`spring.jpa.hibernate.ddl-auto=update`)

---

## 2. Fresh Database Creation

To initialize a clean database from scratch without destructive resets of existing environments:

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE agriforecasting;"

# 2. Run DDL script
psql -U postgres -d agriforecasting -f /Users/karthikreddy/Desktop/Agri/scripts/create_schema.sql
```

This creates:
- `states` table with PK `id`
- `districts` table with PK `id` and FK to `states(id)`
- `mandis` table with PK `id` and FKs to `districts` and `states`
- `commodities` table with PK `id`
- `varieties` table with PK `id` and FK to `commodities`
- `price_observations` table with PK `id` and FKs
- `forecast_runs` table with PK `id`
- `forecast_run_items` table with PK `id` and FK to `forecast_runs(id)`
- Composite B-tree indexes for fast querying

---

## 3. Migration Verification Query

Verify table creation and index status:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
Expected output:
- `commodities`
- `districts`
- `forecast_run_items`
- `forecast_runs`
- `mandis`
- `price_observations`
- `states`
- `varieties`
