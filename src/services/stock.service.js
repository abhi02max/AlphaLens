import YahooFinance from 'yahoo-finance2';
import redisClient from '../config/redis.js';

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
};

/**
 * Service to search for stocks using Yahoo Finance API
 * @param {string} query - The search string (e.g., 'Apple' or 'AAPL')
 * @returns {Array} - List of formatted basic stock info
 */
export const searchStocks = async (query) => {
  const cacheKey = `search:${query.toLowerCase()}`;
  
  // Wrap the API call in our caching helper
  return fetchWithCache(cacheKey, async () => {
    const results = await yahooFinance.search(query);
    
    // Clean and format the data before sending it to the controller
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
  const cacheKey = `quote:${symbol.toUpperCase()}`;
  
  // Wrap the API call in our caching helper
  return fetchWithCache(cacheKey, async () => {
    const result = await yahooFinance.quote(symbol);
    
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
  }, 300); // 5 minutes TTL for stock quotes (prices change fast)
};
