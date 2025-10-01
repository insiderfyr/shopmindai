# Auth Service (ShopMindAI)

Go-based authentication microservice that fronts Keycloak. The service ships with a Docker Compose stack (Postgres + Redis + Keycloak + auth) and exposes JSON APIs for registration, login, profile management, and basic frontend bootstrapping.

## Quickstart

### With Docker Compose
```bash
# from microservices/auth
cp .env.example .env    # if you keep secrets locally (optional)
docker compose up -d --build
```
The stack publishes the auth API on `http://localhost:8088`.

### Local Go Run
```bash
go run ./cmd/main.go
```
The server listens on the configured `SERVER_ADDRESS` (defaults to `:8080`).

## Key Components

- `cmd/main.go` – Gin HTTP server bootstrap, routing, graceful shutdown, health probe (`./auth-service --health-check`).
- `internal/config` – Viper-based config loader for `.env` + environment overrides.
- `internal/handlers` – Gin handlers for auth, user profile, and frontend helper endpoints.
- `internal/services` – Keycloak client wrapper using `gocloak`.
- `internal/middleware` – JWT validation, rate limiting, logging, and basic input checks.
- `docker-compose.yml` – Auth + Keycloak + Postgres + Redis stack (auth exposed on port 8088).

## Environment Variables

All keys are read via Viper; set them in `.env` or the shell.

| Group      | Keys (examples) |
|------------|-----------------|
| Server     | `SERVER_ADDRESS`, `SERVER_MODE` |
| Keycloak   | `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ADMIN_USER`, `KEYCLOAK_ADMIN_PASS` |
| Database   | `POSTGRES_PASSWORD`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` |
| Redis      | `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT` |
| JWT / Misc | `JWT_SECRET_KEY`, `LOG_LEVEL` |

Defaults are provided in `internal/config/config.go` for local development.

## API Surface

Base path: `http://localhost:8088` (use `/api/v1/...` for versioned routes).

### Auth (public)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### User (JWT required)
- `GET /api/v1/user/profile`
- `PUT /api/v1/user/profile`
- `POST /api/v1/user/change-password`

### Frontend bootstrap helpers
- `GET /api/auth/config`
- `GET /api/app/info`
- `GET /api/health/detailed`
- `GET /api/endpoints`
- `GET /api/startup`
- `GET /api/banner`
- `GET /api/config`

### Health & Metrics
- `GET /health`
- `GET /metrics`

## Health Check from Docker
The container uses the binary’s built-in probe:
```bash
docker compose exec auth-service ./auth-service --health-check
```
Exit code `0` indicates success.

## Testing
```bash
go test ./...
```
(Some environments may need write access to `$GOCACHE`; run locally if sandboxed.)

## Useful Ports

| Service   | Host Port |
|-----------|-----------|
| Auth API  | 8088      |
| Keycloak  | 8081      |
| Postgres  | 5432      |
| Redis     | 6379      |
