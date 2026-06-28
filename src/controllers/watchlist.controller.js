import * as watchlistService from '../services/watchlist.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { BadRequestError } from '../utils/appError.js';

export const getWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await watchlistService.getWatchlist(req.user._id);
  res.status(200).json({
    success: true,
    data: watchlist.symbols,
  });
});

export const addStock = asyncHandler(async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) {
    throw new BadRequestError('Please provide a stock symbol');
  }

  const updatedWatchlist = await watchlistService.addSymbol(req.user._id, symbol);
  res.status(200).json({
    success: true,
    message: `${symbol.toUpperCase()} added to watchlist`,
    data: updatedWatchlist.symbols,
  });
});

export const removeStock = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  
  if (!symbol) {
    throw new BadRequestError('Please provide a stock symbol in the URL parameters');
  }

  const updatedWatchlist = await watchlistService.removeSymbol(req.user._id, symbol);
  res.status(200).json({
    success: true,
    message: `${symbol.toUpperCase()} removed from watchlist`,
    data: updatedWatchlist.symbols,
  });
});
