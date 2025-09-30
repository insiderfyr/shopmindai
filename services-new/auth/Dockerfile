# Build stage
FROM golang:1.21-alpine AS builder

# Install git and ca-certificates for dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Create appuser for security
RUN adduser -D -s /bin/sh -u 1001 appuser

# Set working directory
WORKDIR /app

# Copy go module files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -a -installsuffix cgo \
    -ldflags='-w -s -extldflags "-static"' \
    -o auth-service ./cmd/main.go

# Runtime stage - minimal image
FROM scratch

# Copy CA certificates for HTTPS requests
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy user info for security
COPY --from=builder /etc/passwd /etc/passwd

# Set working directory
WORKDIR /app

# Copy the binary
COPY --from=builder /app/auth-service ./

# Copy environment file
COPY --from=builder /app/.env* ./

# Use non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["/app/auth-service", "--health-check"] || exit 1

# Run the application
ENTRYPOINT ["./auth-service"]
