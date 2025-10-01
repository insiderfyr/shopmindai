# Development Tooling Guide

This note captures the current local boot flow, environment layout, and the baseline we will build on before expanding the chat stack. Follow these steps sequentially whenever you need a clean dev reset.

## Startup Flow (Mock → Vite → Auth/Keycloak → Kong)

1. **Mock API** (`mock/mock-server`)
   - Install once with `npm install`.
   - Run locally with `npm run dev` (nodemon) or `npm start` (plain node).
   - Exposes HTTP on `http://localhost:3080`; `GET /health` must return `{ status: 'OK' }`.
2. **Vite Frontend** (`apps/web`)
   - Use Node 20+ (`nvm use 20` recommended); install dependencies with `npm ci` to respect `package-lock.json`.
   - Launch `npm run dev -- --host 0.0.0.0 --port 3090` to line up with the proxy rules.
   - Vite proxies `/api` traffic to Kong, so it must start before you open the browser.
3. **Auth Stack + Keycloak** (`microservices/auth`)
   - Copy `env/shared/.env` and `env/auth/.env` (see Environment Layout) or export the same keys.
   - Bring up the stack with `docker compose up -d --build`; this launches Postgres, Redis, Keycloak, and the Go auth façade on `http://localhost:8088`.
   - Health probe: `curl http://localhost:8088/health` and `curl http://localhost:8088/api/health/detailed`.
4. **Kong Gateway** (`microservices/infra/gateway`)
   - Ensure `env/shared/.env` defines `KONG_ADMIN_TOKEN` if you change the default.
   - `docker compose up -d` exposes proxy traffic on `http://localhost:8088` and admin on `http://localhost:8001`.
   - Verify with `docker compose ps` and `curl http://localhost:8088/status/200` (default Kong status endpoint configured in `kong.yaml`).

> Ordering matters: start the mock API before Vite so Vite finds `/health`, then make sure auth + Keycloak are running before Kong registers upstreams. If a service crashes, re-run its `docker compose up` in place—Kong will pick it up as soon as the health check passes.

## Pre-flight Health Checklist

Run these after the four services are up. Do not move on to other services until every item passes.

- `curl http://localhost:3080/health` → mock server responds `status: OK`.
- `npm run lint` inside `apps/web` (optional but quick confidence that the workspace installed cleanly).
- `curl http://localhost:8088/health` → auth service up.
- `curl http://localhost:8088/api/startup` → Kong proxying through successfully.
- `docker compose -f microservices/infra/gateway/docker-compose.yml ps` → `kong-gateway` running and healthy.
- Optional: `docker compose -f microservices/auth/docker-compose.yml exec auth-service ./auth-service --health-check` for a zero-exit probe.

Document failures in the service-specific README before touching other areas.

## Environment Layout & Overrides

We now source all shared values from `env/shared/.env` and override per service via local copies of the examples below. `direnv` or `dotenvx` can load them automatically, but a plain `export $(grep -v '^#' env/.../.env | xargs)` works too.

| Scope | Example file | Purpose |
| ----- | ------------- | ------- |
| Shared | `env/shared/.env.example` | Values reused across services (gateway URLs, LLM defaults, auth realm names). Copy to `env/shared/.env` and source globally.
| Frontend (Vite) | uses shared file only | Pulls `VITE_*` keys from `env/shared/.env`; no separate override necessary.
| Auth service | `env/auth/.env.example` | Keys for Keycloak, JWT, Postgres, and Redis. Copy alongside shared file: `cp env/auth/.env.example env/auth/.env` then `ln -s ../env/auth/.env microservices/auth/.env` or copy the file in place.
| Orchestrator | `env/orchestrator/.env.example` | Downstream API locations (`LLM_PROXY_URL`, `AUTH_SERVICE_URL`, Keycloak issuer).
| LLM proxy | `env/llm-proxy/.env.example` | Target provider + model defaults.
| Mock API | `env/mock/.env.example` | Port and host tweaks for the mock server.

Keep the `.example` files versioned; add the real `.env` copies to `.gitignore` (already handled by the existing rules).

## Dependency Baseline (Freeze Before Chat Work)

- **Frontend (`apps/web`)** – stick to `npm ci` (not `npm install`) so we stay on the `package-lock.json` snapshot (Vite 6.3.x, React 18.2). Verify Node 20.x via `node --version`.
- **Mock server (`mock/mock-server`)** – also run `npm ci`; the lock currently pins Express 4.19.x and nodemon 3.x.
- **Go services** – build with the Go versions declared in each module (`auth` 1.21, `orchestrator` 1.22, `llm-proxy` 1.25.1). Use `go env GOVERSION` or `asdf`/`gvm` to keep toolchains aligned. `go.sum` files already lock indirect deps; please do not run `go get -u` until we plan a bulk upgrade.
- **Docker images** – Kong is pinned to `3.6`, Postgres & Redis versions come from the auth docker-compose. Update tags deliberately and in lockstep across environments.

When you add a library, update the appropriate lock file and call it out in PR descriptions so we know a freeze has moved.

## Near-term Workstreams

1. **Frontend hardening & cleanup**
   - Trim remaining LibreChat defaults (branding, color palette, leftover routes).
   - Tighten authentication flows once Keycloak integration is stable (token refresh, logout).
   - Add smoke tests for the chat input, attachment flow, and feature toggles (Vitest/Jest).
2. **Chat microservices build-out**
   - Flesh out the orchestrator’s routing to the Go chat service (or stub HTTP handlers if we stay mock-first).
   - Define a contract between orchestrator ↔ llm-proxy (request/response schemas, error envelope).
   - Add observability hooks (structured logs to stdout + `/metrics`).
3. **Integration & E2E tests**
   - Wire Playwright (or Cypress) against the dev stack via Kong.
   - Seed Keycloak with test identities and script login for the E2E runner.
   - Compose nightly pipeline that runs mock + Vite + services to keep drift visible.

Treat these streams as parallel efforts once the health checklist goes green.
