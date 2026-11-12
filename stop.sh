#!/bin/bash
# ==============================================================================
# AgriForecasting — Stop All Local Services
# ==============================================================================

echo "🛑 Stopping AgriForecasting services..."

# Kill by PID if available
[ -f /tmp/agri_frontend.pid ] && kill -9 $(cat /tmp/agri_frontend.pid) 2>/dev/null || true
[ -f /tmp/agri_backend.pid ] && kill -9 $(cat /tmp/agri_backend.pid) 2>/dev/null || true
[ -f /tmp/agri_model_service.pid ] && kill -9 $(cat /tmp/agri_model_service.pid) 2>/dev/null || true

rm -f /tmp/agri_frontend.pid /tmp/agri_backend.pid /tmp/agri_model_service.pid 2>/dev/null || true

# Clean ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped."
