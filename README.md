# reg-system

Small Node.js demo service (Express) with Docker + Docker Compose and a CI/CD workflow targeting self-hosted GitHub Actions runners.

Quick overview
- Entry: `index.js` (listens on `process.env.PORT || 3000`).
- Container: `Dockerfile` uses `node:18-alpine` and exposes port `3000`.
- Compose: `docker-compose.yml` defines service `reg-system` mapping `3000:3000`.
- Tracing bootstrap: `tracing.js` (optional, enabled with `node -r ./tracing.js`).

Quick start (local)

Install dependencies and run locally:

```bash
npm install
node index.js
```

Run in Docker Compose (build + run):

```bash
docker compose up --build
```

Environment
- See `.env.example` for expected variables (PORT, OTEL_*, OIDC_* placeholders, and Nginx Proxy Manager automation vars).
- For CI deploys we store a full `.env` in the `PROJECT_ENV` secret which workflows write to the runner as `.env`.

CI / Deployment
- There are two deploy workflows: `.github/workflows/deploy.yml` (targets `[self-hosted, proxmox-host]`) and `.github/workflows/deploy-to-self-hosted.yml` (targets `self-hosted`).
- Workflows perform these steps on the self-hosted runner:
  - checkout repository
  - write `.env` from secret `PROJECT_ENV`
  - `docker compose pull || true` and `docker compose up -d --build --remove-orphans`
  - wait for healthcheck at `http://localhost:3000/`
  - optional: call `scripts/npm-proxy-sync.sh` to register the host in Nginx Proxy Manager

Required secrets (example)
- `PROJECT_ENV` — full `.env` contents
- `NPM_URL`, `NPM_USER`, `NPM_PASS`, `DOMAIN`, `TARGET_HOST`, `TARGET_PORT` — optional, used by proxy automation
- Registry creds (if pulling private images): `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`

Self-hosted runner notes
- Install the runner from GitHub on the target host (192.168.111.143). Add the `self-hosted` label and optionally a custom label (e.g., `proxmox-host` or `runner-192-168-111-143`).
- Ensure `docker` and `docker compose` are installed and the runner user can run Docker commands (or `sudo` is available in the workflow).

Phase 2 — Identity Provider (Auth)
- Goal: run an IdP (Authentik recommended) + Postgres, configure federation with Google + Microsoft, and route via a reverse proxy (Traefik or Nginx Proxy Manager).
- High level:
  - Add `postgres` and `authentik` services in a `docker-compose.auth.yml` with persistent volumes.
  - Configure OIDC client values in the app via `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER`.
  - Ensure TLS termination on the proxy and correct redirect URIs for social providers.

What I can implement next
- Pin the deploy workflow to a specific runner label (provide the label you want).
- Add `docker-compose.auth.yml` with Authentik + Postgres example and registration notes for Google/Microsoft.
- Add sample middleware in `index.js` to accept an OIDC token and expose user profile + token to the Hello World responses.

Questions for you
- Which runner label should workflows target for the server at 192.168.111.143?
- Which domain(s) will you use for the app and IdP (required for OIDC redirect URIs)?
- Do you prefer Traefik or Nginx/NGINX Proxy Manager for TLS and routing?
