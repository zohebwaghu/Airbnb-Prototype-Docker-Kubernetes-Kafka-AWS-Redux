#!/bin/bash

# Simple Airbnb Clone API Test Script
# Tests API endpoints using curl requests only

echo "🧪 Airbnb Clone API Test"
echo "========================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Base URLs
BACKEND_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:3000"

print_status "Testing Airbnb Clone APIs..."
echo ""

# Test 1: Backend Health Check
print_status "1. Testing Backend Health..."
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
    print_success "Backend health check passed"
    echo "   Response: $HEALTH_RESPONSE"
else
    print_error "Backend health check failed"
fi

echo ""

# Test 2: Properties Endpoint
print_status "2. Testing Properties API..."
if curl -f -s "$BACKEND_URL/properties" > /dev/null; then
    PROPERTIES_RESPONSE=$(curl -s "$BACKEND_URL/properties")
    print_success "Properties endpoint working"
    echo "   Response preview: $(echo $PROPERTIES_RESPONSE | head -c 100)..."
else
    print_error "Properties endpoint failed"
fi

echo ""

# Test 3: Authentication Test (without login)
print_status "3. Testing Authentication endpoints..."

# Test signup endpoint (this might fail if email exists, which is expected)
if SIGNUP_RESPONSE=$(curl -s -X POST "$BACKEND_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test User","email":"test-'$(date +%s)'@example.com","password":"password123","userType":"traveler"}' 2>/dev/null); then

    if echo "$SIGNUP_RESPONSE" | grep -q "already registered\|User created"; then
        print_success "Signup endpoint responding"
        echo "   Response: $(echo $SIGNUP_RESPONSE | head -c 100)..."
    else
        print_warning "Signup endpoint responded unexpectedly"
    fi
else
    print_error "Signup endpoint not accessible"
fi

echo ""

# Test 4: Frontend Accessibility
print_status "4. Testing Frontend..."
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend not accessible (may still be starting)"
fi

echo ""

# Test 5: API Documentation
print_status "5. Testing API Documentation..."
if curl -f -s "http://localhost:5000/api-docs" > /dev/null; then
    print_success "API documentation accessible"
else
    print_warning "API documentation not accessible"
fi

echo ""

# Summary
echo "📋 Test Summary:"
echo "==============="
echo "✅ Backend Health: $(curl -f -s "$BACKEND_URL/health" > /dev/null && echo "PASS" || echo "FAIL")"
echo "✅ Properties API: $(curl -f -s "$BACKEND_URL/properties" > /dev/null && echo "PASS" || echo "FAIL")"
echo "✅ Auth API: $(curl -f -s -X POST "$BACKEND_URL/auth/signup" -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","password":"test","userType":"traveler"}' > /dev/null 2>&1 && echo "PASS" || echo "FAIL")"
echo "✅ Frontend: $(curl -f -s "$FRONTEND_URL" > /dev/null && echo "PASS" || echo "FAIL")"
echo "✅ API Docs: $(curl -f -s "http://localhost:5000/api-docs" > /dev/null && echo "PASS" || echo "FAIL")"

echo ""
echo "🌐 Access URLs:"
echo "==============="
echo "Frontend:      $FRONTEND_URL"
echo "Backend API:   $BACKEND_URL"
echo "API Docs:      http://localhost:5000/api-docs"
echo "AI Agent:      http://localhost:8000"

echo ""
echo "📝 Note: This script assumes all services are already running."
echo "       If services are not running, start them with: docker-compose up"
