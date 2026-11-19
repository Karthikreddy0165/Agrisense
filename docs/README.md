# Agri — Technical Documentation Index & Knowledge Base

Welcome to the official technical handover and architectural documentation for **Agri** (formerly Hybrid-AgriPrice-Forecaster), an India-wide agricultural mandi price intelligence and forecasting platform.

This directory contains the authoritative documentation covering product requirements, owner decisions, technical architecture, data pipelines, implementation status, testing reports, and operational runbooks.

---

## Documentation Directory Map

```text
docs/
├── README.md                                 # This index
│
├── product/                                  # Product strategy, requirements & owner decisions
│   ├── PRODUCT_OVERVIEW.md                   # Product vision, target users, core propositions
│   ├── PRODUCT_REQUIREMENTS.md               # Detailed functional and non-functional requirements
│   ├── USER_FLOWS.md                         # End-to-end user journeys (Discovery to Comparison)
│   ├── FEATURES_AND_SCOPE.md                 # Complete feature matrix & explicit exclusions
│   └── PRODUCT_DECISIONS.md                  # Authoritative log of all Product Owner decisions
│
├── architecture/                             # System design & component contracts
│   ├── SYSTEM_ARCHITECTURE.md                # 3-layer architecture, interaction diagrams, boundaries
│   ├── FRONTEND_ARCHITECTURE.md              # Next.js 16, App Router, state management, components
│   ├── BACKEND_ARCHITECTURE.md               # Spring Boot 3.3.5 modular monolith, services, repositories
│   ├── PYTHON_INFERENCE_SERVICE.md           # FastAPI service, 69-feature LightGBM model adapter
│   ├── DATABASE_SCHEMA.md                    # PostgreSQL 14 schema, DDL, indexes, constraints
│   ├── API_REFERENCE.md                      # Comprehensive OpenAPI / REST contracts
│   ├── RATE_LIMITING.md                      # Sliding-window rate limiter, Redis/In-memory Lua design
│   └── DEPLOYMENT_ARCHITECTURE.md            # Vercel + VPS Docker Compose, Caddy/Nginx reverse proxy
│
├── data/                                     # National dataset, ingestion & quality audits
│   ├── DATA_DICTIONARY.md                    # Field definitions across geography, prices, forecasts
│   ├── DATA_SOURCES.md                       # ALL_CROPS_DATA.csv, hierarchy_map.csv, geocoding files
│   ├── GEOGRAPHY_INGESTION.md                # 30 states, 913 districts, 2,643 mandis ingestion pipeline
│   ├── GEOCODING.md                          # Coordinate resolution policy, verified coords vs NULLs
│   ├── HISTORICAL_PRICE_INGESTION.md         # 1.136M price observations streaming COPY pipeline
│   └── DATA_QUALITY_REPORT.md                # Reconciliation metrics, deduplication audit, coverage
│
├── implementation/                           # Code-level implementation details & limitations
│   ├── IMPLEMENTATION_STATUS.md              # Feature-by-feature verification matrix
│   ├── TECHNICAL_IMPLEMENTATION.md           # Code structure, patterns, dependency injection
│   ├── FORECAST_PIPELINE.md                  # 14-day forecast orchestration, reference date contract
│   ├── FRONTEND_FEATURE_IMPLEMENTATION.md    # Map + List, modal cascade, multi-language i18n
│   └── KNOWN_LIMITATIONS.md                  # Honest technical constraints, missing coordinates, data gaps
│
├── decisions/                                # Decision records and changelogs
│   ├── OWNER_DECISIONS.md                    # Explicit decisions signed off by Product Owner
│   ├── ARCHITECTURE_DECISION_RECORDS.md      # ADR-001 through ADR-008
│   ├── PRODUCT_SCOPE.md                      # Allowed scope vs hard exclusions
│   └── CHANGELOG.md                          # Complete historical release & audit changelog
│
├── testing/                                  # Quality assurance & verification evidence
│   ├── TEST_STRATEGY.md                      # 4-tier testing philosophy (Unit, API, E2E, Regression)
│   ├── TEST_EXECUTION_REPORT.md              # Backend unit tests, model tests, frontend typechecks
│   ├── BROWSER_QA_REPORT.md                  # Playwright 10-flow browser verification report
│   ├── API_TEST_REPORT.md                    # 22-endpoint automated API validation suite results
│   └── PERFORMANCE_REPORT.md                 # Latency benchmarks, ingestion speeds, query metrics
│
└── operations/                               # DevOps, runbooks & troubleshooting
    ├── LOCAL_SETUP.md                        # Step-by-step developer onboarding from scratch
    ├── ENVIRONMENT_VARIABLES.md              # Configuration reference across all 3 tiers
    ├── DATABASE_MIGRATIONS.md                # DDL schema initialization and data migrations
    ├── DATA_IMPORT_RUNBOOK.md                # High-throughput data ingestion instructions
    ├── TROUBLESHOOTING.md                    # Common failure modes, recovery procedures, FAQs
    └── PRODUCTION_DEPLOYMENT.md              # Production deployment runbook (Vercel + VPS Docker)
```

---

## Status Classification Legend

Throughout these documents, all requirements, features, and design choices are tagged with standardized status labels:

- `[DECIDED]`: Explicitly chosen and mandated by the Product Owner.
- `[IMPLEMENTED]`: Built and present in the codebase.
- `[VERIFIED]`: Tested with automated suites or real-browser verification.
- `[PARTIALLY IMPLEMENTED]`: Core functionality exists; advanced extensions pending.
- `[NOT IMPLEMENTED]`: Planned or scoped out; no code currently present.
- `[BLOCKED]`: Cannot proceed due to missing external dependencies or assets.
- `[REQUIRES OWNER APPROVAL]`: Needs explicit sign-off from Product Owner before altering.
