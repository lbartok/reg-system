# Copilot instructions for reg-system

Purpose: give AI coding agents the minimal, actionable context to be productive in this repository.

- Project type: Node.js backend (entry: `index.js`) with Docker + Docker Compose orchestration. There is a separate `evaluation/` Python harness for offline evaluation.
- Key files:
  - `index.js` — application entrypoint and primary server logic.
  - `package.json` — npm scripts and dependencies; add or update scripts here when changing run/test workflows.
  - `Dockerfile`, `docker-compose.yml`, `docker-compose.test.yml` — containerization and test orchestration. Changes to server code may require rebuilding images.
  - `tracing.js` — tracing/instrumentation helpers used across the app.
  - `scripts/run-local-test.sh` and `scripts/npm-proxy-sync.sh` — useful local helpers; follow their conventions when adding new helper scripts.
  - `evaluation/` — Python evaluation runner and dataset; treat as a consumer of the service (not part of the Node runtime).

Big picture & architecture notes
- The repository is a single-service Node app wrapped by Docker Compose. The app exposes HTTP endpoints from `index.js`; instrumentation is centralized in `tracing.js`.
- Tests or integration checks may be run via `docker-compose.test.yml` rather than plain `npm test`. Prefer using the compose test file if a change touches networking or container behaviour.

Developer workflows (explicit)
- Run locally (node): `npm install` then `node index.js` or `npm run start` if a `start` script exists in `package.json`.
- Run in Docker: build with `docker build -t reg-system .` and run with `docker-compose up` (or `docker-compose -f docker-compose.test.yml up` for test runs).
- Rebuild after dependency or Dockerfile changes: `docker-compose build --no-cache` then `docker-compose up --force-recreate`.
- Evaluation harness: `evaluation/run_evaluation.py` uses `evaluation/requirements.txt` (Python environment required). Treat `evaluation/` as an external consumer — ensure API compatibility.

Conventions & patterns observed
- CommonJS module style (require/exports) is used — keep new files consistent with that style unless the codebase already uses ES modules.
- Centralized tracing: add new instrumentation calls in `tracing.js` rather than scattering tracing logic across handlers.
- Minimal surface edits: prefer small, focused PRs that update `package.json` scripts and the `Dockerfile` together when changing runtime commands.

Integration points & external dependencies
- Containers via Docker/Docker Compose; CI/test flows likely rely on `docker-compose.test.yml` (inspect that file before changing test flows).
- The `evaluation/` folder contains Python code that reads `dataset/requests.json`; do not change the evaluation API without updating the evaluation harness.

How to make code changes safely (practical examples)
- Adding a new HTTP route:
  1. Add the handler in `index.js` following existing route styles.
  2. Add tracing calls using helpers from `tracing.js`.
  3. If the route requires a new dependency, add it to `package.json` and update the `Dockerfile` (re-run `npm install` during image build).
  4. Rebuild images and run `docker-compose up` to smoke-test.

- Adding a new npm script (example):
  - Edit `package.json` "scripts" and add `"local:start": "node index.js"`. Commit and test locally before updating Docker image layers.

What NOT to change blindly
- Do not alter `evaluation/` interfaces or `dataset/requests.json` without updating the evaluation runner.
- Avoid changing container entrypoints or port mappings in `docker-compose.yml` without validating with `docker-compose.test.yml`.

Questions for the repo owner
- Confirm the primary local dev command (is there a preferred `npm run` script?).
- Point to any CI or test runner docs if present (not detected automatically).

If anything here is incorrect or missing, tell me what to expand and I will update this file.
