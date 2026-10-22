#!/usr/bin/env bash
# Start backend + frontend for the Smart Hospital Triage demo.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
(cd "$ROOT/backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000) &
BACK_PID=$!
(cd "$ROOT/frontend" && npm run dev) &
FRONT_PID=$!
echo "Backend : http://localhost:8000  (docs: /api/docs)"
echo "Frontend: http://localhost:5173"
echo "Login: admin/admin123  doctor/doctor123  triage/triage123  patient/patient123"
trap "kill $BACK_PID $FRONT_PID" EXIT
wait
