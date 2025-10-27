const express = require('express');
const Joi = require('joi');
const { pool } = require('../database');
const { requireAuth, requireOwner } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const propertySchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000).required(),
  property_type: Joi.string().valid('apartment', 'house', 'condo', 'townhouse', 'other').required(),
  location: Joi.string().min(10).max(255).required(),
  city: Joi.string().min(2).max(100).required(),
  country: Joi.string().min(2).max(100).required(),
  bedrooms: Joi.number().integer().min(1).max(20).required(),
  bathrooms: Joi.number().min(0.5).max(20).required(),
  max_guests: Joi.number().integer().min(1).max(50).required(),
  base_price: Joi.number().positive().required(),
  cleaning_fee: Joi.number().min(0).optional(),
  service_fee: Joi.number().min(0).optional(),
  amenities: Joi.array().items(Joi.string()).optional()
});

const searchSchema = Joi.object({
  location: Joi.string().optional(),
  city: Joi.string().optional(),
  country: Joi.string().optional(),
  check_in_date: Joi.date().optional(),
  check_out_date: Joi.date().optional(),
  guests: Joi.number().integer().min(1).optional(),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  bedrooms: Joi.number().integer().min(1).optional(),
  property_type: Joi.string().valid('apartment', 'house', 'condo', 'townhouse', 'other').optional(),
  owner_id: Joi.number().integer().optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

// Get all properties with search and filters
router.get('/', async (req, res) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let query = `
      SELECT p.*, pi.image_url as primary_image,
             u.name as owner_name, u.email as owner_email
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE
      WHERE p.is_available = TRUE
    `;

    const values = [];

    // Add search filters
    if (value.location) {
      query += ' AND (p.location LIKE ? OR p.city LIKE ? OR p.country LIKE ?)';
      values.push(`%${value.location}%`, `%${value.location}%`, `%${value.location}%`);
    }

    if (value.city) {
      query += ' AND p.city LIKE ?';
      values.push(`%${value.city}%`);
    }

    if (value.country) {
      query += ' AND p.country LIKE ?';
      values.push(`%${value.country}%`);
    }

    if (value.min_price) {
      query += ' AND p.base_price >= ?';
      values.push(value.min_price);
    }

    if (value.max_price) {
      query += ' AND p.base_price <= ?';
      values.push(value.max_price);
    }

    if (value.bedrooms) {
      query += ' AND p.bedrooms >= ?';
      values.push(value.bedrooms);
    }

    if (value.property_type) {
      query += ' AND p.property_type = ?';
      values.push(value.property_type);
    }

    if (value.owner_id) {
      query += ' AND p.owner_id = ?';
      values.push(value.owner_id);
    }

    query += ' ORDER BY p.created_at DESC';

    if (value.limit) {
      query += ' LIMIT ?';
      values.push(value.limit);
    }

    const [properties] = await pool.execute(query, values);
    res.json({ properties });

  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    const query = `
      SELECT p.*, pi.image_url as primary_image,
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE
      WHERE p.id = ?
    `;

    const [properties] = await pool.execute(query, [propertyId]);

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Get property images with categories
    const [images] = await pool.execute(
      'SELECT image_url, category, is_primary FROM property_images WHERE property_id = ? ORDER BY is_primary DESC',
      [propertyId]
    );

    const property = properties[0];
    property.images = images;

    res.json({ property });

  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new property (owners only)
router.post('/', requireOwner, async (req, res) => {
  try {
    const { error, value } = propertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      name, description, property_type, location, city, country,
      bedrooms, bathrooms, max_guests, base_price, cleaning_fee = 0,
      service_fee = 0, amenities = []
    } = value;

    const [result] = await pool.execute(
      `INSERT INTO properties (
        owner_id, name, description, property_type, location, city, country,
        bedrooms, bathrooms, max_guests, base_price, cleaning_fee, service_fee, amenities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId, name, description, property_type, location, city, country,
        bedrooms, bathrooms, max_guests, base_price, cleaning_fee, service_fee,
        JSON.stringify(amenities)
      ]
    );

    res.status(201).json({
      message: 'Property created successfully',
      propertyId: result.insertId
    });

  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update property (owners only)
router.put('/:id', requireOwner, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    // Check if property belongs to the owner
    const [properties] = await pool.execute(
      'SELECT owner_id FROM properties WHERE id = ?',
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (properties[0].owner_id !== req.session.userId) {
      return res.status(403).json({ error: 'You can only edit your own properties' });
    }

    const { error, value } = propertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      name, description, property_type, location, city, country,
      bedrooms, bathrooms, max_guests, base_price, cleaning_fee = 0,
      service_fee = 0, amenities = []
    } = value;

    const [result] = await pool.execute(
      `UPDATE properties SET
        name = ?, description = ?, property_type = ?, location = ?, city = ?, country = ?,
        bedrooms = ?, bathrooms = ?, max_guests = ?, base_price = ?,
        cleaning_fee = ?, service_fee = ?, amenities = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, description, property_type, location, city, country,
        bedrooms, bathrooms, max_guests, base_price, cleaning_fee, service_fee,
        JSON.stringify(amenities), propertyId
      ]
    );

    res.json({ message: 'Property updated successfully' });

  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete property (owners only)
router.delete('/:id', requireOwner, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    // Check if property belongs to the owner
    const [properties] = await pool.execute(
      'SELECT owner_id FROM properties WHERE id = ?',
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (properties[0].owner_id !== req.session.userId) {
      return res.status(403).json({ error: 'You can only delete your own properties' });
    }

    // Check if there are active bookings
    const [activeBookings] = await pool.execute(
      'SELECT id FROM bookings WHERE property_id = ? AND status IN ("pending", "accepted")',
      [propertyId]
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({ error: 'Cannot delete property with active bookings' });
    }

    // Delete property images first
    await pool.execute('DELETE FROM property_images WHERE property_id = ?', [propertyId]);

    // Delete property
    await pool.execute('DELETE FROM properties WHERE id = ?', [propertyId]);

    res.json({ message: 'Property deleted successfully' });

  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get owner's properties
router.get('/owner/properties', requireOwner, async (req, res) => {
  try {
    const query = `
      SELECT p.*, pi.image_url as primary_image
      FROM properties p
      LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE
      WHERE p.owner_id = ?
      ORDER BY p.created_at DESC
    `;

    const [properties] = await pool.execute(query, [req.session.userId]);
    res.json({ properties });

  } catch (error) {
    console.error('Get owner properties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add property image (owners only)
router.post('/:id/images', requireOwner, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { imageUrl, isPrimary = false } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Check if property belongs to the owner
    const [properties] = await pool.execute(
      'SELECT owner_id FROM properties WHERE id = ?',
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (properties[0].owner_id !== req.session.userId) {
      return res.status(403).json({ error: 'You can only add images to your own properties' });
    }

    // If this is set as primary, remove primary from other images
    if (isPrimary) {
      await pool.execute(
        'UPDATE property_images SET is_primary = FALSE WHERE property_id = ?',
        [propertyId]
      );
    }

    const [result] = await pool.execute(
      'INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, ?)',
      [propertyId, imageUrl, isPrimary]
    );

    res.status(201).json({
      message: 'Image added successfully',
      imageId: result.insertId
    });

  } catch (error) {
    console.error('Add property image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
