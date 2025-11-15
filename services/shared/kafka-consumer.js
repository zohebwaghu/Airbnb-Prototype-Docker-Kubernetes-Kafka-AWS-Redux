const { Kafka } = require('kafkajs');

let kafka = null;
let consumer = null;

const initializeKafka = (groupId) => {
  const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
  
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'airbnb-service',
    brokers: kafkaBrokers.split(','),
    retry: {
      initialRetryTime: 100,
      retries: 8
    }
  });
  
  consumer = kafka.consumer({ groupId: groupId || 'airbnb-consumer-group' });
  return consumer;
};

const getConsumer = async (groupId) => {
  if (!consumer) {
    consumer = initializeKafka(groupId);
    await consumer.connect();
  }
  return consumer;
};

const subscribeToTopic = async (topic, handler, groupId) => {
  try {
    const kafkaConsumer = await getConsumer(groupId);
    
    await kafkaConsumer.subscribe({ 
      topic,
      fromBeginning: false 
    });
    
    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log(`Received event from topic ${topic}:`, event);
          await handler(event, topic, partition);
        } catch (error) {
          console.error(`Error processing message from topic ${topic}:`, error);
        }
      }
    });
    
    console.log(`Subscribed to topic ${topic}`);
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
    throw error;
  }
};

const disconnect = async () => {
  if (consumer) {
    await consumer.disconnect();
  }
};

module.exports = {
  initializeKafka,
  getConsumer,
  subscribeToTopic,
  disconnect
};

