const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Airbnb Clone API',
      version: '1.0.0',
      description: 'API documentation for the Airbnb Clone application',
      contact: {
        name: 'API Support',
        email: 'support@airbnbclone.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.airbnbclone.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            user_type: { type: 'string', enum: ['traveler', 'owner'] },
            phone: { type: 'string' },
            profile_picture: { type: 'string' },
            about_me: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            languages: { type: 'string' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            location: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            owner_id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            property_type: { type: 'string', enum: ['apartment', 'house', 'condo', 'townhouse', 'other'] },
            location: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'number' },
            max_guests: { type: 'integer' },
            base_price: { type: 'number' },
            cleaning_fee: { type: 'number' },
            service_fee: { type: 'number' },
            amenities: { type: 'array', items: { type: 'string' } },
            is_available: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            property_id: { type: 'integer' },
            traveler_id: { type: 'integer' },
            check_in_date: { type: 'string', format: 'date' },
            check_out_date: { type: 'string', format: 'date' },
            number_of_guests: { type: 'integer' },
            total_price: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'accepted', 'cancelled', 'completed'] },
            special_requests: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      {
        sessionAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
