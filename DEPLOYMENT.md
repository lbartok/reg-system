# Deployment & CI/CD notes

This document describes how to deploy `reg-system` to a server that runs a self-hosted GitHub Actions runner (example IP: 192.168.111.143).

Quick checklist

- Install and register a GitHub self-hosted runner on the target server (see GitHub docs). Use the `self-hosted` label and optionally add a custom label (e.g., `proxmox-host` or `runner-192-168-111-143`).
- Add repository secrets (Settings → Secrets -> Actions):
  - `PROJECT_ENV` — full `.env` contents to write on the runner (used by workflows)
  - `NPM_URL`, `NPM_USER`, `NPM_PASS`, `DOMAIN`, `TARGET_HOST`, `TARGET_PORT` (only if using Nginx Proxy Manager automation)
- Ensure `docker` and `docker compose` are installed on the runner and that the runner user can run docker commands (or use `sudo`).

Workflows

- `.github/workflows/deploy.yml` — an existing deploy workflow that targets `runs-on: [ self-hosted, proxmox-host ]`.
- `.github/workflows/deploy-to-self-hosted.yml` — new workflow that targets `runs-on: self-hosted` and will:
  1. write `.env` from secret `PROJECT_ENV`
  2. run `docker compose pull || true` and `docker compose up -d --build --remove-orphans`
  3. wait for `http://localhost:3000/` to respond
  4. optionally call `scripts/npm-proxy-sync.sh` to configure Nginx Proxy Manager

Secrets and `.env`

- We recommend keeping runtime config in `PROJECT_ENV` (the workflow writes this file to the runner). Use `.env.example` as a template to build the secret.
- Minimal `.env` for Hello World:

  PORT=3000

Optional phase-2 envs (IdP / OIDC):

  OIDC_CLIENT_ID=
  OIDC_CLIENT_SECRET=
  OIDC_ISSUER=

Runner/Network notes

- The runner's machine must allow ports 80/443 if you plan to expose the app publicly or let the reverse proxy handle TLS.
- For OIDC federation (Google/Microsoft), redirect URIs must be HTTPS and reachable by the IdP provider.

Next steps I can implement for you

- Tweak the deploy workflow to require a specific runner label (if you want the workflow to run only on 192.168.111.143). Provide the label or I can add a comment with instructions.
- Add a `docker-compose.auth.yml` and example Authentik deployment + OIDC client registration steps.
- Wire the app to accept OIDC tokens and surface the user profile on requests.
