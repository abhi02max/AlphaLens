import { createClient } from 'redis';

// Create a Redis client
const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379'
});

// Handle connection events
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully!');
});

// Since you might not have Redis installed locally yet, we won't crash the app if connecting fails.
// In a real production setup, we would await redisClient.connect() when the server starts.
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Could not connect to Redis. Running without cache.');
  }
};

// Call connect immediately
connectRedis();

export default redisClient;
