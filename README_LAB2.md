# Lab 2: Enhanced Airbnb Prototype

## Overview
This is the enhanced version of the Airbnb prototype with Docker, Kubernetes, Kafka, MongoDB, Redux, and AWS deployment capabilities.

## Architecture

### Microservices
- **Traveler Service**: User authentication and profile management
- **Owner Service**: Owner operations and booking management
- **Property Service**: Property CRUD and search operations
- **Booking Service**: Booking creation and status management
- **AI Agent Service**: AI-powered travel concierge

### Technology Stack
- **Frontend**: React with Redux
- **Backend**: Node.js microservices
- **Database**: MongoDB
- **Message Queue**: Apache Kafka
- **Orchestration**: Kubernetes
- **Containerization**: Docker

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Kubernetes cluster (minikube/kind for local, EKS for AWS)
- Node.js 18+
- Python 3.8+

### Local Development

1. **Start Kafka**
```bash
cd kafka
docker-compose up -d
```

2. **Start MongoDB**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

3. **Start Services**
```bash
# Booking Service
cd services/booking-service
npm install
npm start

# Other services (similar pattern)
```

### Kubernetes Deployment

1. **Deploy Infrastructure**
```bash
kubectl apply -f kubernetes/mongodb/
kubectl apply -f kubernetes/kafka/
```

2. **Deploy Services**
```bash
kubectl apply -f kubernetes/booking-service/
# Repeat for other services
```

3. **Check Status**
```bash
kubectl get pods
kubectl get services
```

## Kafka Topics

- `booking-created` - Published when traveler creates booking
- `booking-status-updated` - Published when booking status changes
- `booking-accepted` - Published when owner accepts booking
- `booking-cancelled` - Published when booking is cancelled

## Redux Store Structure

```javascript
{
  auth: {
    token: string,
    user: object,
    isAuthenticated: boolean
  },
  properties: {
    properties: array,
    currentProperty: object,
    filters: object
  },
  bookings: {
    bookings: array,
    favorites: array,
    currentBooking: object
  }
}
```

## Performance Testing

See `jmeter/test-plans/` for JMeter test plans.

Test with 100, 200, 300, 400, 500 concurrent users.

## AWS Deployment

1. Create EKS cluster
2. Configure kubectl for EKS
3. Deploy all Kubernetes manifests
4. Set up LoadBalancer services for external access

## Documentation

- `LAB2_IMPLEMENTATION_PLAN.md` - Implementation plan
- `LAB2_SETUP_GUIDE.md` - Setup instructions
- `jmeter/test-plans/README.md` - JMeter testing guide

## Project Structure

```
airbnb-fullstack-clone/
├── services/              # Microservices
│   ├── traveler-service/
│   ├── owner-service/
│   ├── property-service/
│   ├── booking-service/
│   └── shared/           # Shared modules
├── frontend/              # React + Redux frontend
├── kafka/                # Kafka infrastructure
├── kubernetes/           # K8s manifests
├── jmeter/               # Performance tests
└── docs/                 # Documentation
```

## Next Steps

1. Complete remaining microservices
2. Integrate Redux in frontend components
3. Set up CI/CD pipeline
4. Deploy to AWS EKS
5. Run performance tests
6. Generate Lab 2 report

