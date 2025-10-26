const express = require('express');
const Joi = require('joi');
const { pool } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  phone: Joi.string().optional(),
  about_me: Joi.string().optional(),
  city: Joi.string().optional(),
  country: Joi.string().optional(),
  languages: Joi.string().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  location: Joi.string().optional() // For owners
});

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, phone, profile_picture, about_me, city, country,
              languages, gender, location, user_type, created_at
       FROM users WHERE id = ?`,
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.session.userId);

    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return updated profile
    const [updatedUsers] = await pool.execute(
      `SELECT id, name, email, phone, profile_picture, about_me, city, country,
              languages, gender, location, user_type, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.session.userId]
    );

    res.json({ user: updatedUsers[0] });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile picture
router.post('/profile-picture', requireAuth, async (req, res) => {
  try {
    // In a real implementation, you would handle file upload here
    // For now, we'll just update the profile_picture field with a provided URL
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const [result] = await pool.execute(
      'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [imageUrl, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile picture updated successfully', imageUrl });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user bookings (both as traveler and owner)
router.get('/bookings', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const userType = req.session.userType;

    let query, values;

    if (userType === 'traveler') {
      query = `
        SELECT b.*, p.name as property_name, p.location as property_location,
               u.name as owner_name
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u ON p.owner_id = u.id
        WHERE b.traveler_id = ?
        ORDER BY b.created_at DESC
      `;
      values = [userId];
    } else {
      query = `
        SELECT b.*, p.name as property_name, p.location as property_location,
               u.name as traveler_name
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u ON b.traveler_id = u.id
        WHERE p.owner_id = ?
        ORDER BY b.created_at DESC
      `;
      values = [userId];
    }

    const [bookings] = await pool.execute(query, values);
    res.json({ bookings });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user favorites (for travelers only)
router.get('/favorites', requireAuth, async (req, res) => {
  try {
    if (req.session.userType !== 'traveler') {
      return res.status(403).json({ error: 'Only travelers can have favorites' });
    }

    const query = `
      SELECT p.*, pi.image_url as primary_image
      FROM favorites f
      JOIN properties p ON f.property_id = p.id
      LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;

    const [favorites] = await pool.execute(query, [req.session.userId]);
    res.json({ favorites });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to favorites (for travelers only)
router.post('/favorites/:propertyId', requireAuth, async (req, res) => {
  try {
    if (req.session.userType !== 'traveler') {
      return res.status(403).json({ error: 'Only travelers can add favorites' });
    }

    const propertyId = parseInt(req.params.propertyId);
    const userId = req.session.userId;

    // Check if property exists
    const [properties] = await pool.execute(
      'SELECT id FROM properties WHERE id = ?',
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if already favorited
    const [existingFavorites] = await pool.execute(
      'SELECT id FROM favorites WHERE user_id = ? AND property_id = ?',
      [userId, propertyId]
    );

    if (existingFavorites.length > 0) {
      return res.status(409).json({ error: 'Property already in favorites' });
    }

    // Add to favorites
    await pool.execute(
      'INSERT INTO favorites (user_id, property_id) VALUES (?, ?)',
      [userId, propertyId]
    );

    res.status(201).json({ message: 'Property added to favorites' });

  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from favorites (for travelers only)
router.delete('/favorites/:propertyId', requireAuth, async (req, res) => {
  try {
    if (req.session.userType !== 'traveler') {
      return res.status(403).json({ error: 'Only travelers can manage favorites' });
    }

    const propertyId = parseInt(req.params.propertyId);
    const userId = req.session.userId;

    const [result] = await pool.execute(
      'DELETE FROM favorites WHERE user_id = ? AND property_id = ?',
      [userId, propertyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Property removed from favorites' });

  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
