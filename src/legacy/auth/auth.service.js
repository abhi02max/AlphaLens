import User from '../models/user.model.js';
import Watchlist from '../models/watchlist.model.js';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../utils/appError.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'development_secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (userData) => {
  const { name, email, password } = userData;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ConflictError('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    learningMode: 'pro',
  });

  // Create an empty watchlist for the new user
  await Watchlist.create({ user: user._id, symbols: [] });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    learningMode: user.learningMode,
    token: generateToken(user._id),
  };
};

export const loginUser = async (email, password) => {
  // Find user and explicitly select password since we hid it in the schema
  const user = await User.findOne({ email }).select('+password');
  
  if (user && (await user.matchPassword(password))) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      learningMode: user.learningMode,
      token: generateToken(user._id),
    };
  } else {
    throw new UnauthorizedError('Invalid email or password');
  }
};
