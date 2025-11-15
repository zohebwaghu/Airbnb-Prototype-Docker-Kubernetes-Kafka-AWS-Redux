// Kafka Producer Service for Frontend
// Note: In production, Kafka should be accessed via a backend proxy
// This is a simplified version for Lab 2 demonstration

const KAFKA_BROKER = process.env.REACT_APP_KAFKA_BROKER || 'localhost:9092';

// For browser-based Kafka, we'll use a WebSocket proxy or REST API
// This is a placeholder that would connect to a backend Kafka proxy
export const publishBookingEvent = async (topic, eventData) => {
  try {
    // In a real implementation, this would connect to Kafka via WebSocket
    // or through a backend API that acts as a Kafka producer
    
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002'}/api/kafka/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        event: eventData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to publish event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error publishing Kafka event:', error);
    // Fallback: also make direct API call
    throw error;
  }
};

// Booking event types
export const BOOKING_EVENTS = {
  CREATED: 'booking-created',
  STATUS_UPDATED: 'booking-status-updated',
  ACCEPTED: 'booking-accepted',
  CANCELLED: 'booking-cancelled'
};

