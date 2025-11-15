# Airbnb Clone - Full Stack Application

**Lab 2: Enhanced with Docker, Kubernetes, Kafka, MongoDB, AWS, and Redux**

This repository contains both Lab 1 (original prototype) and Lab 2 (enhanced version) implementations.

For Lab 2 specific documentation, see [README_LAB2.md](README_LAB2.md)

---

A full-stack Airbnb clone with React frontend, Node.js backend, MySQL database (Lab 1) / MongoDB (Lab 2), and AI-powered travel planning using FastAPI, LangChain, and Ollama.

## Features

### Traveler Features
- User registration and session-based authentication
- Profile management with photo upload
- Property search with advanced filters (location, dates, guests, price range)
- Property details view with photo gallery and booking
- Booking management (create, view, cancel bookings)
- Favorites system
- Booking history with status tracking
- AI travel concierge for trip planning

### Owner (Host) Features
- Host registration and authentication
- Property listing management (create, update, delete)
- Booking request management (accept/decline)
- Owner dashboard with property statistics
- Availability calendar management

### AI Travel Concierge
- Personalized day-by-day itinerary generation
- Activity recommendations based on interests and budget
- Restaurant suggestions with dietary filters
- Weather-aware packing checklist
- Natural language query support

## Technology Stack

**Lab 1:**
- **Frontend:** React 18, Axios, React Router  
- **Backend:** Node.js, Express.js, MySQL 8.0  
- **AI Agent:** Python FastAPI, LangChain, Ollama (Mistral model)  
- **Authentication:** Express-session with bcrypt  
- **Deployment:** Docker, Docker Compose  

**Lab 2 Enhancements:**
- **Database:** MongoDB (replaces MySQL)
- **Message Queue:** Apache Kafka for async messaging
- **Orchestration:** Kubernetes
- **State Management:** Redux Toolkit
- **Cloud:** AWS deployment ready

## Prerequisites

- Docker and Docker Compose
- Git
- Ollama (for AI agent functionality)
- Kubernetes cluster (for Lab 2)
- Node.js 18+ and Python 3.8+

## Installation and Setup

### Lab 1 Setup

### 1. Clone the Repository

```bash
git clone https://github.com/zohebwaghu/Airbnb-Prototype-Docker-Kubernetes-Kafka-AWS-Redux.git
cd Airbnb-Prototype-Docker-Kubernetes-Kafka-AWS-Redux
```

### 2. Start Ollama (Required for AI Agent)

Open a separate terminal and run:

```bash
ollama serve
```

Ensure Mistral model is downloaded:

```bash
ollama pull mistral
```

### 3. Start All Services

```bash
docker-compose up -d
```

This command will:
- Initialize MySQL database with schema
- Start backend API server on port 5002
- Start frontend on port 3001
- Start AI agent service on port 8000

### 4. Access the Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:5002/api
- API Documentation: http://localhost:5002/api-docs
- AI Agent: http://localhost:8000

### 5. Test Credentials

**Traveler Account:**
- Email: jane@example.com
- Password: password123

**Owner Account:**
- Email: sophie@example.com
- Password: password123

## Lab 2 Setup

See [LAB2_SETUP_GUIDE.md](LAB2_SETUP_GUIDE.md) for detailed Lab 2 setup instructions.

Quick start:
```bash
# Start Kafka
cd kafka && docker-compose up -d

# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Deploy to Kubernetes
kubectl apply -f kubernetes/
```

## Project Structure

```
├── backend/                # Node.js/Express.js API (Lab 1)
├── frontend/              # React application
├── ai-agent/              # Python FastAPI service
├── database/              # Database schema
├── services/              # Microservices (Lab 2)
│   ├── booking-service/
│   ├── traveler-service/
│   ├── owner-service/
│   ├── property-service/
│   └── shared/
├── kafka/                 # Kafka infrastructure (Lab 2)
├── kubernetes/            # K8s manifests (Lab 2)
├── jmeter/                # Performance tests (Lab 2)
└── docker-compose.yml     # Multi-service orchestration
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Search properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (owners only)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id/status` - Accept/decline booking (owners)
- `POST /api/bookings/:id/cancel` - Cancel booking

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Favorites
- `POST /api/favorites` - Add property to favorites
- `GET /api/favorites` - Get user favorites
- `DELETE /api/favorites/:id` - Remove from favorites

### AI Agent
- `POST /api/agent/travel-plan` - Generate personalized travel plan

## Database Schema

**Lab 1:** MySQL with tables for users, properties, bookings, favorites, reviews

**Lab 2:** MongoDB with collections for users, properties, bookings, favorites, sessions

See `database/schema.sql` for MySQL schema details.

## Authentication System

- Session-based authentication using express-session (Lab 1)
- JWT tokens with Redux state management (Lab 2)
- Password hashing with bcrypt (salt rounds: 10)
- Role-based access control (traveler vs owner)

## Lab 2 Features

- **Microservices Architecture:** Split into Traveler, Owner, Property, Booking services
- **Kafka Integration:** Async messaging for booking flow
- **MongoDB:** NoSQL database with encrypted passwords
- **Redux:** Centralized state management for frontend
- **Kubernetes:** Container orchestration and scaling
- **Performance Testing:** JMeter test plans for load testing

## Docker Configuration

Services defined in `docker-compose.yml`:

- **mysql**: MySQL 8.0 database (port 3307) - Lab 1
- **mongodb**: MongoDB 7.0 (port 27017) - Lab 2
- **backend**: Node.js API (port 5002)
- **frontend**: React app served via Nginx (port 3001)
- **ai-agent**: Python FastAPI service (port 8000)
- **kafka**: Apache Kafka broker (port 9092) - Lab 2
- **zookeeper**: Zookeeper for Kafka (port 2181) - Lab 2

## Stopping the Application

```bash
docker-compose down
```

To remove all data including database:

```bash
docker-compose down -v
```

## Development Notes

- Frontend uses React hooks (Lab 1) and Redux (Lab 2)
- Backend uses async/await for all database operations
- Input validation with Joi schemas
- Error handling middleware for all routes
- CORS configured for cross-origin requests
- Health check endpoints for all services

## Testing

Use the Swagger UI at http://localhost:5002/api-docs for interactive API testing.

For Lab 2 performance testing, see `jmeter/test-plans/README.md`

## Authors

Devanshee Vyas | Zoheb Waghu

## License

MIT License - This project is for educational purposes as part of DATA 236 Lab assignments.
