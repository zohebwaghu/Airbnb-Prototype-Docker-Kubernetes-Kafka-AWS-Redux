#!/bin/bash

# Deploy all services to Kubernetes
# Usage: ./deploy-all.sh

echo "Deploying Airbnb Lab 2 services to Kubernetes..."

# Create secrets
echo "Creating secrets..."
kubectl apply -f secrets.yaml

# Deploy infrastructure
echo "Deploying MongoDB..."
kubectl apply -f mongodb/

echo "Deploying Kafka..."
kubectl apply -f kafka/

# Wait for infrastructure to be ready
echo "Waiting for infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=300s
kubectl wait --for=condition=ready pod -l app=kafka --timeout=300s

# Deploy microservices
echo "Deploying Traveler Service..."
kubectl apply -f traveler-service/

echo "Deploying Owner Service..."
kubectl apply -f owner-service/

echo "Deploying Property Service..."
kubectl apply -f property-service/

echo "Deploying Booking Service..."
kubectl apply -f booking-service/

echo "Deploying AI Agent Service..."
kubectl apply -f ai-agent/

echo "Deploying API Gateway..."
kubectl apply -f api-gateway/

# Wait for services to be ready
echo "Waiting for services to be ready..."
kubectl wait --for=condition=ready pod -l app=traveler-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=owner-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=property-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=booking-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=300s

echo "Deployment complete!"
echo ""
echo "Service status:"
kubectl get pods
echo ""
echo "Services:"
kubectl get services
echo ""
echo "To get API Gateway external IP (if LoadBalancer):"
echo "kubectl get service api-gateway"

