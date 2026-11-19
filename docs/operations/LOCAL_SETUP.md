# Local Development Setup Guide — Agri

This guide walks a new engineer through setting up the complete Agri platform locally from a clean terminal.

---

## 1. Prerequisites

Ensure your workstation has the following installed:
- **Node.js:** v20.x or v22.x LTS (`node -v`)
- **Java Development Kit (JDK):** JDK 17 or JDK 21 LTS (`java -version`, `javac -version`)
- **Apache Maven:** 3.8+ (`mvn -v`)
- **Python:** Python 3.10+ (`python3 --version`)
- **PostgreSQL:** Version 14 or higher (`psql --version`)
- **Redis:** Redis 6.x or 7.x (`redis-cli ping`)
- **Git**

---

## 2. Step-by-Step Installation

### Step 1: Clone Repository & Create Environment Configuration
```bash
cd /Users/karthikreddy/Desktop/Agri
cp .env.example .env
```

### Step 2: Set Up PostgreSQL Database
```bash
# Start PostgreSQL service if not running
brew services start postgresql@14 # On macOS
# or sudo systemctl start postgresql # On Linux

# Create database and user
psql -U postgres -c "CREATE DATABASE agriforecasting;"
psql -U postgres -d agriforecasting -f scripts/create_schema.sql
```

### Step 3: Run High-Speed Data Ingestion
```bash
# Create and activate Python virtual environment
python3 -m venv /tmp/agri_test_venv
source /tmp/agri_test_venv/bin/activate
pip install -r model-service/requirements.txt psycopg2-binary

# Run geography ingestion (30 states, 913 districts, 2,643 mandis)
python3 scripts/ingest_national_geography.py

# Run historical prices streaming COPY (1.136M records in ~16s)
python3 scripts/ingest_historical_prices.py
```

### Step 4: Start Python Inference Service
```bash
cd /Users/karthikreddy/Desktop/Agri/model-service
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 &
# Verify readiness
curl http://localhost:8000/ready
```

### Step 5: Build & Start Spring Boot Backend
```bash
cd /Users/karthikreddy/Desktop/Agri/backend
mvn clean package -DskipTests
java -jar target/agri-forecasting-backend-1.0.0.jar &
# Verify health
curl http://localhost:8080/api/v1/health
```

### Step 6: Start Next.js Frontend
```bash
cd /Users/karthikreddy/Desktop/Agri/frontend
npm install
npm run build
npm start &
# Open in browser: http://localhost:3000
```
