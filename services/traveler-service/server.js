const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { connectDB, getDB, hashPassword, comparePassword } = require('../shared/mongodb');
const { publishEvent } = require('../shared/kafka-producer');
const { subscribeToTopic } = require('../shared/kafka-consumer');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Validation schemas
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  userType: Joi.string().valid('traveler', 'owner').required(),
  phone: Joi.string().optional(),
  city: Joi.string().optional(),
  country: Joi.string().optional(),
  location: Joi.string().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  languages: Joi.string().optional(),
  about_me: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  userType: Joi.string().valid('traveler', 'owner').optional()
});

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id.toString(),
      email: user.email,
      userType: user.user_type
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password, userType, phone, city, country, location, gender, languages, about_me } = value;
    const db = getDB();
    const users = db.collection('users');

    // Check if user exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = {
      name,
      email,
      password_hash: passwordHash,
      user_type: userType,
      phone: phone || null,
      city: city || null,
      country: country || null,
      location: location || null,
      gender: gender || null,
      languages: languages || null,
      about_me: about_me || null,
      profile_picture: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await users.insertOne(user);
    user._id = result.insertedId;
    delete user.password_hash;

    // Generate JWT token
    const token = generateToken(user);

    // Publish user created event
    await publishEvent('user-created', {
      user_id: result.insertedId.toString(),
      email,
      user_type: userType
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.insertedId.toString(),
        ...user
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, userType } = value;
    const db = getDB();
    const users = db.collection('users');

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check user type if specified
    if (userType && user.user_type !== userType) {
      return res.status(401).json({ error: 'Invalid user type' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password_hash;
    userResponse.id = userResponse._id.toString();
    delete userResponse._id;

    // Publish login event
    await publishEvent('user-logged-in', {
      user_id: user._id.toString(),
      email: user.email,
      user_type: user.user_type
    });

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/users/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const users = db.collection('users');

    const { ObjectId } = require('mongodb');
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResponse = { ...user };
    delete userResponse.password_hash;
    userResponse.id = userResponse._id.toString();
    delete userResponse._id;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/users/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const users = db.collection('users');

    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    // Remove fields that shouldn't be updated
    delete updateData.email;
    delete updateData.password_hash;
    delete updateData.user_type;
    delete updateData._id;

    const { ObjectId } = require('mongodb');
    await users.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: updateData }
    );

    const updatedUser = await users.findOne({ _id: new ObjectId(decoded.userId) });
    const userResponse = { ...updatedUser };
    delete userResponse.password_hash;
    userResponse.id = userResponse._id.toString();
    delete userResponse._id;

    res.json({ message: 'Profile updated successfully', user: userResponse });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'traveler-service' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Traveler Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start traveler service:', error);
    process.exit(1);
  }
};

startServer();

