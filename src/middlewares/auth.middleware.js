import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { UnauthorizedError } from '../utils/appError.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Read token from Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token signature using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret');

      // 3. Attach the user associated with this token to req.user (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return next(new UnauthorizedError('User not found'));
      }
      
      next(); // Move to the next middleware or controller
    } catch (error) {
      console.error('JWT Error:', error.message);
      return next(new UnauthorizedError('Not authorized, token failed'));
    }
  } else {
    return next(new UnauthorizedError('Not authorized, no token provided'));
  }
};
