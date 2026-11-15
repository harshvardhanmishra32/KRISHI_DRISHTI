#!/usr/bin/env bash
# ==============================================================================
# Krishi Drishti - Unified Development Startup Script
# Starts Docker (PostGIS + Redis), FastAPI Backend (8001), and Next.js (3001)
# ==============================================================================

set -e

# Change to project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "🌾 Starting Krishi Drishti Development Environment"
echo "=================================================="

# 1. Start Docker Infrastructure (PostgreSQL 16 + PostGIS + Redis 7)
if command -v docker &> /dev/null; then
    echo "📦 Checking Docker infrastructure (PostGIS + Redis)..."
    docker compose up -d
else
    echo "⚠️ Docker not detected. Make sure PostgreSQL (5433) and Redis (6380) are running."
fi

# 2. Clean shutdown handler on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down Krishi Drishti servers..."
    kill $(jobs -p) 2>/dev/null || true
    echo "✅ All servers stopped cleanly."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start Backend (FastAPI on port 8001)
echo "🚀 Starting FastAPI backend (http://localhost:8001)..."
cd "$SCRIPT_DIR/backend"
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

# Give backend a moment to initialize
sleep 2

# 4. Start Frontend (Next.js on port 3001)
echo "💻 Starting Next.js frontend (http://localhost:3001)..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

cd "$SCRIPT_DIR"
echo ""
echo "=================================================="
echo "🎉 Krishi Drishti is live!"
echo "   📱 Web Application:   http://localhost:3001"
echo "   📖 Swagger API Docs:  http://localhost:8001/docs"
echo "   🩺 Health Endpoint:   http://localhost:8001/health"
echo "=================================================="
echo "💡 Press [Ctrl + C] anytime to stop both servers."
echo ""

# Keep running and wait for background processes
wait
