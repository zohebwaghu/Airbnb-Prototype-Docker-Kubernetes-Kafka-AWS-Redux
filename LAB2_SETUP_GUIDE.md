# Lab 2 Setup and Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing Lab 2 enhancements to the Airbnb prototype.

## Prerequisites
- Docker and Docker Compose
- Kubernetes cluster (local: minikube/kind, or AWS EKS)
- Node.js 18+
- Python 3.8+
- kubectl configured

## Implementation Checklist

### ✅ Completed
- [x] Project structure created
- [x] MongoDB connection module
- [x] Kafka producer/consumer modules
- [x] Booking service structure
- [x] Kafka infrastructure (Docker Compose)
- [x] Kubernetes manifests (MongoDB, Kafka, Booking Service)

### 🔄 In Progress
- [ ] Complete microservices (Traveler, Owner, Property)
- [ ] Frontend Kafka producer integration
- [ ] Redux store setup
- [ ] JMeter test plans

### 📋 Remaining Tasks

#### 1. Complete Microservices
Create similar structure for:
- `services/traveler-service/` - Authentication, user profile
- `services/owner-service/` - Owner operations, booking management
- `services/property-service/` - Property CRUD, search

#### 2. Frontend Kafka Integration
- Install `kafkajs` in frontend
- Create Kafka producer service
- Publish booking events from frontend

#### 3. Redux Integration
- Install Redux Toolkit
- Create store with slices:
  - `authSlice` - JWT tokens, user session
  - `propertySlice` - Property data, search results
  - `bookingSlice` - Booking state, favorites

#### 4. Kubernetes Deployment
- Create remaining service manifests
- Set up ConfigMaps and Secrets
- Deploy to Kubernetes cluster

#### 5. JMeter Testing
- Create test plans for:
  - Authentication endpoints
  - Property search
  - Booking creation
- Test with 100, 200, 300, 400, 500 concurrent users

## Quick Start

### 1. Start Kafka Locally
```bash
cd kafka
docker-compose up -d
```

### 2. Start MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### 3. Deploy to Kubernetes
```bash
kubectl apply -f kubernetes/mongodb/
kubectl apply -f kubernetes/kafka/
kubectl apply -f kubernetes/booking-service/
```

### 4. Install Dependencies
```bash
cd services/booking-service
npm install
```

## Architecture Notes

### Kafka Topics
- `booking-created` - Published by frontend when traveler creates booking
- `booking-status-updated` - Published by booking service
- `booking-accepted` - Published by owner service
- `booking-cancelled` - Published by owner service

### Service Communication
- Frontend → Kafka → Booking Service → MongoDB
- Booking Service → Kafka → Owner Service
- Owner Service → Kafka → Booking Service → Frontend

## Next Steps
1. Complete remaining microservices
2. Integrate Redux in frontend
3. Create comprehensive Kubernetes manifests
4. Set up JMeter test plans
5. Deploy to AWS EKS

