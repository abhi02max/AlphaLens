import { generateProfessionalStockReport, generateStockInsight, generateTradeSimulationAnalysis } from '../services/ai.service.js';
import { getStockChart, getStockDetails } from '../services/stock.service.js';
import { getMarketNews } from '../services/marketData.providers.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { BadRequestError } from '../utils/appError.js';

/**
 * @desc    Generate AI Insight for a specific stock
 * @route   GET /api/ai/insight/:symbol
 * @access  Public (for now)
 */
export const getStockInsight = asyncHandler(async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const mode = 'pro';

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

export const analyzeTradeSimulation = asyncHandler(async (req, res) => {
  const { symbol, side = 'buy', quantity, orderValue } = req.body || {};

  if (!symbol) {
    throw new BadRequestError('Stock symbol is required for simulation analysis.');
  }

  const normalizedQuantity = Number(quantity);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
    throw new BadRequestError('A valid quantity is required for simulation analysis.');
  }

  const stockData = await getStockDetails(symbol.toUpperCase());
  const simulation = {
    side,
    quantity: normalizedQuantity,
    orderValue: Number(orderValue || normalizedQuantity * stockData.price),
    estimatedPrice: stockData.price,
    currency: stockData.currency,
  };
  const analysis = await generateTradeSimulationAnalysis(stockData, simulation);

  res.status(200).json({
    success: true,
    symbol: stockData.symbol,
    data: {
      metrics: stockData,
      simulation,
      analysis,
    },
  });
});

export const getProfessionalStockReport = asyncHandler(async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const stockData = await getStockDetails(symbol);

  const [chartResult, newsResult] = await Promise.allSettled([
    getStockChart(stockData.symbol || symbol, '6mo'),
    getMarketNews(stockData.symbol || symbol, stockData.name, stockData.sector),
  ]);

  const chartData = chartResult.status === 'fulfilled' ? chartResult.value : [];
  const news = newsResult.status === 'fulfilled' ? newsResult.value : [];
  const report = await generateProfessionalStockReport({ stockData, chartData, news });

  res.status(200).json({
    success: true,
    symbol: stockData.symbol || symbol,
    data: {
      metrics: stockData,
      chartSummary: {
        points: chartData.length,
        range: '6mo',
        provider: chartData.at(-1)?.provider,
      },
      news,
      report,
    },
  });
});
