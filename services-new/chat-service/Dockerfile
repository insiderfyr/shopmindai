# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/chat-service ./cmd

# Runtime stage
FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /app
COPY --from=builder /out/chat-service /app/chat-service
ENV APP_PORT=8080
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/app/chat-service"]


