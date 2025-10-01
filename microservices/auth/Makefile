# ===========================================
# ShopMindAI Auth Service - Makefile
# ===========================================

.PHONY: help build run stop clean test setup logs dev

# Default target
.DEFAULT_GOAL := help

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
RESET := \033[0m

help: ## Show this help message
	@echo "$(CYAN)ShopMindAI Auth Service$(RESET)"
	@echo "$(CYAN)========================$(RESET)"
	@echo ""
	@echo "$(GREEN)Available commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""

build: ## Build the auth service binary
	@echo "$(BLUE)🔨 Building auth service...$(RESET)"
	@go mod tidy
	@go build -o auth-service cmd/main.go
	@echo "$(GREEN)✅ Build completed!$(RESET)"

run: ## Run the auth service locally (development mode)
	@echo "$(BLUE)🚀 Starting auth service in development mode...$(RESET)"
	@go run cmd/main.go

docker-build: ## Build Docker image
	@echo "$(BLUE)🐳 Building Docker image...$(RESET)"
	@docker build -t shopmindai/auth-service:latest .
	@echo "$(GREEN)✅ Docker image built!$(RESET)"

up: ## Start all services with Docker Compose
	@echo "$(BLUE)🚀 Starting all services...$(RESET)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Services started!$(RESET)"
	@echo "$(CYAN)📋 Service URLs:$(RESET)"
	@echo "  • Auth Service: http://localhost:8080"
	@echo "  • Keycloak: http://localhost:8081"
	@echo "  • PostgreSQL: localhost:5432"
	@echo "  • Redis: localhost:6379"

down: ## Stop all services
	@echo "$(YELLOW)⏹️ Stopping all services...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)✅ Services stopped!$(RESET)"

restart: down up ## Restart all services

setup: up ## Setup Keycloak with realm and test user
	@echo "$(BLUE)⚙️ Setting up Keycloak...$(RESET)"
	@sleep 10
	@chmod +x setup-keycloak.sh
	@./setup-keycloak.sh
	@echo "$(GREEN)✅ Setup completed!$(RESET)"

test: ## Run all tests
	@echo "$(BLUE)🧪 Running tests...$(RESET)"
	@go test -v ./...
	@echo "$(GREEN)✅ Tests completed!$(RESET)"

test-integration: ## Run integration tests
	@echo "$(BLUE)🧪 Running integration tests...$(RESET)"
	@chmod +x test-auth.sh
	@./test-auth.sh
	@echo "$(GREEN)✅ Integration tests completed!$(RESET)"

logs: ## Show logs for all services
	@echo "$(BLUE)📋 Showing service logs...$(RESET)"
	@docker-compose logs -f

logs-auth: ## Show logs for auth service only
	@echo "$(BLUE)📋 Showing auth service logs...$(RESET)"
	@docker-compose logs -f auth-service

logs-keycloak: ## Show logs for Keycloak only
	@echo "$(BLUE)📋 Showing Keycloak logs...$(RESET)"
	@docker-compose logs -f keycloak

clean: ## Clean up containers and volumes
	@echo "$(YELLOW)🧹 Cleaning up...$(RESET)"
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup completed!$(RESET)"

dev: ## Start development environment (with hot reload)
	@echo "$(BLUE)🛠️ Starting development environment...$(RESET)"
	@make setup
	@echo "$(CYAN)Starting auth service with hot reload...$(RESET)"
	@air || go run cmd/main.go

status: ## Check status of all services
	@echo "$(BLUE)📊 Service Status:$(RESET)"
	@docker-compose ps

health: ## Check health of all services
	@echo "$(BLUE)🏥 Health Checks:$(RESET)"
	@echo -n "Auth Service: "
	@curl -s http://localhost:8080/health | jq -r '.status' 2>/dev/null || echo "$(RED)DOWN$(RESET)"
	@echo -n "Keycloak: "
	@curl -s http://localhost:8081/health/ready >/dev/null 2>&1 && echo "$(GREEN)UP$(RESET)" || echo "$(RED)DOWN$(RESET)"
	@echo -n "PostgreSQL: "
	@docker-compose exec -T postgres pg_isready -U keycloak >/dev/null 2>&1 && echo "$(GREEN)UP$(RESET)" || echo "$(RED)DOWN$(RESET)"
	@echo -n "Redis: "
	@docker-compose exec -T redis redis-cli ping >/dev/null 2>&1 && echo "$(GREEN)UP$(RESET)" || echo "$(RED)DOWN$(RESET)"

shell-auth: ## Access auth service container shell
	@docker-compose exec auth-service sh

shell-keycloak: ## Access Keycloak container shell
	@docker-compose exec keycloak sh

shell-postgres: ## Access PostgreSQL shell
	@docker-compose exec postgres psql -U keycloak -d keycloak

shell-redis: ## Access Redis CLI
	@docker-compose exec redis redis-cli

backup-db: ## Backup PostgreSQL database
	@echo "$(BLUE)💾 Creating database backup...$(RESET)"
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U keycloak keycloak > backups/keycloak_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup created in backups/ directory$(RESET)"

restore-db: ## Restore PostgreSQL database (usage: make restore-db FILE=backup.sql)
	@echo "$(BLUE)📥 Restoring database from $(FILE)...$(RESET)"
	@docker-compose exec -T postgres psql -U keycloak -d keycloak < $(FILE)
	@echo "$(GREEN)✅ Database restored!$(RESET)"

frontend-help: ## Show frontend integration examples
	@echo "$(CYAN)🌐 Frontend Integration Examples:$(RESET)"
	@echo ""
	@echo "$(YELLOW)1. Get Auth Configuration:$(RESET)"
	@echo "   fetch('http://localhost:8080/api/auth/config')"
	@echo ""
	@echo "$(YELLOW)2. Login User:$(RESET)"
	@echo "   fetch('http://localhost:8080/api/v1/auth/login', {"
	@echo "     method: 'POST',"
	@echo "     headers: { 'Content-Type': 'application/json' },"
	@echo "     body: JSON.stringify({ username: 'user', password: 'pass' })"
	@echo "   })"
	@echo ""
	@echo "$(YELLOW)3. Access Protected Route:$(RESET)"
	@echo "   fetch('http://localhost:8080/api/v1/user/profile', {"
	@echo "     headers: { 'Authorization': 'Bearer ' + token }"
	@echo "   })"
	@echo ""
	@echo "$(YELLOW)4. Register User:$(RESET)"
	@echo "   fetch('http://localhost:8080/api/v1/auth/register', {"
	@echo "     method: 'POST',"
	@echo "     headers: { 'Content-Type': 'application/json' },"
	@echo "     body: JSON.stringify({"
	@echo "       username: 'newuser',"
	@echo "       email: 'user@example.com',"
	@echo "       password: 'Password123!',"
	@echo "       first_name: 'John',"
	@echo "       last_name: 'Doe'"
	@echo "     })"
	@echo "   })"
	@echo ""

# Development dependencies
install-deps: ## Install development dependencies
	@echo "$(BLUE)📦 Installing development dependencies...$(RESET)"
	@go mod download
	@go install github.com/cosmtrek/air@latest
	@echo "$(GREEN)✅ Dependencies installed!$(RESET)"

# Security scan
security-scan: ## Run security scan on the codebase
	@echo "$(BLUE)🔒 Running security scan...$(RESET)"
	@gosec ./... || echo "$(YELLOW)⚠️ Security scan completed with warnings$(RESET)"
