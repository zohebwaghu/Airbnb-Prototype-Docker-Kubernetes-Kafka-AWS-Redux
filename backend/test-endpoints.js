const axios = require('axios');

// Configure axios for testing
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

const testEndpoints = [
  // Health check
  { method: 'GET', url: '/health', description: 'Health check endpoint' },

  // Authentication endpoints
  { method: 'POST', url: '/auth/signup', description: 'User signup', data: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    userType: 'traveler'
  }},

  { method: 'POST', url: '/auth/login', description: 'User login', data: {
    email: 'test@example.com',
    password: 'password123'
  }},

  // Properties endpoints
  { method: 'GET', url: '/properties', description: 'Get all properties' },

  // User management endpoints
  { method: 'GET', url: '/users/profile', description: 'Get user profile', requiresAuth: true },
  { method: 'PUT', url: '/users/profile', description: 'Update user profile', requiresAuth: true, data: {
    name: 'Updated Test User',
    phone: '+1234567890',
    city: 'Test City',
    country: 'Test Country'
  }},

  // Bookings endpoints
  { method: 'GET', url: '/users/bookings', description: 'Get user bookings', requiresAuth: true },

  // Favorites endpoints
  { method: 'GET', url: '/users/favorites', description: 'Get user favorites', requiresAuth: true },

  // Owner endpoints (requires owner account)
  { method: 'GET', url: '/properties/owner/properties', description: 'Get owner properties', requiresAuth: true, ownerOnly: true }
];

async function testAllEndpoints() {
  console.log('🧪 Starting comprehensive API endpoint testing...\n');

  let authToken = null;

  for (const test of testEndpoints) {
    try {
      console.log(`📡 Testing ${test.method} ${test.url} - ${test.description}`);

      // Skip auth-required endpoints if not authenticated
      if (test.requiresAuth && !authToken) {
        console.log('   ⏭️ Skipping (requires authentication)');
        continue;
      }

      // Configure headers
      const config = {};
      if (authToken) {
        config.headers = { Authorization: `Bearer ${authToken}` };
      }

      // Make request
      const response = await axios({
        method: test.method,
        url: test.url,
        data: test.data,
        ...config
      });

      console.log(`   ✅ ${response.status}: ${JSON.stringify(response.data).substring(0, 100)}...`);

      // Store auth token for subsequent requests
      if (test.url === '/auth/login' && response.data.user) {
        console.log('   🔑 Authentication successful, using token for subsequent requests');
      }

    } catch (error) {
      if (error.response) {
        console.log(`   ❌ ${error.response.status}: ${error.response.data.error || error.response.data.message}`);
      } else {
        console.log(`   ❌ Network error: ${error.message}`);
      }
    }

    console.log('');
  }

  console.log('🎯 Endpoint testing completed!');
  console.log('\n💡 Note: Some endpoints may fail if test data hasn\'t been created yet.');
  console.log('   Run the test-data.js script first to populate the database.');
}

// Run if called directly
if (require.main === module) {
  testAllEndpoints();
}

module.exports = { testAllEndpoints };
