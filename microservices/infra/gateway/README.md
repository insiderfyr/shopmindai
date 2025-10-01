# Gateway Deployment

This directory provides the Kong declarative gateway configuration for ShopMindAI. It assumes the auth stack is already running and has created the shared Docker network named `auth_shopmind-network`.

## Prerequisites

- Docker and the Compose plugin installed locally
- The auth compose stack running (`docker compose up -d` from `microservices/auth`) so that the shared network and upstream services are available

## Usage

1. Build the Kong image (optional when configuration changes only):
   ```bash
   docker compose build
   ```
2. Start the gateway:
   ```bash
   docker compose up -d
   ```
3. Validate the proxy is routing to the auth service:
   ```bash
   docker run --rm --network auth_shopmind-network curlimages/curl:8.10.1 -i http://kong-gateway:8000/health
   ```

## Configuration

- `docker-compose.yml` runs Kong in DB-less mode and mounts `kong.yaml` as the declarative configuration.
- `kong.yaml` defines routes for auth API calls (`/api/v1/auth`), health endpoints (`/health`, `/metrics`), and exposes CORS plus basic rate limiting for public traffic.

To update the gateway, modify `kong.yaml` and restart Kong:
```bash
docker compose restart
```
