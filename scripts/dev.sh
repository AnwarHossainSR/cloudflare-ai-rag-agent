#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend on http://localhost:4000"
(
  cd apps/backend
  bun run start:dev
) &
backend_pid=$!

echo "Starting frontend on http://localhost:3000"
(
  cd apps/frontend
  bun run dev
) &
frontend_pid=$!

wait
