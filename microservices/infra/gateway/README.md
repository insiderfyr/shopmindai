# Gateway Deployment

Kong is used as the lightweight API gateway for local development. The configuration is declarative (DB-less) and lives entirely in this directory.

## Prerequisites

- Docker + Compose plugin installed
- The auth stack running (`cd ../../auth && docker compose up -d`) so the external network `auth_shopmind-network` exists and the upstream service `shopmind-auth-service` is reachable

## How to Run

```bash
# build only when the image must be refreshed
docker compose build

# start Kong in detached mode
docker compose up -d
```

Kong publishes:

| Port | Purpose |
|------|---------|
| 8000 | HTTP proxy |
| 8443 | HTTPS proxy |
| 8001 | Admin API |
| 8444 | Admin API (HTTPS) |

## Verifying the Proxy

```bash
# from anywhere on the host
curl -i http://localhost:8000/health

# from inside the Docker network
docker run --rm --network auth_shopmind-network curlimages/curl:8.10.1 -i http://kong-gateway:8000/health
```

Both commands should return the auth service health JSON.

## Configuration Notes

- `docker-compose.yml` starts a single Kong container in DB-less mode; the `version` key is ignored by modern Compose but retained for compatibility.
- `kong.yaml` currently exposes two routes:
  - `/api/v1/auth` → `shopmind-auth-service:8080` (all auth APIs)
  - `/health` and `/metrics` → `shopmind-auth-service:8080` (GET only)
- Global plugins enabled:
  - `cors` for local SPAs (`http://localhost:3000`, `http://localhost:3080`)
  - `rate-limiting` with a local in-memory policy (600 requests/minute)

Update `kong.yaml` to add more upstream services, then reload Kong:
```bash
docker compose restart
```
