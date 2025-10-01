# Auth Service with Keycloak - ShopMindAI

This is an authentication microservice project built with Go, which uses Keycloak as an Identity Provider. The project runs in a Docker containerized environment using Docker Compose, along with PostgreSQL for storing authentication data and Redis for caching and sessions.

---

## Project Structure

```
.
├── auth-service
├── cmd
│   └── main.go
├── docker-compose.yml
├── Dockerfile
├── execute.sh
├── go.mod
├── go.sum
├── internal
│   ├── config
│   │   └── config.go
│   ├── handlers
│   │   ├── auth_test.go
│   │   ├── auth.go
│   │   ├── frontend.go
│   │   └── user.go
│   ├── middleware
│   │   └── auth_middleware.go
│   ├── models
│   │   └── auth.go
│   └── services
│       └── keycloak.go
├── keycloak
│   └── Dockerfile
├── keycloak-23.0.7
│   └── version.txt
├── main
├── Makefile
├── pkg
│   └── logger
│       └── logger.go
├── README.md
├── shopmindai-realm.json
└── test
    └── integration_test.go
```

---

## Running the Service

### Run with Docker
```bash
docker-compose up --build
```

### Run Locally
```bash
go run cmd/main.go
```

---

## Environment Variables

### Database
- `POSTGRES_PASSWORD`

### Redis
- `REDIS_PASSWORD`

### Keycloak
- `KEYCLOAK_ADMIN`
- `KEYCLOAK_ADMIN_PASSWORD`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`

### Internal Mappings (Optional)
These are also used for Keycloak and the database.
- `KEYCLOAK_ADMIN_USER=${KEYCLOAK_ADMIN}`
- `KEYCLOAK_ADMIN_PASS=${KEYCLOAK_ADMIN_PASSWORD}`
- `KC_DB_PASSWORD=${POSTGRES_PASSWORD}`
- `DB_PASSWORD=${POSTGRES_PASSWORD}`

### Logging (from code)
- `LOG_LEVEL=debug`

---

## API Endpoints

This microservice exposes a set of REST API endpoints using the **Gin** framework, organized into functional groups:

### Authentication (`/api/auth`)
Handles login and security flows:
- `POST /login` – Authenticate a user and return a JWT token.
- `POST /register` – Create a new user account.
- `POST /refresh` – Refresh the access token.
- `POST /logout` – Invalidate the current session.
- `GET /config` – Retrieve Keycloak client configuration.

### User Profile (`/api/auth`)
Provides access and update capabilities for user data:
- `GET /profile` – Fetch the current user profile.
- `PUT /profile` – Update user profile information.
- `POST /change-password` – Change the user password.

### General API (`/api`)
Endpoints for application information and status:
- `GET /banner` – Retrieve banner information.
- `GET /config` – Retrieve application configuration.
- `GET /app/info` – Fetch application details.
- `GET /health/detailed` – Perform a detailed health check.
- `GET /endpoints` – List all exposed endpoints.
- `GET /startup` – Check service startup status.

### System
Monitoring endpoints:
- `GET /health` – Basic health check.
- `GET /metrics` – Monitoring metrics (e.g., for Prometheus).

These endpoints provide core functionality for authentication and user management, while also supporting monitoring and integration of the microservice within the ShopMindAI architecture.
