# Airbnb Clone - Full Stack Application

A complete Airbnb clone built with React, Node.js, MySQL, and Python FastAPI featuring an AI-powered travel concierge using Ollama and LangChain.

## 🚀 Features

### Traveler Features

- ✅ User registration and authentication
- ✅ Profile management with photo upload
- ✅ Property search with filters (location, dates, guests, price)
- ✅ Property details view with booking
- ✅ Booking management (create, view, cancel)
- ✅ Favorites system
- ✅ Booking history

### Owner (Host) Features
- ✅ Host registration and authentication
- ✅ Property listing management
- ✅ Booking request management (accept/cancel)
- ✅ Owner dashboard with property statistics

### AI Travel Concierge
- ✅ Personalized travel planning using Ollama LLM
- ✅ Day-by-day itinerary generation
- ✅ Activity recommendations with filters
- ✅ Restaurant suggestions based on dietary needs
- ✅ Weather-aware packing checklist
- ✅ Natural language understanding

## 🛠 Technology Stack

- **Frontend**: React 18 with Bootstrap 5
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0
- **AI Agent**: Python FastAPI + LangChain + Ollama
- **Authentication**: Express-session with bcrypt
- **Deployment**: Docker + Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)
- Python 3.11+ (for local AI agent development)
- MySQL 8.0 (for local database development)

## 🚀 Quick Start (Docker)

### Prerequisites
1. **Install Docker Desktop** (if not already installed)
   - Download from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Start Docker Desktop and ensure it's running

