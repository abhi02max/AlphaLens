import 'dotenv/config'; // Must be first so env vars load before other modules evaluate
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    console.log('Skipping DB connection for now so you can test routes...');
  }

  try {
    // Connect to Redis
    await connectRedis();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    console.log('Running without cache...');
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
