# Auth Service

A production-ready authentication microservice built with Go, Gin framework, and Keycloak integration.

## Features

- **Authentication**: Login, registration, token refresh, logout
- **User Management**: Profile management, password change
- **JWT Validation**: Middleware for protecting routes
- **Keycloak Integration**: Full integration with Keycloak for identity management
- **Docker Support**: Complete Docker setup with docker-compose
- **Logging**: Structured logging with logrus
- **Configuration**: Environment-based configuration with Viper

## Project Structure

```
auth-service/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go           # Configuration management
│   ├── handlers/
│   │   ├── auth.go            # Authentication handlers
│   │   └── user.go            # User management handlers
│   ├── services/
│   │   └── keycloak.go        # Keycloak service wrapper
│   ├── middleware/
│   │   └── auth_middleware.go # JWT validation middleware
│   └── models/
│       └── auth.go            # Data models
├── pkg/
│   └── logger/
│       └── logger.go          # Reusable logger package
├── go.mod                     # Go module file
├── go.sum                     # Go dependencies checksum
├── Dockerfile                 # Docker build configuration
├── docker-compose.yml         # Docker Compose configuration
└── README.md                  # This file
```

## API Endpoints

### Public Endpoints (No Authentication Required)

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout
- `GET /health` - Health check

### Protected Endpoints (Authentication Required)

- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile
- `POST /api/v1/user/change-password` - Change password

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
SERVER_ADDRESS=:8080
SERVER_PORT=8080
SERVER_MODE=debug

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8081/auth
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=auth-service
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASS=admin

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ISSUER=auth-service
JWT_EXPIRY=3600

# Logging Configuration
LOG_LEVEL=info
```

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository
2. Create a `.env` file with your configuration
3. Run the services:

```bash
docker-compose up -d
```

This will start:
- Auth service on port 8080
- Keycloak on port 8081
- Optional PostgreSQL and Redis (with `--profile production`)

### Manual Setup

1. Install Go 1.21 or later
2. Install dependencies:

```bash
go mod download
```

3. Start Keycloak (using Docker):

```bash
docker run -p 8081:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:23.0 start-dev
```

4. Create a `.env` file with your configuration
5. Run the application:

```bash
go run cmd/main.go
```

## Keycloak Setup

1. Access Keycloak admin console at `http://localhost:8081`
2. Login with admin/admin
3. Create a new realm or use the master realm
4. Create a new client:
   - Client ID: `auth-service`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `*`
   - Service Accounts Enabled: `ON`

## API Usage Examples

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

### Register

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Get Profile (Protected)

```bash
curl -X GET http://localhost:8080/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Development

### Running Tests

```bash
go test ./...
```

### Building

```bash
go build -o auth-service cmd/main.go
```

### Docker Build

```bash
docker build -t auth-service .
```

## Production Considerations

1. **Security**:
   - Change default passwords and secrets
   - Use HTTPS in production
   - Implement proper CORS policies
   - Add rate limiting

2. **Database**:
   - Use PostgreSQL instead of H2 for Keycloak
   - Implement database migrations
   - Add connection pooling

3. **Monitoring**:
   - Add metrics collection (Prometheus)
   - Implement health checks
   - Add distributed tracing

4. **Scaling**:
   - Use Redis for session storage
   - Implement load balancing
   - Add horizontal pod autoscaling

## License

MIT License