2. **Install Ollama** (Required for AI Agent)
   - Windows: Download from [https://ollama.ai/download](https://ollama.ai/download)
   - Install and start Ollama
   - Open PowerShell/Command Prompt and run:
     ```bash
     ollama pull mistral-small3.2:latest
     ```
   - Keep Ollama running in the background

### Starting the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Lab 1"
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```
   
   This will start:
   - MySQL database (initializes with schema automatically)
   - Backend API server
   - Frontend React application  
   - AI Travel Concierge service

3. **Wait for services to start** (approximately 2-3 minutes)
   - Watch the logs: `docker-compose logs -f`
   - Press `Ctrl+C` to exit logs view

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000
   - **AI Agent**: http://localhost:8000
   - **API Documentation**: http://localhost:5000/api-docs

5. **Create your first user**
   - Visit http://localhost:3000
   - Click "Sign Up" and create either a traveler or owner account
   - Start exploring properties or list your own!

### Stopping the Application

```bash
docker-compose down
```

To remove all data (including database):
```bash
docker-compose down -v
```

## 🧪 Testing Scripts

The project includes multiple testing options from simple connectivity checks to comprehensive testing:

### **Quick Test (No Dependencies):**
```bash
# Run the simple test script
./simple-test.sh
```

This script performs basic connectivity tests and verifies that all services are running properly.

### **Comprehensive Test (With Node.js):**
```bash
# Run the complete test script
./test-complete.sh
```

This script:
- Starts all Docker services
- Waits for services to be ready
- Creates test users and sample data
- Tests all API endpoints
- Verifies AI agent functionality

### **Individual Test Scripts (Node.js Required):**
```bash
# In the backend directory
cd backend

# Create test data only
npm run test-data

# Test endpoints only
npm run test-endpoints
```

These scripts provide detailed testing of:
- Authentication (signup/login)
- Property management
- Booking operations
- User profile management
- Favorites functionality
- AI agent integration

## 🛠 Local Development Setup

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start MySQL database**
   ```bash
   # Using Docker
   docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=airbnb_db -p 3306:3306 -d mysql:8.0

   # Or using local MySQL installation
   # Make sure MySQL is running on localhost:3306
   ```

4. **Initialize database**
   ```bash
   # The app will automatically initialize the database on first run
   ```

5. **Start the backend**
   ```bash
   npm run dev  # Development mode with nodemon
   # or
   npm start    # Production mode
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend**
   ```bash
   npm start
   ```
   - Opens http://localhost:3000

### AI Agent Setup

**Prerequisites:** Make sure you have Ollama installed and running locally with the llama2 model:

1. **Install Ollama** (if not already installed)
   ```bash
   # On Linux/Mac
   curl -fsSL https://ollama.ai/install.sh | sh

   # On Windows, download from https://ollama.ai/download
   ```

2. **Pull and start llama2 model** (run this before starting Docker services)
   ```bash
   ollama pull llama2
   ollama serve  # Keep this running in background
   ```

3. **Get Tavily API Key (Optional - for enhanced local search)**
   - Sign up at [Tavily](https://www.tavily.com/)
   - Get your API key from the dashboard
   - Add it to your environment (see configuration section below)

4. **For Local Development Only** (not needed for Docker deployment)
   ```bash
   cd ai-agent
   pip install -r requirements.txt
   python main.py
   ```
   - Opens http://localhost:8000

## 📚 API Documentation

### Swagger Documentation
- **Development**: http://localhost:5000/api-docs
- **Interactive API testing with Swagger UI**
- **Complete endpoint documentation**

### Key API Endpoints

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Properties
- `GET /api/properties` - Search properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (owners only)
- `PUT /api/properties/:id` - Update property (owners only)

#### Bookings
- `POST /api/bookings` - Create booking (travelers only)
- `GET /api/bookings` - Get user's bookings
- `PUT /api/bookings/:id/status` - Update booking status (owners only)
- `POST /api/bookings/:id/cancel` - Cancel booking

#### AI Agent
- `POST /api/agent/travel-plan` - Generate personalized travel plan

## 🏗 Project Structure

```
airbnb-clone/
├── backend/                 # Node.js/Express.js API
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication middleware
│   ├── database.js         # Database connection
│   ├── server.js           # Main application file
│   └── uploads/            # File uploads directory
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
├── ai-agent/              # Python FastAPI service
│   ├── main.py           # FastAPI application
│   └── requirements.txt   # Python dependencies
├── database/              # Database schema and migrations
│   └── schema.sql         # MySQL schema
└── docker/               # Docker configuration
    ├── docker-compose.yml # Multi-service orchestration
    └── nginx.conf        # Frontend nginx config
```

## 🔐 Authentication

The application uses session-based authentication:
- Sessions are stored server-side with express-session
- Passwords are hashed with bcrypt
- JWT tokens are not used (session-based approach)

## 🤖 AI Agent Features

The AI travel concierge uses:
- **Ollama** for local LLM inference
- **LangChain** for prompt engineering and response parsing
- **Tavily** for web searches and local information
- **Natural language understanding** for user queries

### Supported Inputs
- Booking context (dates, location, party type)
- User preferences (budget, interests, mobility needs)
- Dietary restrictions and accessibility requirements

### Generated Outputs
- Day-by-day itineraries
- Activity recommendations with details
- Restaurant suggestions filtered by dietary needs
- Weather-aware packing checklists

## 🚢 Deployment

### AI Agent Configuration

**Environment Variables for AI Agent:**
```bash
# Required for web search functionality (optional)
TAVILY_API_KEY=your_tavily_api_key_from_dashboard

# Ollama configuration
OLLAMA_HOST=http://localhost:11434
```

**Adding Tavily API Key:**

1. **For Docker Deployment:**
   ```bash
   # Create or edit .env file in project root
   echo "TAVILY_API_KEY=your_actual_api_key_here" >> .env
   docker-compose up -d
   ```

2. **For Local Development:**
   ```bash
   # Create .env file in ai-agent directory
   cd ai-agent
   echo "TAVILY_API_KEY=your_actual_api_key_here" > .env
   python main.py
   ```

3. **Get Tavily API Key:**
   - Visit [Tavily Dashboard](https://www.tavily.com/)
   - Sign up for a free account
   - Navigate to API Keys section
   - Copy your API key and replace `your_actual_api_key_here`

**Note:** The Tavily integration is optional. Without it, the AI agent will use general knowledge for travel recommendations. With Tavily, it can access real-time local information for more accurate suggestions.

### Production Deployment

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   SESSION_SECRET=your-super-secret-session-key
   DB_HOST=your-mysql-host
   DB_PASSWORD=your-mysql-password
   TAVILY_API_KEY=your_tavily_api_key_here
   # ... other production configs
   ```

2. **Docker Compose Production**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **SSL/TLS Setup**
   - Configure nginx reverse proxy
   - Set up SSL certificates
   - Update CORS origins for production domain

### Manual Deployment

Each service can be deployed independently:
- **Backend**: Standard Node.js deployment
- **Frontend**: Static React build served by nginx
- **AI Agent**: Python application with Ollama
- **Database**: MySQL server

## 🔧 Configuration

### Backend Configuration
- `PORT`: Server port (default: 5000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection
- `SESSION_SECRET`: Session encryption key
- `FRONTEND_URL`: CORS allowed origins
- `AI_AGENT_URL`: AI service URL

### AI Agent Configuration
- `OLLAMA_HOST`: Ollama server URL
- Model selection via environment or API calls

## 🧪 Testing

### API Testing
- Use Swagger UI at `/api-docs` for interactive testing
- All endpoints support proper error handling
- Input validation with Joi schemas

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Property search and filtering
- [ ] Booking creation and management
- [ ] AI travel plan generation
- [ ] Owner dashboard functionality
- [ ] Favorites system

## 📊 Monitoring

- Health check endpoints available for all services
- Database connection monitoring
- API response time monitoring
- Ollama model availability checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Ollama** for local LLM inference
- **LangChain** for AI agent framework
- **React** and **Node.js** communities
- **Airbnb** for inspiration

## 🆘 Support

For support and questions:
- Check the API documentation at `/api-docs`
- Review the Docker logs for troubleshooting
- Ensure all prerequisites are installed correctly

---

**Happy coding! 🚀**
