import { createClient } from 'redis';

// Create a Redis client (Supports Upstash Redis via UPSTASH_REDIS_URL)
const redisClient = createClient({
  url: process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    // Disable automatic reconnections to prevent log spam if Redis isn't installed locally
    reconnectStrategy: false 
  }
});

let hasLoggedError = false;

// Handle connection events
redisClient.on('error', (err) => {
  if (!hasLoggedError) {
    console.log('⚠️ Redis not found. App will run normally without caching.');
    hasLoggedError = true;
  }
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

export { connectRedis };
export default redisClient;
