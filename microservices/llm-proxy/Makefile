APP_NAME=llm-proxy
BINARY=llm-proxy
PORT?=9000

.PHONY: tidy build run docker-build

tidy:
	go mod tidy

build:
	GOOS=darwin GOARCH=amd64 go build -o bin/$(BINARY) ./cmd

run:
	APP_PORT=$(PORT) go run ./cmd

docker-build:
	docker build -t shopmindai/$(APP_NAME):dev .
