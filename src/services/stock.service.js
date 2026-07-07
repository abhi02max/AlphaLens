import YahooFinance from 'yahoo-finance2';
import redisClient from '../config/redis.js';
import { NotFoundError, InternalServerError } from '../utils/appError.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const fallbackStocks = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'Nasdaq',
    type: 'EQUITY',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    currency: 'USD',
    price: 213.55,
    marketCap: 3270000000000,
    peRatio: 33.8,
    eps: 6.31,
    volume: 52100000,
    avgVolume: 58700000,
    change: 1.36,
    changePercent: 0.64,
    open: 211.92,
    previousClose: 212.19,
    dayHigh: 214.2,
    dayLow: 210.74,
    fiftyTwoWeekHigh: 237.49,
    fiftyTwoWeekLow: 164.08,
    dividendYield: 0.0047,
    beta: 1.2,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'Nasdaq',
    type: 'EQUITY',
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    currency: 'USD',
    price: 447.7,
    marketCap: 3330000000000,
    peRatio: 36.1,
    eps: 12.4,
    volume: 18600000,
    avgVolume: 22100000,
    change: 2.72,
    changePercent: 0.61,
    open: 444.22,
    previousClose: 444.98,
    dayHigh: 449.1,
    dayLow: 442.4,
    fiftyTwoWeekHigh: 468.35,
    fiftyTwoWeekLow: 309.45,
    dividendYield: 0.0072,
    beta: 0.9,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    exchange: 'Nasdaq',
    type: 'EQUITY',
    sector: 'Communication Services',
    industry: 'Internet Content and Information',
    currency: 'USD',
    price: 182.14,
    marketCap: 2250000000000,
    peRatio: 27.9,
    eps: 6.52,
    volume: 24300000,
    avgVolume: 28100000,
    change: -0.74,
    changePercent: -0.4,
    open: 183.12,
    previousClose: 182.88,
    dayHigh: 184.05,
    dayLow: 180.94,
    fiftyTwoWeekHigh: 191.75,
    fiftyTwoWeekLow: 120.21,
    dividendYield: 0.0044,
    beta: 1.05,
  },
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Limited',
    exchange: 'NSE',
    type: 'EQUITY',
    sector: 'Energy',
    industry: 'Oil and Gas Integrated',
    currency: 'INR',
    price: 2934.2,
    marketCap: 19860000000000,
    peRatio: 28.3,
    eps: 103.7,
    volume: 5450000,
    avgVolume: 7600000,
    change: 32.5,
    changePercent: 1.12,
    open: 2910.0,
    previousClose: 2901.7,
    dayHigh: 2948.0,
    dayLow: 2896.4,
    fiftyTwoWeekHigh: 3217.9,
    fiftyTwoWeekLow: 2220.3,
    dividendYield: 0.0031,
    beta: 0.82,
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services Limited',
    exchange: 'NSE',
    type: 'EQUITY',
    sector: 'Technology',
    industry: 'Information Technology Services',
    currency: 'INR',
    price: 3912.7,
    marketCap: 14160000000000,
    peRatio: 30.4,
    eps: 128.7,
    volume: 1820000,
    avgVolume: 2400000,
    change: -10.95,
    changePercent: -0.28,
    open: 3928.1,
    previousClose: 3923.65,
    dayHigh: 3946.2,
    dayLow: 3894.5,
    fiftyTwoWeekHigh: 4592.25,
    fiftyTwoWeekLow: 3311.0,
    dividendYield: 0.012,
    beta: 0.62,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'Nasdaq',
    type: 'EQUITY',
    sector: 'Technology',
    industry: 'Semiconductors',
    currency: 'USD',
    price: 126.09,
    marketCap: 3100000000000,
    peRatio: 71.2,
    eps: 1.77,
    volume: 214000000,
    avgVolume: 279000000,
    change: 2.84,
    changePercent: 2.31,
    open: 124.12,
    previousClose: 123.25,
    dayHigh: 127.8,
    dayLow: 122.94,
    fiftyTwoWeekHigh: 140.76,
    fiftyTwoWeekLow: 39.23,
    dividendYield: 0.0003,
    beta: 1.68,
  },
];

const getFallbackQuote = (symbol) => (
  fallbackStocks.find(stock => stock.symbol.toUpperCase() === symbol.toUpperCase())
);

