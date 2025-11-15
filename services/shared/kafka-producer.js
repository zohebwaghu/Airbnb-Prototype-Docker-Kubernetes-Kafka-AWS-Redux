const { Kafka } = require('kafkajs');

let kafka = null;
let producer = null;

const initializeKafka = () => {
  const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
  
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'airbnb-service',
    brokers: kafkaBrokers.split(','),
    retry: {
      initialRetryTime: 100,
      retries: 8
    }
  });
  
  producer = kafka.producer();
  return producer;
};

const getProducer = async () => {
  if (!producer) {
    producer = initializeKafka();
    await producer.connect();
  }
  return producer;
};

const publishEvent = async (topic, event) => {
  try {
    const kafkaProducer = await getProducer();
    
    await kafkaProducer.send({
      topic,
      messages: [{
        key: event.id || event.userId || event.propertyId || 'default',
        value: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          eventId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })
      }]
    });
    
    console.log(`Event published to topic ${topic}:`, event);
  } catch (error) {
    console.error(`Error publishing event to topic ${topic}:`, error);
    throw error;
  }
};

const disconnect = async () => {
  if (producer) {
    await producer.disconnect();
  }
};

module.exports = {
  initializeKafka,
  getProducer,
  publishEvent,
  disconnect
};

