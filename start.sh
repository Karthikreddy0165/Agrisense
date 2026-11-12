#!/bin/bash
# ==============================================================================
# AgriForecasting — Unified One-Click Local Runner
# Starts Python Model Service, Java Spring Boot Backend, and Next.js Frontend.
# Requires NO Docker and NO PostgreSQL — runs with zero setup!
# ==============================================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🌾 Starting AgriForecasting Platform..."

# 1. Kill any existing instances on ports 8000, 8080, 3000
echo "🧹 Cleaning active ports (8000, 8080, 3000)..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 2. Check / Setup Python Virtual Environment
PYTHON_BIN=""
if [ -d "$PROJECT_ROOT/model-service/venv/bin" ]; then
    PYTHON_BIN="$PROJECT_ROOT/model-service/venv/bin/python"
    UVICORN_BIN="$PROJECT_ROOT/model-service/venv/bin/uvicorn"
elif [ -d "/tmp/agri_test_venv/bin" ]; then
    PYTHON_BIN="/tmp/agri_test_venv/bin/python"
    UVICORN_BIN="/tmp/agri_test_venv/bin/uvicorn"
else
    echo "⚠️ Setting up python venv in model-service/venv..."
    python3 -m venv "$PROJECT_ROOT/model-service/venv"
    "$PROJECT_ROOT/model-service/venv/bin/pip" install -q -r "$PROJECT_ROOT/model-service/requirements.txt"
    PYTHON_BIN="$PROJECT_ROOT/model-service/venv/bin/python"
    UVICORN_BIN="$PROJECT_ROOT/model-service/venv/bin/uvicorn"
fi

# 3. Start Python Model Service (Port 8000)
echo "🤖 [1/3] Launching Python FastAPI Model Service on port 8000..."
cd "$PROJECT_ROOT/model-service"
nohup "$UVICORN_BIN" app.main:app --host 0.0.0.0 --port 8000 > /tmp/agri_model_service.log 2>&1 &
echo $! > /tmp/agri_model_service.pid

# 4. Start Java Spring Boot Backend (Port 8080)
echo "☕ [2/3] Launching Java Spring Boot Backend on port 8080..."
cd "$PROJECT_ROOT/backend"
if [ ! -f "target/agri-forecasting-backend-1.0.0.jar" ]; then
    echo "📦 Packaging Java JAR..."
    ./mvnw package -DskipTests -q
fi
nohup java -jar target/agri-forecasting-backend-1.0.0.jar > /tmp/agri_backend.log 2>&1 &
echo $! > /tmp/agri_backend.pid

# 5. Start Next.js Frontend (Port 3000)
echo "💻 [3/3] Launching Next.js Frontend on port 3000..."
cd "$PROJECT_ROOT/frontend"
nohup npm start > /tmp/agri_frontend.log 2>&1 &
echo $! > /tmp/agri_frontend.pid

# 6. Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 4

echo "=========================================================="
echo "🎉 AgriForecasting is LIVE!"
echo "👉 Open in your browser: http://localhost:3000"
echo "👉 Backend API:          http://localhost:8080/api/v1/health"
echo "👉 Model Inference:      http://localhost:8000/ready"
echo "=========================================================="
echo "To view logs:"
echo "  tail -f /tmp/agri_frontend.log"
echo "  tail -f /tmp/agri_backend.log"
echo "  tail -f /tmp/agri_model_service.log"
echo "To stop all services: ./stop.sh"
