const axios = require('axios');
const bcrypt = require('bcryptjs');

// Configure axios for testing
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

const testUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    userType: 'owner',
    phone: '+1234567890',
    city: 'New York',
    country: 'USA',
    location: 'Manhattan, New York'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    userType: 'traveler',
    phone: '+1987654321',
    city: 'Los Angeles',
    country: 'USA'
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: 'password123',
    userType: 'traveler',
    phone: '+1555123456',
    city: 'Chicago',
    country: 'USA'
  }
];

const testProperties = [
  {
    name: 'Cozy Apartment in Manhattan',
    description: 'Beautiful apartment in the heart of Manhattan with great city views.',
    property_type: 'apartment',
    location: '123 Main St, Manhattan',
    city: 'New York',
    country: 'USA',
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    base_price: 150.00,
    cleaning_fee: 50.00,
    service_fee: 20.00,
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Heating']
  },
  {
    name: 'Modern Loft Downtown',
    description: 'Stylish loft apartment with modern amenities and downtown location.',
    property_type: 'apartment',
    location: '456 Downtown Ave',
    city: 'New York',
    country: 'USA',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    base_price: 120.00,
    cleaning_fee: 40.00,
    service_fee: 15.00,
    amenities: ['WiFi', 'Gym', 'Elevator', 'Concierge']
  },
  {
    name: 'Beachfront Villa',
    description: 'Luxurious beachfront villa with private pool and ocean views.',
    property_type: 'house',
    location: '789 Ocean Drive',
    city: 'Miami',
    country: 'USA',
    bedrooms: 4,
    bathrooms: 3,
    max_guests: 8,
    base_price: 500.00,
    cleaning_fee: 100.00,
    service_fee: 50.00,
    amenities: ['WiFi', 'Pool', 'Beach Access', 'Parking', 'Air Conditioning']
  }
];

async function createTestData() {
  console.log('🚀 Starting test data creation...\n');

  try {
    // Create test users
    console.log('👥 Creating test users...');
    for (const userData of testUsers) {
      try {
        const response = await axios.post('/auth/signup', userData);
        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️ User already exists: ${userData.email}`);
        } else {
          console.log(`❌ Failed to create user ${userData.email}:`, error.response?.data?.error || error.message);
        }
      }
    }

    // Login as owner and create properties
    console.log('\n🔑 Logging in as owner...');
    const loginResponse = await axios.post('/auth/login', {
      email: 'john@example.com',
      password: 'password123'
    });
    console.log('✅ Owner logged in');

    // Create test properties
    console.log('\n🏠 Creating test properties...');
    for (const propertyData of testProperties) {
      try {
        const response = await axios.post('/properties', propertyData);
        console.log(`✅ Created property: ${propertyData.name}`);
      } catch (error) {
        console.log(`❌ Failed to create property ${propertyData.name}:`, error.response?.data?.error || error.message);
      }
    }

    // Login as traveler and create some bookings and favorites
    console.log('\n🔑 Logging in as traveler...');
    await axios.post('/auth/login', {
      email: 'jane@example.com',
      password: 'password123'
    });
    console.log('✅ Traveler logged in');

    // Get properties to book and favorite
    const propertiesResponse = await axios.get('/properties');
    const properties = propertiesResponse.data.properties || [];

    if (properties.length > 0) {
      // Create a booking
      console.log('\n📅 Creating test booking...');
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 2);

        await axios.post('/bookings', {
          property_id: properties[0].id,
          check_in_date: tomorrow.toISOString().split('T')[0],
          check_out_date: dayAfter.toISOString().split('T')[0],
          number_of_guests: 2,
          special_requests: 'Looking forward to a great stay!'
        });
        console.log('✅ Created test booking');
      } catch (error) {
        console.log('❌ Failed to create booking:', error.response?.data?.error || error.message);
      }

      // Add property to favorites
      console.log('\n❤️ Adding property to favorites...');
      try {
        await axios.post(`/users/favorites/${properties[1].id}`);
        console.log('✅ Added property to favorites');
      } catch (error) {
        console.log('❌ Failed to add favorite:', error.response?.data?.error || error.message);
      }
    }

    // Test AI agent (if available)
    console.log('\n🤖 Testing AI agent...');
    try {
      await axios.post('/agent/travel-plan', {
        booking_context: {
          location: 'New York',
          start_date: '2024-06-01',
          end_date: '2024-06-03',
          party_type: 'couple'
        },
        preferences: {
          budget: 'moderate',
          interests: ['sightseeing', 'food', 'culture'],
          dietary_filters: []
        }
      });
      console.log('✅ AI agent working');
    } catch (error) {
      console.log('❌ AI agent test failed:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Test data creation completed!');
    console.log('\n📋 Test Credentials:');
    console.log('Owner: john@example.com / password123');
    console.log('Traveler: jane@example.com / password123');
    console.log('Traveler: bob@example.com / password123');

  } catch (error) {
    console.error('❌ Test data creation failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };
