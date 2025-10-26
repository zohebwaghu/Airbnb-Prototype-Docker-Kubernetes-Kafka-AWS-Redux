const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./database');
const swaggerSpec = require('./swagger');
const swaggerUi = require('swagger-ui-express');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const propertyRoutes = require('./routes/properties');
const bookingRoutes = require('./routes/bookings');
const agentRoutes = require('./routes/agent');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (needed when running behind nginx to correctly detect protocol)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
const cookieSecure = (process.env.SESSION_COOKIE_SECURE || (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';
const cookieSameSite = process.env.SESSION_SAMESITE || 'lax';

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: cookieSecure,
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger documentation
const enableDocs = process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV !== 'production';
if (enableDocs) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Airbnb Clone API Documentation'
  }));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/agent', agentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Airbnb Backend API'
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Airbnb Backend API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      properties: '/api/properties',
      bookings: '/api/bookings',
      agent: '/api/agent',
      health: '/api/health',
      docs: process.env.NODE_ENV !== 'production' ? '/api-docs' : 'See README for API documentation'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    // Initialize database tables (only if tables don't exist)
    try {
      await initializeDatabase();
    } catch (error) {
      console.log('Database tables may already exist, continuing...');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Airbnb Backend API is running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

startServer();

module.exports = app;
