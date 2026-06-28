import YahooFinance from 'yahoo-finance2';
import redisClient from '../config/redis.js';
import { NotFoundError, InternalServerError } from '../utils/appError.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * Helper to fetch data with cache
 */
const fetchWithCache = async (cacheKey, fetchFunction, ttlSeconds = 3600) => {
  try {
    // 1. Check if Redis is connected and data exists in cache
    if (redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`⚡ CACHE HIT for: ${cacheKey}`);
        return JSON.parse(cachedData);
      }
    }
  } catch (error) {
    console.error('Redis GET Error:', error.message);
  }

  // 2. CACHE MISS: Fetch fresh data from the API
  console.log(`🐌 CACHE MISS for: ${cacheKey}. Fetching from API...`);
  try {
    const freshData = await fetchFunction();

    try {
      // 3. Save fresh data to cache for future requests
      if (redisClient.isReady) {
        await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(freshData));
      }
    } catch (error) {
      console.error('Redis SET Error:', error.message);
    }

    return freshData;
  } catch (error) {
    // If Yahoo Finance API fails, provide more helpful error
    console.error('Yahoo Finance API Error:', error.message);
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      throw new NotFoundError('Stock data not found');
    }
    throw new InternalServerError('Failed to fetch stock data from provider');
  }
};

/**
 * Service to search for stocks using Yahoo Finance API
 * @param {string} query - The search string (e.g., 'Apple' or 'AAPL')
 * @returns {Array} - List of formatted basic stock info
 */
export const searchStocks = async (query) => {
  if (!query || query.trim().length < 1) {
    throw new NotFoundError('Search query cannot be empty');
  }

  const cacheKey = `search:${query.toLowerCase().trim()}`;
  
  // Wrap the API call in our caching helper
  return fetchWithCache(cacheKey, async () => {
    const results = await yahooFinance.search(query);
    
    // Clean and format the data before sending it to the controller
    if (!results.quotes || results.quotes.length === 0) {
      return [];
    }
    
    return results.quotes
      .filter(quote => quote.isYahooFinance)
      .map(quote => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchDisp,
        type: quote.quoteType,
        sector: quote.sector || 'N/A',
        industry: quote.industry || 'N/A'
      }));
  }, 3600); // 1 hour TTL for search results
};

/**
 * Service to get detailed information about a specific stock
 * @param {string} symbol - The stock ticker (e.g., 'AAPL')
 * @returns {Object} - Formatted detailed stock metrics
 */
export const getStockDetails = async (symbol) => {
  if (!symbol || symbol.trim().length < 1) {
    throw new NotFoundError('Stock symbol is required');
  }

  const cacheKey = `quote:${symbol.toUpperCase()}`;
  
  // Wrap the API call in our caching helper
  return fetchWithCache(cacheKey, async () => {
    const result = await yahooFinance.quote(symbol);
    
    // Handle case where Yahoo Finance returns no data for the symbol
    if (!result || !result.symbol) {
      throw new NotFoundError('Stock not found. Please check the symbol.');
    }
    
    // Format into a clean, easy-to-consume JSON structure
    return {
      symbol: result.symbol,
      name: result.shortName || result.longName,
      price: result.regularMarketPrice,
      currency: result.currency,
      marketCap: result.marketCap,
      peRatio: result.trailingPE,
      eps: result.epsTrailingTwelveMonths,
      volume: result.regularMarketVolume,
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
    };
  }, 2); // 2 seconds TTL for stock quotes for live feel
};

/**
 * Service to get historical chart data
 * @param {string} symbol - The stock ticker
 * @param {string} range - Timeframe (1d, 5d, 1mo, 6mo, 1y)
 */
export const getStockChart = async (symbol, range = '1mo') => {
  if (!symbol || symbol.trim().length < 1) {
    throw new NotFoundError('Stock symbol is required');
  }

  const validRanges = ['1d', '5d', '1mo', '6mo', '1y'];
  if (!validRanges.includes(range)) {
    throw new NotFoundError('Invalid range. Must be one of: 1d, 5d, 1mo, 6mo, 1y');
  }

  const cacheKey = `chart:${symbol.toUpperCase()}:${range}`;
  
  return fetchWithCache(cacheKey, async () => {
    const period1 = new Date();
    let interval = '1d';
    
    switch (range) {
      case '1d': period1.setDate(period1.getDate() - 1); interval = '5m'; break;
      case '5d': period1.setDate(period1.getDate() - 5); interval = '15m'; break;
      case '1mo': period1.setMonth(period1.getMonth() - 1); interval = '1d'; break;
      case '6mo': period1.setMonth(period1.getMonth() - 6); interval = '1wk'; break;
      case '1y': period1.setFullYear(period1.getFullYear() - 1); interval = '1mo'; break;
      default: period1.setMonth(period1.getMonth() - 1); interval = '1d'; break;
    }
    
    const chartOptions = {
      period1,
      interval,
    };
    
    const result = await yahooFinance.chart(symbol, chartOptions);
    
    if (!result.quotes || result.quotes.length === 0) {
      throw new NotFoundError('No chart data available for this symbol');
    }
    
    return result.quotes.map(q => ({
      date: q.date,
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume
    }));
  }, 10); // 10 seconds TTL
};
