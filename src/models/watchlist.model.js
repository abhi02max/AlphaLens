import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbols: [
      {
        type: String,
        uppercase: true, // e.g. "aapl" becomes "AAPL"
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
export default Watchlist;
