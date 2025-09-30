#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0 # Port is in use
    else
        return 1 # Port is free
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=60
    local attempt=0
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s $url >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Main script
echo "========================================"
echo "🚀 ShopMindAI Auth Service Startup"
echo "========================================"

# Check if required ports are available
print_status "Checking port availability..."

if check_port 8080; then
    print_error "Port 8080 is already in use. Please stop the service using this port."
    exit 1
fi

if check_port 8081; then
    print_error "Port 8081 is already in use. Please stop the service using this port."
    exit 1
fi

if check_port 5432; then
    print_warning "Port 5432 is in use. PostgreSQL might already be running."
fi

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

# Clean up old images if needed
print_status "Cleaning up old images..."
docker image prune -f

# Build and start services
print_status "Building and starting services..."
docker-compose up -d --build

# Check if containers started successfully
print_status "Checking container status..."
sleep 5

if ! docker-compose ps | grep -q "Up"; then
    print_error "Some containers failed to start. Checking logs..."
    docker-compose logs --tail=50
    exit 1
fi

# Wait for PostgreSQL
print_status "Waiting for PostgreSQL..."
wait_for_service "PostgreSQL" "http://localhost:5432" || {
    print_error "PostgreSQL failed to start"
    docker-compose logs postgres
    exit 1
}

# Wait for Redis
print_status "Waiting for Redis..."
if ! timeout 30 bash -c 'until docker exec shopmind-redis redis-cli ping 2>/dev/null; do sleep 1; done'; then
    print_error "Redis failed to start"
    docker-compose logs redis
    exit 1
fi

# Wait for Keycloak
print_status "Waiting for Keycloak (this may take a few minutes)..."
wait_for_service "Keycloak" "http://localhost:8081/health/ready" || {
    print_error "Keycloak failed to start"
    docker-compose logs keycloak
    exit 1
}

# Wait for Auth Service
print_status "Waiting for Auth Service..."
wait_for_service "Auth Service" "http://localhost:8080/health" || {
    print_error "Auth Service failed to start"
    docker-compose logs auth-service
    exit 1
}

# Success message
echo ""
echo "🎉 All services started successfully!"
echo "========================================"
echo "📋 Service URLs:"
echo "• Auth Service:    http://localhost:8080"
echo "• Keycloak Admin:  http://localhost:8081 (admin/admin_secure_password_2024)"
echo "• PostgreSQL:      localhost:5432 (keycloak/keycloak_secure_password_2024)"
echo "• Redis:           localhost:6379"
echo ""
echo "📖 API Documentation:"
echo "• Health Check:    GET  http://localhost:8080/health"
echo "• Register:        POST http://localhost:8080/api/v1/auth/register"
echo "• Login:           POST http://localhost:8080/api/v1/auth/login"
echo "• Profile:         GET  http://localhost:8080/api/v1/user/profile"
echo ""
echo "🔧 Next Steps:"
echo "1. Access Keycloak Admin Console: http://localhost:8081"
echo "2. Create 'ShopMindAI' realm if not exists"
echo "3. Create 'auth-service' client in the realm"
echo "4. Test the API endpoints with Postman or curl"
echo ""
echo "📊 View logs: docker-compose logs -f [service-name]"
echo "🛑 Stop services: docker-compose down"
echo "========================================"
