#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building and running test containers..."
docker compose -f docker-compose.test.yml up --abort-on-container-exit --build
RC=$?

echo "Bringing down containers (cleanup)"
docker compose -f docker-compose.test.yml down --volumes --remove-orphans || true

exit $RC
