# Product Owner Decisions Archive — Agri

This file records the verbatim decisions and directives explicitly communicated by the Product Owner.

---

## 1. Product Owner Directives Log

| Date | Directive ID | Area | Decision / Directive | Owner Directive Text / Summary | Status |
|---|---|---|---|---|---|
| 2026-11-23 | **PO-DIR-01** | Identity | Agri Platform Name | The product is named "Agri". It is an agricultural mandi price intelligence and forecasting platform for Indian farmers. Keep it focused. | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-02** | Geography | National Mandi Coverage | Ingest all 2,617 unique mandis, 30 states, and 500+ districts from Hybrid-AgriPrice-Forecaster. Replace the 29-mandi prototype seed. | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-03** | Integrity | Zero Coordinate Guessing | Never fabricate coordinates or collapse mandis onto district centroids. Keep missing coordinate mandis searchable with "Coordinates Pending". | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-04** | Forecast | Fixed Reference Date Contract | Fixed reference date 2026-11-23; forecast horizon strictly 2026-11-24 through 2026-12-07 (exactly 14 daily points). | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-05** | UI/UX | Nearby Mandis Layout | Map + List experience. Side-by-side on desktop; mobile Map/List toggle defaulting to list. Synchronize card clicks with map pins. | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-06** | Data | History Separation | Strict separation between Prediction History (forecast runs) and Historical Prices (physical market observations). Never invent fake history. | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-07** | Scope | Zero Authentication | No login, signup, or passwords. Save markets to localStorage. No crop recommendations, pesticide advice, or payment systems. | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-08** | Security | Sliding-Window Rate Limiter | Implement sliding-window rate limiting on all public API endpoints by client IP with 429 response and rate-limit headers. | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-09** | Infra | Deployment Architecture | Option A: Next.js frontend on Vercel; single VPS for Docker Compose (Spring Boot, FastAPI, PostgreSQL, Redis, Nginx). No Kubernetes. | `[IMPLEMENTED, VERIFIED]` |
| 2026-11-23 | **PO-DIR-10** | i18n | Multi-Language Switching | Language selector must translate the complete website, not just headings. Support regional languages (Hindi, Tamil, etc.). | `[IMPLEMENTED, VERIFIED]` |

---

## 2. Inviolable Governance Principles

1. **No Silent Changes to Owner Directives:**
   Any developer working on this codebase must not alter the reference date, coordinate policy, authentication exclusion, or rate limiter without explicit written approval from the Product Owner.
2. **Honest Data Over Aesthetic Completeness:**
   Never populate tables, charts, or maps with fake numbers or estimated coordinates to make a page look "complete." If data is missing or pending, display an honest empty state or badge.
