import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // sparse allows multiple nulls
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
    },
    learningMode: {
      type: String,
      enum: ['pro'],
      default: 'pro',
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
