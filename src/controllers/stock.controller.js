import * as stockService from '../services/stock.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { BadRequestError, NotFoundError } from '../utils/appError.js';

/**
 * @desc    Search for stocks by name or ticker
 * @route   GET /api/stocks/search?q=XYZ
 * @access  Public
 */
export const searchStocks = asyncHandler(async (req, res) => {
  const query = req.query.q;
  
  // Validation
  if (!query) {
    throw new BadRequestError('Please provide a search query using the ?q= parameter');
  }

  // Call Service
  const stocks = await stockService.searchStocks(query);

  // Return response
  res.status(200).json({
    success: true,
    count: stocks.length,
    data: stocks,
  });
});

/**
 * @desc    Get detailed data for a specific stock
 * @route   GET /api/stocks/quote/:symbol
 * @access  Public
 */
export const getStockDetails = asyncHandler(async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  
  // Call Service
  const stockDetails = await stockService.getStockDetails(symbol);

  if (!stockDetails || !stockDetails.symbol) {
    throw new NotFoundError('Stock not found. Please check the symbol.');
  }

  res.status(200).json({
    success: true,
    data: stockDetails,
  });
});

/**
 * @desc    Get historical chart data for a stock
 * @route   GET /api/stocks/chart/:symbol
 * @access  Public
 */
export const getStockChart = asyncHandler(async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const range = req.query.range || '1mo';
  
  const chartData = await stockService.getStockChart(symbol, range);

  if (!chartData || chartData.length === 0) {
    throw new NotFoundError('Failed to fetch chart data. The symbol might be invalid.');
  }

  res.status(200).json({
    success: true,
    data: chartData,
  });
});
