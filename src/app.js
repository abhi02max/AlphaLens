import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes.js';
import stockRoutes from './routes/stock.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();

// Middleware: JSON Parsing
app.use(express.json());

// Middleware: CORS for frontend requests
app.use(cors());

// Middleware: Basic Logging (Morgan)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
