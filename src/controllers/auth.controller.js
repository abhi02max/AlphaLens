import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/appError.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, learningMode } = req.body;
  
  if (!name || !email || !password) {
    throw new BadRequestError('Please include name, email, and password');
  }

  const userData = await authService.registerUser({ name, email, password, learningMode });
  
  res.status(201).json({
    success: true,
    data: userData,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please include email and password');
  }

  const userData = await authService.loginUser(email, password);
  
  res.status(200).json({
    success: true,
    data: userData,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const { learningMode } = req.body;

  if (!learningMode || !['beginner', 'pro'].includes(learningMode)) {
    throw new BadRequestError('Learning mode must be "beginner" or "pro"');
  }

  req.user.learningMode = learningMode;
  await req.user.save();

  res.status(200).json({
    success: true,
    data: req.user,
  });
});
