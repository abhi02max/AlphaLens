import { generateStockInsight } from '../services/ai.service.js';
import { getStockDetails } from '../services/stock.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * @desc    Generate AI Insight for a specific stock
 * @route   GET /api/ai/insight/:symbol
 * @access  Public (for now)
 */
export const getStockInsight = asyncHandler(async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const mode = req.query.mode || 'beginner'; // allows /insight/AAPL?mode=pro

  // 1. Fetch live data from our existing Stock Service
  const stockData = await getStockDetails(symbol);

  // 2. Pass that live data into the AI Service
  const aiInsight = await generateStockInsight(stockData, mode);

  // 3. Return the combined result
  res.status(200).json({
    success: true,
    symbol: symbol,
    mode: mode,
    data: {
      metrics: stockData, // We send the raw metrics so the frontend can draw charts
      insight: aiInsight  // We send the AI json so the frontend can populate the cards
    }
  });
});
