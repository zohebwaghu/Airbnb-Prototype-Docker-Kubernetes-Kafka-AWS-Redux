# Project Setup Guide

## Quick Start

### 1. Prerequisites
- Docker Desktop installed and running
- Git installed
- 8GB RAM minimum
- 10GB free disk space

### 2. Start the Application
```bash
docker-compose up -d
```

Wait 30-60 seconds for all services to initialize.

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **AI Agent**: http://localhost:8000

### 4. Create Your Account
1. Go to http://localhost:3000
2. Click the hamburger menu (☰) → "Sign up"
3. Fill in your details:
   - Name, Email, Password
   - Select user type: "Traveler" or "Owner"
4. Log in with your new credentials

## Features

### Traveler (Guest)
- Search and browse properties worldwide
- View detailed property information
- Book properties for specific dates
- Save properties to favorites
- View booking history (Trips)
- Use AI Travel Assistant for personalized trip planning

### Owner (Host)
- List properties with photos and details
- Set pricing, amenities, and availability
- Manage incoming booking requests
- Accept or decline bookings
- View property dashboard and statistics

### AI Travel Concierge
- Personalized day-by-day itineraries
- Activity recommendations based on interests
- Restaurant suggestions with dietary filters
- Weather-aware packing checklists
- Natural language queries

## Project Structure

```
├── frontend/          # React application
├── backend/           # Node.js/Express API
├── ai-agent/          # Python FastAPI AI service
├── database/          # MySQL schema and seed data
├── docker-compose.yml # Docker orchestration
├── CREDENTIALS.md     # Test account information
└── README.md          # Project documentation
```

## Troubleshooting

### Services Not Starting
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Issues
If you need to reset the database:
```bash
docker-compose down -v
docker-compose up -d
```

### Port Conflicts
If ports 3000, 5000, or 8000 are in use, stop those services or modify `docker-compose.yml`

### AI Agent Not Responding
The AI agent requires:
1. Ollama running locally (for production)
2. Internet connection for web search (Tavily)
3. At least 4GB RAM available

For development, the AI features may be limited without Ollama configured.

## Testing the Application

1. **Hamburger Menu**: Click the ☰ menu to access:
   - Favorites (Travelers)
   - Trips/Bookings  
   - Account Settings
   - Dashboard (Owners)

2. **Property Search**: Use location, dates, and guest count to find properties

3. **Booking Flow**: Select property → Choose dates → Reserve

4. **AI Assistant**: Click the 🤖 button (travelers only) for travel planning

## Development

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### AI Agent Development
```bash
cd ai-agent
pip install -r requirements.txt
uvicorn main:app --reload
```

## Stopping the Application
```bash
docker-compose down
```

To completely remove all data:
```bash
docker-compose down -v
```

##Support

For issues or questions, refer to:
- API Documentation: http://localhost:5000/api-docs
- README.md for detailed feature list
- CREDENTIALS.md for test accounts (if database is freshly seeded)

