# Airbnb Clone - Full Stack Application

A full-stack Airbnb clone with React frontend, Node.js backend, MySQL database, and AI-powered travel planning using FastAPI, LangChain, and Ollama.

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

**Frontend:** React 18, Axios, React Router  
**Backend:** Node.js, Express.js, MySQL 8.0  
**AI Agent:** Python FastAPI, LangChain, Ollama (Mistral model)  
**Authentication:** Express-session with bcrypt  
**Deployment:** Docker, Docker Compose  
**API Documentation:** Swagger UI  

## Prerequisites

- Docker and Docker Compose
- Git
- Ollama (for AI agent functionality)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Lab 1"
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

## Project Structure

```
Lab 1/
├── backend/                # Node.js/Express.js API
│   ├── routes/            # API endpoints
│   ├── middleware/        # Authentication middleware
│   ├── database.js        # MySQL connection
│   └── server.js          # Main application
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (Auth)
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
├── ai-agent/              # Python FastAPI service
│   ├── main.py            # AI agent implementation
│   └── requirements.txt   # Python dependencies
├── database/              # Database schema
│   └── schema.sql         # MySQL schema and seed data
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

The application uses MySQL with the following main tables:
- `users` - User accounts (travelers and owners)
- `properties` - Property listings
- `property_photos` - Property images
- `bookings` - Booking requests and confirmations
- `favorites` - User favorite properties
- `reviews` - Property reviews and ratings

See `database/schema.sql` for complete schema details.

## Authentication System

- Session-based authentication using express-session
- Password hashing with bcrypt (salt rounds: 10)
- Session cookies with configurable security settings
- Role-based access control (traveler vs owner)

## AI Agent Implementation

The AI travel concierge uses:
- **Ollama** with Mistral model for LLM inference
- **LangChain** for prompt engineering and response parsing
- **Tavily API** (optional) for web search and local information
- Fallback to mock responses if Ollama is unavailable

### AI Agent Inputs
- Booking context: location, check-in/out dates, party type
- User preferences: budget level, interests, mobility needs
- Dietary restrictions

### AI Agent Outputs
- Day-by-day itinerary (morning, afternoon, evening activities)
- Activity recommendations with addresses and price tiers
- Restaurant suggestions filtered by dietary preferences
- Packing checklist based on weather and activities

## Docker Configuration

Services defined in `docker-compose.yml`:

- **mysql**: MySQL 8.0 database (port 3307)
- **backend**: Node.js API (port 5002)
- **frontend**: React app served via Nginx (port 3001)
- **ai-agent**: Python FastAPI service (port 8000)

### Environment Variables

**Backend:**
```
NODE_ENV=production
PORT=5000
DB_HOST=mysql
DB_NAME=airbnb_db
DB_USER=airbnb_user
DB_PASSWORD=airbnb_password
SESSION_SECRET=your-session-secret
```

**AI Agent:**
```
OLLAMA_HOST=http://host.docker.internal:11434
TAVILY_API_KEY=optional-api-key
```

## Stopping the Application

```bash
docker-compose down
```

To remove all data including database:

```bash
docker-compose down -v
```

## Development Notes

- Frontend uses React hooks (useState, useEffect, useContext)
- Backend uses async/await for all database operations
- Input validation with Joi schemas
- Error handling middleware for all routes
- CORS configured for cross-origin requests
- Health check endpoints for all services

## Troubleshooting

**Issue:** Application not loading  
**Solution:** Clear browser cache or use incognito mode

**Issue:** AI agent not working  
**Solution:** Ensure Ollama is running with `ollama serve`

**Issue:** Database connection errors  
**Solution:** Wait for MySQL container to be fully initialized (check with `docker logs airbnb_mysql`)

**Issue:** Login/signup fails  
**Solution:** Check backend logs with `docker logs airbnb_backend`

## Testing

Use the Swagger UI at http://localhost:5002/api-docs for interactive API testing. All endpoints include proper error handling and validation.

## Future Enhancements

- Payment integration
- Real-time messaging between hosts and travelers
- Advanced search filters (amenities, property type)
- Email notifications for booking confirmations
- Mobile responsive design improvements
- Multi-language support

## Author

Devanshee Vyas | Zoheb Waghu

## License

This project is for educational purposes as part of the Lab 1 assignment.
