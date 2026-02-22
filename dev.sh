#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

PORTS=(3000 3001 5173)

for port in "${PORTS[@]}"; do
  pid=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Killing process $pid on port $port"
    kill -9 $pid
  fi
done

trap 'kill 0' EXIT

echo "Starting API server on :3001..."
bun run --cwd packages/api dev &

echo "Starting Web server on :3000..."
bun run --cwd packages/web dev &

wait
