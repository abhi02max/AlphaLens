import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import healthRoutes from './routes/health.routes.js';
import stockRoutes from './routes/stock.routes.js';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import watchlistRoutes from './routes/watchlist.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();

// SECURITY Middleware: Helmet sets HTTP headers to prevent XSS, Clickjacking, and sniffing
app.use(helmet());

// Middleware: JSON Parsing
app.use(express.json());

// SECURITY Middleware: Sanitize data against NoSQL query injections
app.use(mongoSanitize());

// SECURITY Middleware: CORS for frontend requests
// In production, restrict this to your specific frontend URL
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://alphalens-app.vercel.app'] 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if(!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// SECURITY Middleware: Rate Limiting
// Prevents brute-force login attempts and DDoS API spam
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Middleware: Basic Logging (Morgan)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
