# Lab 2 Implementation Plan

## Overview
This document outlines the implementation plan for Lab 2: Enhancing the Airbnb Prototype with Docker, Kubernetes, Kafka, AWS, and Redux.

## Architecture Changes

### Current Architecture (Lab 1)
- Monolithic Node.js backend
- MySQL database
- React frontend with Context API
- Python AI Agent service
- Docker Compose for local development

### Target Architecture (Lab 2)
- Microservices: Traveler, Owner, Property, Booking, AI Agent
- MongoDB database
- Kafka for asynchronous messaging
- Kubernetes orchestration
- Redux for frontend state management
- AWS deployment

## Implementation Phases

### Phase 1: Database Migration (MongoDB)
- Replace MySQL with MongoDB
- Create MongoDB connection module
- Migrate schema to MongoDB collections
- Update all database queries to use MongoDB

### Phase 2: Microservices Split
- **Traveler Service**: User authentication, profile management
- **Owner Service**: Owner-specific operations, booking management
- **Property Service**: Property CRUD operations, search
- **Booking Service**: Booking creation, status management
- **AI Agent Service**: (Already separate)

### Phase 3: Kafka Integration
- Set up Kafka cluster (Zookeeper + Kafka)
- Frontend services as producers
- Backend services as consumers
- Booking flow: Traveler → Kafka → Owner → Kafka → Traveler

### Phase 4: Docker & Kubernetes
- Create Dockerfiles for each microservice
- Create Kubernetes manifests (Deployments, Services, ConfigMaps)
- Set up service discovery and communication

### Phase 5: Redux Integration
- Set up Redux store
- Create actions and reducers for:
  - Authentication (JWT tokens)
  - Property data
  - Booking state
- Replace Context API with Redux

### Phase 6: Performance Testing
- Create JMeter test plans
- Test with 100, 200, 300, 400, 500 concurrent users
- Generate performance reports

## Directory Structure

```
airbnb-fullstack-clone/
├── services/
│   ├── traveler-service/
│   ├── owner-service/
│   ├── property-service/
│   ├── booking-service/
│   └── ai-agent/ (existing)
├── frontend/
├── kafka/
│   ├── docker-compose.yml
│   └── kafka-config/
├── kubernetes/
│   ├── traveler/
│   ├── owner/
│   ├── property/
│   ├── booking/
│   ├── ai-agent/
│   ├── kafka/
│   └── mongodb/
├── jmeter/
│   └── test-plans/
└── docs/
```

## Next Steps
1. Create MongoDB connection and schema
2. Split backend into microservices
3. Set up Kafka infrastructure
4. Create Kubernetes manifests
5. Integrate Redux
6. Create JMeter tests

