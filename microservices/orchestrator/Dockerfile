FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /orchestrator ./cmd

FROM gcr.io/distroless/static-debian12
WORKDIR /
COPY --from=builder /orchestrator /orchestrator
EXPOSE 8080
USER 65532:65532
ENTRYPOINT ["/orchestrator"]
