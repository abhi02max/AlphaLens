import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().catch(error => {
  console.error('Failed to connect to the database:', error.message);
  console.log('Skipping DB connection for now so you can test routes...');
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
