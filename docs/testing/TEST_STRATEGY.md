# Testing Strategy & Quality Assurance Philosophy — Agri

## 1. Testing Philosophy

Agri enforces a **multi-tiered verification pyramid**:

```text
                  ▲
                 / \
                /   \     Tier 4: End-to-End Real Browser QA (Playwright)
               / E2E \    10 Critical User Journeys across Desktop & Mobile
              /-------\
             /   API   \   Tier 3: Automated Integration & REST API Tests
            /  Suites   \  22 Endpoints, Error Codes, JSON Schema, Rate Limits
           /-------------\
          /  Inference &  \ Tier 2: Model & Service Component Tests
         /   Data Tests    \ 4 Pytest inference tests, Database integrity checks
        /-------------------\
       /   Unit Test Layer   \ Tier 1: Core Unit Tests
      /                       \ 12 JUnit 5 backend tests, TypeScript compile checks
     /-------------------------\
```

---

## 2. Core Testing Principles

1. **Never Assume Code Compiles:** Every build is verified via `mvn test`, `pytest`, `tsc --noEmit`, and `next build`.
2. **Never Assume Events Work Without Browser QA:** Visual interactions, map panning, dropdown cascades, and modal dialogs are verified in headless Google Chrome via Playwright automation.
3. **Never Fabricate Test Success:** Every test report must reflect actual test execution output from the command line.
4. **Data Isolation:** Unit tests run in-memory with H2 test profiles (`application-test.properties`); integration and browser QA run against live PostgreSQL and FastAPI daemons.
