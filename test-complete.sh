#!/bin/bash

# Airbnb Clone - Complete Testing Script
# This script tests the entire application without external dependencies

set -e  # Exit on any error

echo "🚀 Airbnb Clone - Complete Testing Script"
echo "========================================="

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running. Starting tests..."

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose down > /dev/null 2>&1 || true

# Start all services
print_status "Starting all services with Docker Compose..."
docker-compose up -d

print_status "Waiting for services to be ready..."

# Wait for MySQL to be ready
print_status "Waiting for MySQL database..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker-compose exec mysql mysqladmin ping -h localhost --silent; then
        print_success "MySQL is ready!"
        break
    fi
    echo -n "."
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    print_error "MySQL failed to start within 60 seconds"
    exit 1
fi

# Wait for backend to be ready
print_status "Waiting for backend API..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "Backend API is ready!"
        break
    fi
    echo -n "."
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    print_error "Backend API failed to start within 60 seconds"
    exit 1
fi

# Wait for frontend to be ready
print_status "Waiting for frontend..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is ready!"
        break
    fi
    echo -n "."
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    print_warning "Frontend may not be fully ready, but continuing with tests..."
fi

print_status "All services are running!"

# Run database initialization and test data creation
print_status "Creating test data..."
cd backend

# Initialize database tables
print_status "Initializing database tables..."
node -e "
const { initializeDatabase } = require('./database.js');
initializeDatabase().then(() => {
    console.log('✅ Database initialized successfully');
    process.exit(0);
}).catch((err) => {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
});
"

# Run test data creation
print_status "Running test data creation script..."
node test-data.js

# Run endpoint testing
print_status "Testing all API endpoints..."
node test-endpoints.js

cd ..

print_success "🎉 All tests completed successfully!"

echo ""
echo "📋 Test Results Summary:"
echo "======================="
echo "✅ Docker containers started"
echo "✅ MySQL database initialized"
echo "✅ Test users created (owner & travelers)"
echo "✅ Sample properties created"
echo "✅ Bookings and favorites generated"
echo "✅ All API endpoints tested"
echo "✅ AI agent functionality verified"

echo ""
echo "🌐 Access URLs:"
echo "==============="
echo "Frontend:      http://localhost:3000"
echo "Backend API:   http://localhost:5000"
echo "API Docs:      http://localhost:5000/api-docs"
echo "AI Agent:      http://localhost:8000"

echo ""
echo "🔑 Test Credentials:"
echo "==================="
echo "Owner Account:    john@example.com / password123"
echo "Traveler Account: jane@example.com / password123"
echo "Traveler Account: bob@example.com / password123"

echo ""
echo "🧪 To run individual tests:"
echo "=========================="
echo "Test Data Only:    cd backend && npm run test-data"
echo "Endpoints Only:    cd backend && npm run test-endpoints"
echo "View Logs:         docker-compose logs -f"

print_success "Testing script completed! The application is ready for use."
