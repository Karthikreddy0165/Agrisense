# Architecture Decision Records (ADRs) — Agri

## ADR-001: Three-Layer Modular Monolith Architecture
- **Status:** Accepted `[DECIDED]`
- **Context:** Early designs contemplated separating backend into multiple Java microservices.
- **Decision:** Consolidate all Java backend responsibilities into a single modular monolith in Spring Boot 3.3.5, with an internal Python FastAPI service for LightGBM inference.
- **Consequences:** Eliminates inter-service network overhead, simplifies transactions, lowers RAM consumption, and allows deployment on a single $20/month VPS.

---

## ADR-002: Next.js 16 App Router for Presentation Layer
- **Status:** Accepted `[DECIDED]`
- **Context:** Need server-side rendering for initial load performance on mobile networks across rural India, combined with dynamic client interactions for charts and maps.
- **Decision:** Use Next.js 16 App Router with React 19, Tailwind CSS, and shadcn/ui.
- **Consequences:** Superb SSR performance, Partial Prerendering (PPR) support, seamless Vercel edge deployment.

---

## ADR-003: State-Prefixed Canonical Slugs for National Mandi Keys
- **Status:** Accepted `[DECIDED]`
- **Context:** In `ALL_CROPS_DATA.csv`, 28 APMC mandi names exist in multiple states (e.g. `Adampur APMC` in Punjab & Haryana). Simple name slugs caused 28 physical entities to collide and overwrite each other.
- **Decision:** Prefix all primary key slugs with the ISO 2-letter state code (`pb-adampur-apmc`, `hr-adampur-apmc`).
- **Consequences:** 100% preservation of all 2,643 physical entities. Backend gracefully supports both prefixed slugs and unprefixed legacy searches.

---

## ADR-004: PostgreSQL Streaming COPY Expert for 1.136M Historical Records
- **Status:** Accepted `[DECIDED]`
- **Context:** Ingesting 1.17M records via Hibernate JPA took ~25 minutes and exhausted connection buffers.
- **Decision:** Implement a Python ingestion pipeline utilizing PostgreSQL binary streaming `COPY` with pre-dropped and post-rebuilt indexes.
- **Consequences:** Full national historical dataset ingested in **15.75 seconds** with zero data corruption.

---

## ADR-005: Sliding-Window Rate Limiter with Redis Lua & In-Memory Fallback
- **Status:** Accepted `[DECIDED]`
- **Context:** Required high-precision rate limiting per client IP to protect the LightGBM model from denial-of-service without locking up threads.
- **Decision:** Deploy a sliding-window rate limiter utilizing Redis sorted sets (`ZADD`, `ZREMRANGEBYSCORE`) via an atomic Lua script, with an automatic in-memory concurrent fallback for local development.
- **Consequences:** Zero-race-condition rate limiting returning standard headers (`X-RateLimit-*`) and HTTP 429 JSON payloads.

---

## ADR-006: Dual-Series Recharts Continuity for 14-Day Forecasts
- **Status:** Accepted `[DECIDED]`
- **Context:** Displaying historical prices and future forecasts on separate charts confused farmers. Showing them on one chart risked an awkward gap between the last actual point and first predicted point.
- **Decision:** Construct a unified chronological series with a bridge point on `2026-11-23` where the latest actual price is rendered as the starting anchor for the dashed forecast curve.
- **Consequences:** Intuitive, continuous visual trajectory with shaded uncertainty bounds.

---

## ADR-007: Zero-Authentication Watchlist via Client-Side Local Storage
- **Status:** Accepted `[DECIDED]`
- **Context:** Traditional platforms require account sign-up, email verification, or SMS OTP before users can save favorite markets.
- **Decision:** Store watched mandis and crops purely in browser `localStorage` under `agri_saved_markets`.
- **Consequences:** Instant bookmarking with zero onboarding friction for farmers.

---

## ADR-008: Deployment via Vercel + Single Ubuntu VPS Docker Compose
- **Status:** Accepted `[DECIDED]`
- **Context:** Evaluated AWS multi-region Kubernetes vs single VPS.
- **Decision:** Option A: Next.js on Vercel, single Ubuntu VPS running Docker Compose for Spring Boot, FastAPI, PostgreSQL, Redis, and Nginx reverse proxy.
- **Consequences:** Extremely low infrastructure cost (<$30/mo), minimal maintenance, fast continuous deployments.
