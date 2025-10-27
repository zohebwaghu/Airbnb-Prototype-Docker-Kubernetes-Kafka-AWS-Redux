const express = require('express');
const Joi = require('joi');
const { pool } = require('../database');
const { requireAuth, requireOwner, requireTraveler } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createBookingSchema = Joi.object({
  property_id: Joi.number().integer().required(),
  check_in_date: Joi.date().required(),
  check_out_date: Joi.date().min(Joi.ref('check_in_date')).required(),
  number_of_guests: Joi.number().integer().min(1).required(),
  special_requests: Joi.string().optional()
});

const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid('accepted', 'cancelled').required()
});

// Create a new booking (travelers only)
router.post('/', requireTraveler, async (req, res) => {
  try {
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { property_id, check_in_date, check_out_date, number_of_guests, special_requests } = value;
    const traveler_id = req.session.userId;

    // Check if property exists and is available
    const [properties] = await pool.execute(
      'SELECT * FROM properties WHERE id = ? AND is_available = TRUE',
      [property_id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found or not available' });
    }

    const property = properties[0];

    // Check if property can accommodate the number of guests
    if (number_of_guests > property.max_guests) {
      return res.status(400).json({ error: `Property can only accommodate ${property.max_guests} guests` });
    }

    // Check for booking conflicts
    const [conflictingBookings] = await pool.execute(
      `SELECT id FROM bookings
       WHERE property_id = ? AND status IN ('pending', 'accepted')
       AND ((check_in_date <= ? AND check_out_date > ?)
       OR (check_in_date < ? AND check_out_date >= ?)
       OR (check_in_date >= ? AND check_out_date <= ?))`,
      [property_id, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]
    );

    if (conflictingBookings.length > 0) {
      return res.status(409).json({ error: 'Property is not available for the selected dates' });
    }

    // Calculate total price
    const nights = Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24));
    const total_price = (property.base_price * nights) + property.cleaning_fee + property.service_fee;

    // Create booking
    const [result] = await pool.execute(
      `INSERT INTO bookings (property_id, traveler_id, check_in_date, check_out_date,
                           number_of_guests, total_price, special_requests)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [property_id, traveler_id, check_in_date, check_out_date, number_of_guests, total_price, special_requests || null]
    );

    res.status(201).json({
      message: 'Booking request submitted successfully',
      bookingId: result.insertId,
      totalPrice: total_price
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bookings for current user (both travelers and owners)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const userType = req.session.userType;

    let query, values;

    if (userType === 'traveler') {
      query = `
        SELECT b.*, p.name as property_name, p.location as property_location,
               p.city, p.country, u.name as owner_name, b.cancelled_by
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
               p.city, p.country, u.name as traveler_name, b.cancelled_by
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

// Get specific booking
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const userId = req.session.userId;
    const userType = req.session.userType;

    let query, values;

    if (userType === 'traveler') {
      query = `
        SELECT b.*, p.name as property_name, p.location as property_location,
               p.city, p.country, u.name as owner_name, u.email as owner_email
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u ON p.owner_id = u.id
        WHERE b.id = ? AND b.traveler_id = ?
      `;
      values = [bookingId, userId];
    } else {
      query = `
        SELECT b.*, p.name as property_name, p.location as property_location,
               p.city, p.country, u.name as traveler_name, u.email as traveler_email
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users u ON b.traveler_id = u.id
        WHERE b.id = ? AND p.owner_id = ?
      `;
      values = [bookingId, userId];
    }

    const [bookings] = await pool.execute(query, values);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking: bookings[0] });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status (owners only)
router.put('/:id/status', requireOwner, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { error, value } = updateBookingStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { status } = value;

    // Check if booking belongs to owner's property
    const [bookings] = await pool.execute(
      `SELECT b.*, p.owner_id FROM bookings b
       JOIN properties p ON b.property_id = p.id
       WHERE b.id = ? AND p.owner_id = ?`,
      [bookingId, req.session.userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Only allow status updates for pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Can only update status of pending bookings' });
    }

    // Update booking status
    await pool.execute(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, bookingId]
    );

    res.json({ message: `Booking ${status} successfully` });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel booking (both travelers and owners)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const userId = req.session.userId;
    const userType = req.session.userType;

    // Check if booking exists and user has permission to cancel it
    let query, values;

    if (userType === 'traveler') {
      query = 'SELECT * FROM bookings WHERE id = ? AND traveler_id = ?';
      values = [bookingId, userId];
    } else {
      query = `
        SELECT b.* FROM bookings b
        JOIN properties p ON b.property_id = p.id
        WHERE b.id = ? AND p.owner_id = ?
      `;
      values = [bookingId, userId];
    }

    const [bookings] = await pool.execute(query, values);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Only allow cancellation of pending or accepted bookings
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ error: 'Can only cancel pending or accepted bookings' });
    }

    // Update booking status to cancelled and record who cancelled
    await pool.execute(
      'UPDATE bookings SET status = "cancelled", cancelled_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userType, bookingId]
    );

    res.json({ message: 'Booking cancelled successfully' });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check property availability for given dates
router.get('/check-availability/:propertyId', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const { check_in_date, check_out_date } = req.query;

    if (!check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'Check-in and check-out dates are required' });
    }

    // Check if property exists
    const [properties] = await pool.execute(
      'SELECT id FROM properties WHERE id = ?',
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check for booking conflicts
    const [conflictingBookings] = await pool.execute(
      `SELECT id FROM bookings
       WHERE property_id = ? AND status IN ('pending', 'accepted')
       AND ((check_in_date <= ? AND check_out_date > ?)
       OR (check_in_date < ? AND check_out_date >= ?)
       OR (check_in_date >= ? AND check_out_date <= ?))`,
      [propertyId, check_in_date, check_in_date, check_out_date, check_out_date, check_in_date, check_out_date]
    );

    const isAvailable = conflictingBookings.length === 0;

    res.json({
      propertyId,
      checkInDate: check_in_date,
      checkOutDate: check_out_date,
      isAvailable
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
