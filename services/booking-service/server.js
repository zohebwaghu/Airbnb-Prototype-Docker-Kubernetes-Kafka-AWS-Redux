const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB, getDB } = require('../shared/mongodb');
const { publishEvent } = require('../shared/kafka-producer');
const { subscribeToTopic } = require('../shared/kafka-consumer');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// Kafka Topics
const TOPICS = {
  BOOKING_CREATED: 'booking-created',
  BOOKING_STATUS_UPDATED: 'booking-status-updated',
  BOOKING_ACCEPTED: 'booking-accepted',
  BOOKING_CANCELLED: 'booking-cancelled'
};

// Create booking (from frontend via Kafka)
const handleBookingCreated = async (event) => {
  try {
    const db = getDB();
    const bookings = db.collection('bookings');
    
    const booking = {
      property_id: event.property_id,
      traveler_id: event.traveler_id,
      check_in_date: new Date(event.check_in_date),
      check_out_date: new Date(event.check_out_date),
      number_of_guests: event.number_of_guests,
      total_price: event.total_price,
      status: 'pending',
      special_requests: event.special_requests || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await bookings.insertOne(booking);
    booking._id = result.insertedId;
    
    // Publish booking created event for Owner service
    await publishEvent(TOPICS.BOOKING_CREATED, {
      booking_id: result.insertedId.toString(),
      ...booking,
      property_id: booking.property_id.toString(),
      traveler_id: booking.traveler_id.toString()
    });
    
    console.log('Booking created:', result.insertedId);
    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

// Update booking status (from Owner service via Kafka)
const handleBookingStatusUpdate = async (event) => {
  try {
    const db = getDB();
    const bookings = db.collection('bookings');
    
    const update = {
      status: event.status,
      updated_at: new Date()
    };
    
    if (event.cancelled_by) {
      update.cancelled_by = event.cancelled_by;
    }
    
    await bookings.updateOne(
      { _id: require('mongodb').ObjectId.createFromHexString(event.booking_id) },
      { $set: update }
    );
    
    // Publish status update back to Traveler service
    await publishEvent(TOPICS.BOOKING_STATUS_UPDATED, {
      booking_id: event.booking_id,
      status: event.status,
      traveler_id: event.traveler_id
    });
    
    console.log('Booking status updated:', event.booking_id, event.status);
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'booking-service' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Subscribe to Kafka topics
    await subscribeToTopic(TOPICS.BOOKING_CREATED, handleBookingCreated, 'booking-service-group');
    await subscribeToTopic(TOPICS.BOOKING_STATUS_UPDATED, handleBookingStatusUpdate, 'booking-service-group');
    
    app.listen(PORT, () => {
      console.log(`Booking Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start booking service:', error);
    process.exit(1);
  }
};

startServer();

