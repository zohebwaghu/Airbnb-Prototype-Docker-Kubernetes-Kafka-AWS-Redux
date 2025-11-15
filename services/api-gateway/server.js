const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Service URLs (in Kubernetes, these would be service names)
const SERVICES = {
  TRAVELER: process.env.TRAVELER_SERVICE_URL || 'http://localhost:5001',
  OWNER: process.env.OWNER_SERVICE_URL || 'http://localhost:5002',
  BOOKING: process.env.BOOKING_SERVICE_URL || 'http://localhost:5003',
  PROPERTY: process.env.PROPERTY_SERVICE_URL || 'http://localhost:5004',
  AI_AGENT: process.env.AI_AGENT_SERVICE_URL || 'http://localhost:8000'
};

// Proxy middleware configuration
const createProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${req.path}:`, err.message);
      res.status(503).json({ error: 'Service temporarily unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward authorization header
      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
      }
    }
  });
};

// Route to Traveler Service
app.use('/api/auth', createProxy(SERVICES.TRAVELER, { '^/api': '' }));
app.use('/api/users', createProxy(SERVICES.TRAVELER, { '^/api': '' }));

// Route to Owner Service
app.use('/api/owner', createProxy(SERVICES.OWNER, { '^/api': '' }));

// Route to Property Service
app.use('/api/properties', createProxy(SERVICES.PROPERTY, { '^/api': '' }));

// Route to Booking Service
app.use('/api/bookings', createProxy(SERVICES.BOOKING, { '^/api': '' }));

// Route to AI Agent Service
app.use('/api/agent', createProxy(SERVICES.AI_AGENT, { '^/api/agent': '' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'api-gateway',
    services: {
      traveler: SERVICES.TRAVELER,
      owner: SERVICES.OWNER,
      booking: SERVICES.BOOKING,
      property: SERVICES.PROPERTY,
      aiAgent: SERVICES.AI_AGENT
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Airbnb API Gateway',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      properties: '/api/properties',
      bookings: '/api/bookings',
      owner: '/api/owner',
      agent: '/api/agent'
    }
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Routing to services:');
  console.log(`  Traveler: ${SERVICES.TRAVELER}`);
  console.log(`  Owner: ${SERVICES.OWNER}`);
  console.log(`  Booking: ${SERVICES.BOOKING}`);
  console.log(`  Property: ${SERVICES.PROPERTY}`);
  console.log(`  AI Agent: ${SERVICES.AI_AGENT}`);
});

