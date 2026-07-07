import { clerkMiddleware, requireAuth as clerkRequireAuth } from '@clerk/express';
import User from '../models/user.model.js';
import { UnauthorizedError } from '../utils/appError.js';

// 2. We take the valid Clerk ID and attach our DB user (Lazy Syncing)
export const requireAuth = [
  clerkMiddleware(),
  clerkRequireAuth(),
  async (req, res, next) => {
    try {
      if (!req.auth || !req.auth.userId) {
        return next(new UnauthorizedError('Not authorized'));
      }
      
      const clerkId = req.auth.userId;
      
      // Find or create the user in our DB
      let user = await User.findOne({ clerkId });
      
      if (!user) {
        user = await User.create({
          clerkId,
          learningMode: 'beginner'
        });
      }
      
      // Attach full MongoDB user so existing controllers work seamlessly
      req.user = user;
      
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return next(new UnauthorizedError('Not authorized'));
    }
  }
];