const searchFallbackStocks = (query) => {
  const q = query.toLowerCase().trim();
  return fallbackStocks
    .filter(stock =>
      stock.symbol.toLowerCase().includes(q) ||
      stock.name.toLowerCase().includes(q) ||
      stock.sector.toLowerCase().includes(q)
    )
    .map(({ symbol, name, exchange, type, sector, industry }) => ({
      symbol,
      name,
      exchange,
      type,
      sector,
      industry,
    }));
};

const buildFallbackChart = (stock, range) => {
  const pointsByRange = {
    '1d': 48,
    '5d': 60,
    '1mo': 30,
    '6mo': 26,
    '1y': 12,
  };
  const stepMsByRange = {
    '1d': 30 * 60 * 1000,
    '5d': 2 * 60 * 60 * 1000,
    '1mo': 24 * 60 * 60 * 1000,
    '6mo': 7 * 24 * 60 * 60 * 1000,
    '1y': 30 * 24 * 60 * 60 * 1000,
  };
  const points = pointsByRange[range] || 30;
  const stepMs = stepMsByRange[range] || stepMsByRange['1mo'];
  const base = stock.price || 100;

  return Array.from({ length: points }, (_, index) => {
    const progress = index / Math.max(points - 1, 1);
    const wave = Math.sin(progress * Math.PI * 3) * 0.025;
    const drift = (stock.changePercent || 0) / 100 * progress;
    const close = base * (1 - drift * 0.8 + wave + drift);
    const open = close * (1 - 0.004 + Math.sin(index) * 0.003);
    const high = Math.max(open, close) * 1.008;
    const low = Math.min(open, close) * 0.992;

    return {
      date: new Date(Date.now() - (points - index - 1) * stepMs),
      open,
      high,
      low,
      close,
      volume: Math.round((stock.avgVolume || stock.volume || 1000000) * (0.65 + progress * 0.7)),
    };
  });
};

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
    const fallbackResults = searchFallbackStocks(query);
    let results;

    try {
      results = await yahooFinance.search(query);
    } catch (error) {
      console.warn(`Using fallback search results for "${query}":`, error.message);
      return fallbackResults;
    }
    
    // Clean and format the data before sending it to the controller
    if (!results.quotes || results.quotes.length === 0) {
      return fallbackResults;
    }
    
    const providerResults = results.quotes
      .filter(quote => quote.symbol && (quote.quoteType || quote.shortname || quote.longname))
      .map(quote => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchDisp,
        type: quote.quoteType,
        sector: quote.sector || 'N/A',
        industry: quote.industry || 'N/A'
      }));

    const seen = new Set(providerResults.map(stock => stock.symbol));
    return [
      ...providerResults,
      ...fallbackResults.filter(stock => !seen.has(stock.symbol)),
    ];
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
    let result;

    try {
      result = await yahooFinance.quote(symbol);
    } catch (error) {
      const fallbackQuote = getFallbackQuote(symbol);
      if (fallbackQuote) {
        console.warn(`Using fallback quote for "${symbol}":`, error.message);
        return fallbackQuote;
      }
      throw error;
    }
    
    // Handle case where Yahoo Finance returns no data for the symbol
    if (!result || !result.symbol) {
      const fallbackQuote = getFallbackQuote(symbol);
      if (fallbackQuote) return fallbackQuote;
      throw new NotFoundError('Stock not found. Please check the symbol.');
    }
    
    // Format into a clean, easy-to-consume JSON structure
    return {
      symbol: result.symbol,
      name: result.shortName || result.longName,
      exchange: result.fullExchangeName || result.exchange,
      quoteType: result.quoteType,
      price: result.regularMarketPrice,
      currency: result.currency,
      marketCap: result.marketCap,
      peRatio: result.trailingPE,
      eps: result.epsTrailingTwelveMonths,
      volume: result.regularMarketVolume,
      avgVolume: result.averageDailyVolume3Month,
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent,
      open: result.regularMarketOpen,
      previousClose: result.regularMarketPreviousClose,
      dayHigh: result.regularMarketDayHigh,
      dayLow: result.regularMarketDayLow,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
      dividendYield: result.trailingAnnualDividendYield,
      beta: result.beta,
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
    
    let result;

    try {
      result = await yahooFinance.chart(symbol, chartOptions);
    } catch (error) {
      const fallbackQuote = getFallbackQuote(symbol);
      if (fallbackQuote) {
        console.warn(`Using fallback chart for "${symbol}":`, error.message);
        return buildFallbackChart(fallbackQuote, range);
      }
      throw error;
    }
    
    if (!result.quotes || result.quotes.length === 0) {
      const fallbackQuote = getFallbackQuote(symbol);
      if (fallbackQuote) return buildFallbackChart(fallbackQuote, range);
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
