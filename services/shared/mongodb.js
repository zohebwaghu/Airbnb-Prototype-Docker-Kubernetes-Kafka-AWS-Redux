const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

let client = null;
let db = null;

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB_NAME || 'airbnb_db';
    
    client = new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await client.connect();
    db = client.db(dbName);
    
    console.log('MongoDB connected successfully');
    
    // Create indexes
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

const createIndexes = async () => {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ user_type: 1 });
    
    // Properties collection indexes
    await db.collection('properties').createIndex({ owner_id: 1 });
    await db.collection('properties').createIndex({ location: 'text', city: 'text', country: 'text' });
    await db.collection('properties').createIndex({ city: 1 });
    await db.collection('properties').createIndex({ country: 1 });
    await db.collection('properties').createIndex({ is_available: 1 });
    
    // Bookings collection indexes
    await db.collection('bookings').createIndex({ property_id: 1 });
    await db.collection('bookings').createIndex({ traveler_id: 1 });
    await db.collection('bookings').createIndex({ status: 1 });
    await db.collection('bookings').createIndex({ check_in_date: 1, check_out_date: 1 });
    
    // Favorites collection indexes
    await db.collection('favorites').createIndex({ user_id: 1 });
    await db.collection('favorites').createIndex({ property_id: 1 });
    await db.collection('favorites').createIndex({ user_id: 1, property_id: 1 }, { unique: true });
    
    // Sessions collection indexes
    await db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
};

// Password encryption helper
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  connectDB,
  getDB,
  closeDB,
  hashPassword,
  comparePassword
};

