const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { pool } = require('../database');

const router = express.Router();

// Validation schemas
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  userType: Joi.string().valid('traveler', 'owner').required(),
  phone: Joi.string().optional(),
  city: Joi.string().optional(),
  country: Joi.string().optional(),
  location: Joi.string().optional() // For owners
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password, userType, phone, city, country, location } = value;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, user_type, phone, city, country, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, passwordHash, userType, phone || null, city || null, country || null, location || null]
    );

    // Set session
    req.session.userId = result.insertId;
    req.session.userType = userType;
    req.session.userEmail = email;

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.insertId,
        name,
        email,
        userType
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, name, email, password_hash, user_type FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.userType = user.user_type;
    req.session.userEmail = user.email;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check authentication status
router.get('/me', (req, res) => {
  if (req.session.userId) {
    res.json({
      user: {
        id: req.session.userId,
        email: req.session.userEmail,
        userType: req.session.userType
      }
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = router;
