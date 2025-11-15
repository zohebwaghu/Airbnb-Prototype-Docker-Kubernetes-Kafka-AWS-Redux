const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { connectDB, getDB } = require('../shared/mongodb');
const { publishEvent } = require('../shared/kafka-producer');
const { subscribeToTopic } = require('../shared/kafka-consumer');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Kafka Topics
const TOPICS = {
  BOOKING_CREATED: 'booking-created',
  BOOKING_ACCEPTED: 'booking-accepted',
  BOOKING_CANCELLED: 'booking-cancelled',
  BOOKING_STATUS_UPDATED: 'booking-status-updated'
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Handle booking created event from Kafka
const handleBookingCreated = async (event) => {
  try {
    console.log('Owner service received booking created event:', event);
    
    // In a real implementation, you would:
    // 1. Store the booking request in owner's pending bookings
    // 2. Send notification to owner
    // 3. Wait for owner's response (accept/decline)
    
    // For now, we'll just log it
    // The owner can accept/decline via the API endpoint below
  } catch (error) {
    console.error('Error handling booking created event:', error);
  }
};

// Get owner's bookings
app.get('/api/owner/bookings', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner only.' });
    }

    const db = getDB();
    const bookings = db.collection('bookings');
    const properties = db.collection('properties');

    // Get owner's properties
    const { ObjectId } = require('mongodb');
    const ownerProperties = await properties.find({ 
      owner_id: new ObjectId(req.user.userId) 
    }).toArray();

    const propertyIds = ownerProperties.map(p => p._id);

    // Get bookings for owner's properties
    const ownerBookings = await bookings.find({
      property_id: { $in: propertyIds }
    }).sort({ created_at: -1 }).toArray();

    // Format response
    const formattedBookings = ownerBookings.map(booking => ({
      id: booking._id.toString(),
      property_id: booking.property_id.toString(),
      traveler_id: booking.traveler_id.toString(),
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      number_of_guests: booking.number_of_guests,
      total_price: booking.total_price,
      status: booking.status,
      special_requests: booking.special_requests,
      created_at: booking.created_at
    }));

    res.json({ bookings: formattedBookings });
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept booking
app.put('/api/owner/bookings/:id/accept', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner only.' });
    }

    const bookingId = req.params.id;
    const db = getDB();
    const bookings = db.collection('bookings');
    const properties = db.collection('properties');
    const { ObjectId } = require('mongodb');

    // Verify booking exists and belongs to owner
    const booking = await bookings.findOne({
      _id: new ObjectId(bookingId)
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify property belongs to owner
    const property = await properties.findOne({
      _id: booking.property_id,
      owner_id: new ObjectId(req.user.userId)
    });

    if (!property) {
      return res.status(403).json({ error: 'Access denied. Not your property.' });
    }

    // Update booking status
    await bookings.updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: { status: 'accepted', updated_at: new Date() } }
    );

    // Publish booking accepted event
    await publishEvent(TOPICS.BOOKING_ACCEPTED, {
      booking_id: bookingId,
      property_id: booking.property_id.toString(),
      traveler_id: booking.traveler_id.toString(),
      status: 'accepted'
    });

    res.json({ message: 'Booking accepted successfully' });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Decline/Cancel booking
app.put('/api/owner/bookings/:id/decline', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner only.' });
    }

    const bookingId = req.params.id;
    const db = getDB();
    const bookings = db.collection('bookings');
    const properties = db.collection('properties');
    const { ObjectId } = require('mongodb');

    // Verify booking exists and belongs to owner
    const booking = await bookings.findOne({
      _id: new ObjectId(bookingId)
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify property belongs to owner
    const property = await properties.findOne({
      _id: booking.property_id,
      owner_id: new ObjectId(req.user.userId)
    });

    if (!property) {
      return res.status(403).json({ error: 'Access denied. Not your property.' });
    }

    // Update booking status
    await bookings.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          status: 'cancelled', 
          cancelled_by: 'owner',
          updated_at: new Date() 
        } 
      }
    );

    // Publish booking cancelled event
    await publishEvent(TOPICS.BOOKING_CANCELLED, {
      booking_id: bookingId,
      property_id: booking.property_id.toString(),
      traveler_id: booking.traveler_id.toString(),
      status: 'cancelled',
      cancelled_by: 'owner'
    });

    res.json({ message: 'Booking declined successfully' });
  } catch (error) {
    console.error('Decline booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'owner-service' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Subscribe to booking created events
    await subscribeToTopic(TOPICS.BOOKING_CREATED, handleBookingCreated, 'owner-service-group');
    
    app.listen(PORT, () => {
      console.log(`Owner Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start owner service:', error);
    process.exit(1);
  }
};

startServer();

