FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /llm-proxy ./cmd

FROM gcr.io/distroless/static-debian12
WORKDIR /
COPY --from=builder /llm-proxy /llm-proxy
EXPOSE 9000
USER 65532:65532
ENTRYPOINT ["/llm-proxy"]
