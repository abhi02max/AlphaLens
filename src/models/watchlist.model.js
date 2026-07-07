import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    symbols: [
      {
        type: String,
        uppercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
export default Watchlist;
