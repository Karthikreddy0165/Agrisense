# Agri — Pan-India Mandi Price Intelligence & 14-Day Forecasting Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black.svg?logo=next.js)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg?logo=postgresql)](https://www.postgresql.org/)
[![LightGBM](https://img.shields.io/badge/LightGBM-4.x-orange.svg)](https://lightgbm.readthedocs.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Verified-45ba4b.svg?logo=playwright)](https://playwright.dev/)

**Agri** is an agricultural market intelligence and price forecasting platform designed for Indian farmers, traders, and price evaluators. It transforms agricultural decision-making by enabling producers to discover nearby mandis, study authentic historical price movements, view 14-day future price forecasts, and compare multiple regional markets before selling their harvest.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Product Vision & Core Proposition](#2-product-vision--core-proposition)
3. [Key Features](#3-key-features)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Repository Structure](#6-repository-structure)
7. [Prerequisites](#7-prerequisites)
8. [Local Setup Quickstart](#8-local-setup-quickstart)
9. [Environment Configuration](#9-environment-configuration)
10. [PostgreSQL Setup & Migrations](#10-postgresql-setup--migrations)
11. [National Data Ingestion (Geography & Prices)](#11-national-data-ingestion-geography--prices)
12. [Starting the Python Inference Service](#12-starting-the-python-inference-service)
13. [Starting the Java Spring Boot Backend](#13-starting-the-java-spring-boot-backend)
14. [Starting the Next.js Frontend](#14-starting-the-nextjs-frontend)
15. [Running Test Suites](#15-running-test-suites)
16. [Running with Docker Compose](#16-running-with-docker-compose)
17. [Production Deployment Overview (Vercel + VPS)](#17-production-deployment-overview-vercel--vps)
18. [Documentation Knowledge Base](#18-documentation-knowledge-base)
19. [Implementation Status](#19-implementation-status)
20. [Known Limitations & Integrity Policies](#20-known-limitations--integrity-policies)

---

## 1. Problem Statement

Indian agricultural producers often operate at a severe information disadvantage. Price transparency across neighbouring Agricultural Produce Market Committee (APMC) yards is fragmented. Farmers frequently cannot determine:
- What the true latest modal price is for their exact crop variety.
- Whether travelling an extra 25–50 km to another market would deliver a net profit after logistics costs.
- Whether market prices are expected to rise or fall over the coming fortnight.

**Agri** provides a transparent, farmer-friendly, mobile-optimized decision tool that answers these critical questions.

---

## 2. Product Vision & Core Proposition

- **True Ground Truth:** Grounded in authentic historical APMC transactions from `ALL_CROPS_DATA.csv` — **zero fabricated or hallucinated numbers**.
- **14-Day Price Forecasting:** Short-term future price predictions with expanding uncertainty bounds powered by a trained 69-feature LightGBM gradient-boosted model.
- **National Mandi Catalogue:** Comprehensive national coverage across **30 Indian States/UTs, 913 Districts, and 2,643 Mandis**.
- **Frictionless Experience:** No user registration, no passwords, and no SMS OTP gates. Saved markets persist locally in browser `localStorage`.
- **Multi-Lingual:** Full application localization across **English, Hindi (हिन्दी), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Marathi (मराठी), and Tamil (தமிழ்)**.

---

## 3. Key Features

- **Nearby Mandis (Map + List):** Dual-pane interactive interface. Left pane displays scrollable, paged cards (30 per page); right pane features an interactive Leaflet map. Marker clicks synchronize with list selection.
- **Dynamic 3-Tier Location Cascade:** Browser geolocation or cascading manual selector (`State` ➔ `District` ➔ `Mandi`) across all 30 states and 913 districts.
- **Market Profile ("My Market"):** Dedicated profile (`/market/:id`) with 7/30/90-day price and arrival trends, price volatility stats, and quick actions.
- **14-Day Price Forecasting:** Unified chronological chart connecting recent actual prices to 14 future daily projections with continuous bridge on `2026-11-23`.
- **Prediction History Audit:** Auditable log of previously generated forecasts (`/prediction-history`) with an "Inspect" modal comparing original predictions against subsequent actual market observations.
- **Cross-Mandi Comparison:** Side-by-side comparison of up to 5 mandis for the same crop and variety with price spread metrics.
- **Sliding-Window Rate Limiting:** Enforces client IP rate limits returning standard `X-RateLimit-*` headers and HTTP 429 JSON payloads.

---

## 4. High-Level Architecture

```mermaid
flowchart TD
    subgraph Client Layer
        Browser["User Browser<br/>(Desktop / Mobile)"]
    end

    subgraph Frontend Tier - Vercel Edge
        NextJS["Next.js 16 App Router (Port 3000)<br/>React 19 • Tailwind CSS • Recharts • Leaflet"]
    end

    subgraph Backend Tier - Ubuntu VPS
        Nginx["Reverse Proxy (Nginx / Caddy)<br/>SSL Termination • Ports 80 / 443"]
        SpringBoot["Spring Boot 3.3.5 (Port 8080)<br/>Java 17/21 LTS • Modular Monolith<br/>Rate Limiting • Orchestration • REST APIs"]
    end

    subgraph Internal Inference & Data Tier (Private Network)
        FastAPI["FastAPI Inference Service (Port 8000)<br/>LightGBM Booster (69 Features)"]
        PostgreSQL[("PostgreSQL 14 Database (Port 5432)<br/>2,643 Mandis • 1.136M Price Records")]
        Redis[("Redis 7.x (Port 6379)<br/>Sliding-Window Rate Limiting")]
    end

    Browser <-->|HTTPS| NextJS
    NextJS <-->|REST API JSON| Nginx
    Nginx --> SpringBoot
    SpringBoot <-->|JPA / HikariCP| PostgreSQL
    SpringBoot <-->|Jedis / Lua| Redis
    SpringBoot <-->|Internal HTTP| FastAPI
```

---

## 5. Technology Stack

- **Frontend:** Next.js 16.4.6, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Recharts 3.11, Leaflet 1.9.4.
- **Backend:** Java 17/21 LTS, Spring Boot 3.3.5, Spring Data JPA, Hibernate 6.5, HikariCP.
- **Inference Service:** Python 3.10+, FastAPI, Uvicorn, LightGBM 4.x, Scikit-Learn, Pandas, NumPy.
- **Database & Cache:** PostgreSQL 14+, Redis 7.x.
- **Testing Tools:** JUnit 5, Mockito, Pytest, Playwright (Chromium).

---

## 6. Repository Structure

```text
Agri/
├── backend/                          # Java Spring Boot 3.3.5 Application
│   ├── src/main/java/                # Domain packages: market, price, forecast, comparison, ratelimit
│   ├── src/main/resources/           # application.properties, application-test.properties
│   └── pom.xml                       # Maven build configuration
│
├── frontend/                         # Next.js 16 App Router Application
│   ├── app/                          # Routes: /, /nearby-mandis, /market, /forecast, /compare, etc.
│   ├── components/                   # UI primitives, Map, LocationModal, ForecastClient
│   ├── lib/                          # Contexts (Location, Language), ApiService, utils
│   └── package.json                  # Next.js dependencies and scripts
│
├── model-service/                    # Python FastAPI LightGBM Inference Microservice
│   ├── app/                          # main.py, model_adapter.py (69 features), schemas.py
│   ├── model/                        # price_lgbm_full_features.pkl artifact
│   └── tests/                        # Pytest model inference tests
│
├── docs/                             # Comprehensive Technical Documentation Knowledge Base
│   ├── product/                      # Product overview, requirements, user flows, decisions
│   ├── architecture/                 # System, frontend, backend, database, API, rate limiting
│   ├── data/                         # Data dictionary, sources, geography and price ingestion
│   ├── implementation/               # Feature status, forecast pipeline, limitations
│   ├── decisions/                    # Owner decisions log, ADRs, product scope, changelog
│   ├── testing/                      # Test strategy, execution reports, browser QA, performance
│   └── operations/                   # Local setup, environment variables, runbooks, deployment
│
├── scripts/                          # Automated Ingestion & Schema Scripts
│   ├── create_schema.sql             # Authoritative PostgreSQL DDL
│   ├── ingest_national_geography.py  # 30 states, 913 districts, 2,643 mandis ingestion
│   └── ingest_historical_prices.py   # High-throughput streaming COPY for 1.136M records
│
├── tests/                            # Automated Testing Suites
│   ├── test_api_suite.py             # 22-endpoint comprehensive REST API test suite
│   └── browser_qa_v3.py              # 10-flow Playwright real-browser QA suite
│
├── docker-compose.yml                # Production multi-container VPS specification
├── .env.example                      # Environment template
└── README.md                         # This file
```

---

## 7. Prerequisites

- **Node.js:** v20.x or v22.x LTS
- **JDK:** Java 17 or 21 LTS
- **Maven:** 3.8+
- **Python:** 3.10+
- **PostgreSQL:** 14+
- **Redis:** 6.x or 7.x

---

## 8. Local Setup Quickstart

```bash
# 1. Clone repository
git clone <repository_url> Agri
cd Agri

# 2. Configure environment
cp .env.example .env

# 3. Initialize Python virtual environment
python3 -m venv /tmp/agri_test_venv
source /tmp/agri_test_venv/bin/activate
pip install -r model-service/requirements.txt psycopg2-binary
```

---

## 9. Environment Configuration

Edit `.env` or set environment variables:

```ini
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agriforecasting
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Services
SERVER_PORT=8080
MODEL_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 10. PostgreSQL Setup & Migrations

```bash
# Create database
psql -U postgres -c "CREATE DATABASE agriforecasting;"

# Execute authoritative DDL schema
psql -U postgres -d agriforecasting -f scripts/create_schema.sql
```

---

## 11. National Data Ingestion (Geography & Prices)

```bash
# Ingest 30 States, 913 Districts, 2,643 Mandis, 15 Crops, 262 Varieties (~3s)
/tmp/agri_test_venv/bin/python3 scripts/ingest_national_geography.py

# Ingest 1,136,107 historical price observations via PostgreSQL COPY expert (~16s)
/tmp/agri_test_venv/bin/python3 scripts/ingest_historical_prices.py
```

---

## 12. Starting the Python Inference Service

```bash
cd model-service
PYTHONPATH=. /tmp/agri_test_venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
# Verify readiness
curl http://localhost:8000/ready
```

---

## 13. Starting the Java Spring Boot Backend

```bash
cd backend
mvn clean package -DskipTests
java -jar target/agri-forecasting-backend-1.0.0.jar
# Verify health
curl http://localhost:8080/api/v1/health
```

---

## 14. Starting the Next.js Frontend

```bash
cd frontend
npm install
npm run build
npm start
# Open http://localhost:3000 in your browser
```

---

## 15. Running Test Suites

### A. Backend Unit & Integration Tests (12 tests)
```bash
cd backend && mvn test
```

### B. Python Model Inference Tests (4 tests)
```bash
cd model-service && PYTHONPATH=. /tmp/agri_test_venv/bin/pytest tests/ -v
```

### C. Frontend TypeScript Typecheck
```bash
cd frontend && npx tsc --noEmit
```

### D. Comprehensive REST API Test Suite (22 assertions)
```bash
/tmp/agri_test_venv/bin/python3 tests/test_api_suite.py
```

### E. Real-Browser Playwright QA Suite (10 user flows)
```bash
/tmp/agri_test_venv/bin/python3 tests/browser_qa_v3.py
```

---

## 16. Running with Docker Compose

To run the complete production-grade containerized stack on your VPS:

```bash
docker compose build --no-cache
docker compose up -d

# Verify container health
docker compose ps
```

---

## 17. Production Deployment Overview (Vercel + VPS)

The Product Owner explicitly selected **Option A**:
- **Frontend on Vercel:** Deploy `frontend/` directory directly to Vercel with environment variable `NEXT_PUBLIC_API_BASE_URL=https://api.agriforecasting.com/api/v1`.
- **Backend on Single VPS:** Run `docker-compose.yml` on Ubuntu VPS behind Nginx with Let's Encrypt SSL. Only ports 80 and 443 are exposed.

Full deployment runbook: [docs/operations/PRODUCTION_DEPLOYMENT.md](docs/operations/PRODUCTION_DEPLOYMENT.md).

---

## 18. Documentation Knowledge Base

Comprehensive architectural documentation is available in `docs/`:

- **[docs/product/PRODUCT_OVERVIEW.md](docs/product/PRODUCT_OVERVIEW.md):** Vision, personas, and scope exclusions.
- **[docs/product/PRODUCT_DECISIONS.md](docs/product/PRODUCT_DECISIONS.md):** Authoritative Product Owner decisions log.
- **[docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md):** 3-layer architecture specifications.
- **[docs/architecture/DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md):** PostgreSQL schema, DDL, and indexes.
- **[docs/architecture/API_REFERENCE.md](docs/architecture/API_REFERENCE.md):** REST API contracts.
- **[docs/architecture/RATE_LIMITING.md](docs/architecture/RATE_LIMITING.md):** Sliding-window rate limiter specification.
- **[docs/data/DATA_QUALITY_REPORT.md](docs/data/DATA_QUALITY_REPORT.md):** Ingestion metrics and deduplication audits.
- **[docs/testing/TEST_EXECUTION_REPORT.md](docs/testing/TEST_EXECUTION_REPORT.md):** 64/64 tests passed verification evidence.

---

## 19. Implementation Status

| Feature Domain | Target Requirement | Status |
|---|---|---|
| **National Geography** | 30 States, 913 Districts, 2,643 Mandis | ✅ **VERIFIED (100%)** |
| **Historical Price Records** | 1,136,107 Ground-Truth Observations | ✅ **VERIFIED (100%)** |
| **14-Day Price Forecasts** | Anchored to 2026-11-23; 14-day horizon | ✅ **VERIFIED (100%)** |
| **Prediction History Audit** | Persisted runs with verification inspect dialog | ✅ **VERIFIED (100%)** |
| **Nearby Mandis (Map+List)**| Desktop dual-pane & mobile view toggle | ✅ **VERIFIED (100%)** |
| **Multi-Language (i18n)** | 6 Indian languages (en, hi, te, kn, mr, ta) | ✅ **VERIFIED (100%)** |
| **Sliding-Window Rate Limit** | Enforced per client IP on public endpoints | ✅ **VERIFIED (100%)** |
| **Automated Test Battery** | 64/64 Unit, API, and Browser tests passed | ✅ **VERIFIED (100%)** |

---

## 20. Known Limitations & Integrity Policies

1. **Zero Coordinate Fabrication Policy:** 2,492 mandis currently lack verified GPS coordinates in source datasets. In strict adherence to the Owner's mandate, coordinates were **never fabricated or guessed**. These mandis remain 100% discoverable and searchable in list views with an honest `Coordinates Pending` badge, but are filtered out of map markers.
2. **Fixed Evaluation Reference Date (`2026-11-23`):** Standardizes validation against known historical training windows.
3. **No User Registration:** Saved markets are stored in browser `localStorage`.
