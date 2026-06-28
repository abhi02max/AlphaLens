import Watchlist from '../models/watchlist.model.js';

export const getWatchlist = async (userId) => {
  let watchlist = await Watchlist.findOne({ user: userId });
  if (!watchlist) {
    watchlist = await Watchlist.create({ user: userId, symbols: [] });
  }
  return watchlist;
};

export const addSymbol = async (userId, symbol) => {
  const upperSymbol = symbol.toUpperCase();
  // Use $addToSet to prevent duplicate symbols
  const watchlist = await Watchlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { symbols: upperSymbol } },
    { new: true, upsert: true }
  );
  return watchlist;
};

export const removeSymbol = async (userId, symbol) => {
  const upperSymbol = symbol.toUpperCase();
  // Use $pull to remove the symbol from the array
  const watchlist = await Watchlist.findOneAndUpdate(
    { user: userId },
    { $pull: { symbols: upperSymbol } },
    { new: true }
  );
  return watchlist || { symbols: [] };
};
