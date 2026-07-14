import redisClient from '../config/redis.js';
import { NotFoundError, InternalServerError } from '../utils/appError.js';
import { collectProviderResults, marketDataProviders, runProviderChain } from './marketData.providers.js';

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

const normalizeSearchText = (value) => String(value || '').trim().toUpperCase();

const rankSearchResult = (stock, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const symbol = normalizeSearchText(stock.symbol);
  const name = normalizeSearchText(stock.name);

  if (symbol === normalizedQuery) return 0;
  if (symbol.replace(/\./g, '') === normalizedQuery.replace(/\./g, '')) return 1;
  if (symbol.startsWith(normalizedQuery)) return 2;
  if (name.includes(normalizedQuery)) return 3;
  return 4;
};

const prioritizeSearchResults = (stocks, query) => (
  stocks
    .map((stock, index) => ({ stock, index }))
    .sort((a, b) => {
      const rankDelta = rankSearchResult(a.stock, query) - rankSearchResult(b.stock, query);
      if (rankDelta !== 0) return rankDelta;

      // When a company-name search produces several venue listings, prefer the
      // canonical Yahoo equity record over a foreign listing or derivative.
      const instrumentRank = stock => {
        const type = normalizeSearchText(stock.type);
        const derivativePenalty = type.includes('ETF') || type.includes('ETP') || type.includes('WARRANT') ? 1 : 0;
        const venuePenalty = normalizeSearchText(stock.symbol).includes('.') ? 1 : 0;
        return derivativePenalty + venuePenalty;
      };
      const exchangeRank = stock => /NASDAQ|NYSE|NYSEARCA|NSE|BSE/.test(normalizeSearchText(stock.exchange)) ? 0 : 1;
      const exchangeDelta = exchangeRank(a.stock) - exchangeRank(b.stock);
      if (exchangeDelta !== 0) return exchangeDelta;

      const instrumentDelta = instrumentRank(a.stock) - instrumentRank(b.stock);
      if (instrumentDelta !== 0) return instrumentDelta;

      const providerRank = stock => stock.provider === 'Yahoo Finance' ? 0 : 1;
      const providerDelta = providerRank(a.stock) - providerRank(b.stock);
      if (providerDelta !== 0) return providerDelta;
      return a.index - b.index;
    })
    .map(({ stock }) => stock)
);

const dedupeSearchResults = (stocks) => {
  const seen = new Set();
  return stocks.filter(stock => {
    if (!stock?.symbol || seen.has(stock.symbol)) return false;
    seen.add(stock.symbol);
    return true;
  });
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

const buildEstimatedChartFromQuote = (quote, range) => (
  buildFallbackChart(
    {
      ...quote,
      price: quote.price || quote.previousClose || 100,
      avgVolume: quote.avgVolume || quote.volume,
      changePercent: quote.changePercent || 0,
    },
    range
  ).map(point => ({
    ...point,
    symbol: quote.symbol,
    provider: 'WalletStack Estimated Chart',
    freshness: 'estimated-from-live-quote',
  }))
);

const hasUsefulValue = (value) => (
  value !== undefined &&
  value !== null &&
  value !== '' &&
  value !== 'N/A' &&
  value !== 'None' &&
  !(typeof value === 'number' && Number.isNaN(value))
);

const mergeQuoteResults = (quotes) => {
  const merged = {};
  const fieldSources = {};
  const providers = [];

  for (const quote of quotes) {
    if (!quote) continue;
    if (quote.provider && !providers.includes(quote.provider)) {
      providers.push(quote.provider);
    }

    for (const [key, value] of Object.entries(quote)) {
      if (!hasUsefulValue(value)) continue;

      const currentValue = merged[key];
      const isRealtimeField = ['price', 'change', 'changePercent', 'open', 'previousClose', 'dayHigh', 'dayLow', 'volume'].includes(key);

      if (!hasUsefulValue(currentValue) || (!isRealtimeField && key !== 'symbol' && key !== 'provider' && key !== 'freshness')) {
        merged[key] = value;
        fieldSources[key] = quote.provider;
      }
    }
  }

  if (providers.length > 0) {
    merged.provider = providers[0];
    merged.providersUsed = providers;
    merged.fieldSources = fieldSources;
    merged.dataCompleteness = calculateDataCompleteness(merged);
  }

  return merged;
};

const calculateDataCompleteness = (quote) => {
  const importantFields = [
    'price',
    'changePercent',
    'marketCap',
    'peRatio',
    'eps',
    'volume',
    'avgVolume',
    'open',
    'previousClose',
    'dayHigh',
    'dayLow',
    'fiftyTwoWeekHigh',
    'fiftyTwoWeekLow',
    'beta',
  ];
  const filled = importantFields.filter(field => hasUsefulValue(quote[field])).length;
  return {
    filled,
    total: importantFields.length,
    percent: Math.round((filled / importantFields.length) * 100),
  };
};

const isUsableQuoteResult = (result) => (
  result?.symbol &&
  (
    hasUsefulValue(result.price) ||
    hasUsefulValue(result.marketCap) ||
    hasUsefulValue(result.peRatio) ||
    hasUsefulValue(result.eps) ||
    hasUsefulValue(result.beta) ||
    hasUsefulValue(result.fiftyTwoWeekHigh) ||
    hasUsefulValue(result.fiftyTwoWeekLow)
  )
);

const hasCoreFundamentals = (quote) => (
  hasUsefulValue(quote?.marketCap) &&
  hasUsefulValue(quote?.peRatio) &&
  hasUsefulValue(quote?.eps)
);

const quoteScore = (quote) => {
  if (!quote?.symbol || !hasUsefulValue(quote.price)) return -1;
  const completeness = quote.dataCompleteness?.filled || 0;
  const fundamentalsBonus = hasCoreFundamentals(quote) ? 10 : 0;
  return completeness + fundamentalsBonus;
};

const fetchMergedQuote = async (symbol) => {
  const { results } = await collectProviderResults('quote', [symbol], isUsableQuoteResult);
  return mergeQuoteResults(results);
};

const getLikelySymbolCandidates = async (symbol) => {
  const normalizedSymbol = normalizeSearchText(symbol);
  const directCandidates = normalizedSymbol.includes('.')
    ? []
    : [
        `${normalizedSymbol}.NS`,
        `${normalizedSymbol}.BO`,
        `${normalizedSymbol}.L`,
        `${normalizedSymbol}.TO`,
        `${normalizedSymbol}.AX`,
        `${normalizedSymbol}.T`,
        `${normalizedSymbol}.HK`,
      ];

  try {
    // Yahoo has the widest symbol directory in the current provider set. Query it
    // first so company names such as "NVIDIA" resolve to the tradable ticker NVDA.
    const yahooResults = await marketDataProviders.yahoo.search(symbol);
    const yahooCandidates = prioritizeSearchResults(
      dedupeSearchResults(yahooResults),
      symbol,
    )
      .filter(stock => normalizeSearchText(stock.type) === 'EQUITY')
      .map(stock => stock.symbol)
      .filter(candidate => normalizeSearchText(candidate) !== normalizedSymbol);

    if (yahooCandidates.length > 0) {
      return [...new Set([...yahooCandidates, ...directCandidates])].slice(0, 8);
    }
  } catch (error) {
    if (process.env.DEBUG_MARKET_DATA === 'true') {
      console.warn(`Yahoo symbol resolution failed for "${symbol}":`, error.message);
    }
  }

  try {
    const { results } = await collectProviderResults(
      'search',
      [symbol],
      result => Array.isArray(result) && result.length > 0
    );
    const searchedCandidates = prioritizeSearchResults(dedupeSearchResults(results.flat()), symbol)
      .map(stock => stock.symbol)
      .filter(candidate => normalizeSearchText(candidate) !== normalizedSymbol);

    return [...new Set([...searchedCandidates, ...directCandidates])].slice(0, 8);
  } catch (error) {
    if (process.env.DEBUG_MARKET_DATA === 'true') {
      console.warn(`Symbol candidate search failed for "${symbol}":`, error.message);
    }
    return directCandidates;
  }
};

const findBestQuote = async (symbol) => {
  const primaryQuote = await fetchMergedQuote(symbol);
  let bestQuote = primaryQuote;

  if (quoteScore(primaryQuote) >= 20) {
    return bestQuote;
  }

  const candidates = await getLikelySymbolCandidates(symbol);

  for (const candidate of candidates) {
    try {
      const candidateQuote = await fetchMergedQuote(candidate);
      if (quoteScore(candidateQuote) > quoteScore(bestQuote)) {
        bestQuote = candidateQuote;
      }

      if (quoteScore(bestQuote) >= 20) {
        break;
      }
    } catch (error) {
      console.warn(`Quote candidate "${candidate}" failed for "${symbol}":`, error.message);
    }
  }

  return bestQuote;
};

const fetchChartData = async (symbol, range) => (
  runProviderChain(
    'chart',
    [symbol, range],
    result => Array.isArray(result) && result.length > 0
  )
);

const findBestChart = async (symbol, range) => {
  try {
    return await fetchChartData(symbol, range);
  } catch (primaryError) {
    const candidates = await getLikelySymbolCandidates(symbol);

    for (const candidate of candidates) {
      try {
        const chart = await fetchChartData(candidate, range);
        if (chart.length > 0) {
          return chart.map(point => ({ ...point, resolvedSymbol: candidate }));
        }
      } catch (error) {
        console.warn(`Chart candidate "${candidate}" failed for "${symbol}":`, error.message);
      }
    }

    const quote = await findBestQuote(symbol);
    if (quote?.symbol && quote?.price != null) {
      console.warn(`Using estimated chart for "${symbol}" from live quote after provider chart failures:`, primaryError.message);
      return buildEstimatedChartFromQuote(quote, range);
    }

    throw primaryError;
  }
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
        if (process.env.DEBUG_MARKET_DATA === 'true') console.log(`CACHE HIT for: ${cacheKey}`);
        return JSON.parse(cachedData);
      }
    }
  } catch (error) {
    console.error('Redis GET Error:', error.message);
  }

  // 2. CACHE MISS: Fetch fresh data from the API
  if (process.env.DEBUG_MARKET_DATA === 'true') console.log(`CACHE MISS for: ${cacheKey}. Fetching from API...`);
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
    console.error('Market Data Provider Error:', error.message);
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

  const cacheKey = `search:v3:${query.toLowerCase().trim()}`;
  
  // Wrap the API call in our caching helper
  return fetchWithCache(cacheKey, async () => {
    try {
      const { results } = await collectProviderResults('search', [query], result => Array.isArray(result) && result.length > 0);
      const providerResults = results.flat();

      if (providerResults.length === 0) {
        throw new NotFoundError('No provider returned search results');
      }

      const fallbackResults = searchFallbackStocks(query);
      const uniqueProviderResults = dedupeSearchResults(providerResults);
      const seen = new Set(uniqueProviderResults.map(stock => stock.symbol));
      return prioritizeSearchResults([
        ...uniqueProviderResults,
        ...fallbackResults.filter(stock => !seen.has(stock.symbol)),
      ], query);
    } catch (error) {
      console.warn(`Using fallback search results for "${query}":`, error.message);
      return searchFallbackStocks(query);
    }
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
    try {
      const mergedQuote = await findBestQuote(symbol);

      if (mergedQuote?.symbol && mergedQuote?.price != null) {
        return {
          ...mergedQuote,
          lastUpdated: new Date().toISOString(),
        };
      }

      throw new NotFoundError('No provider returned complete quote data');
    } catch (error) {
      const fallbackQuote = getFallbackQuote(symbol);
      if (fallbackQuote) {
        console.warn(`Using fallback quote for "${symbol}":`, error.message);
        return {
          ...fallbackQuote,
          provider: 'WalletStack Offline Demo',
          freshness: 'fallback',
          lastUpdated: new Date().toISOString(),
        };
      }
      throw error;
    }
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
    try {
      return await findBestChart(symbol, range);
    } catch (error) {
      const fallbackQuote = getFallbackQuote(symbol);
      if (fallbackQuote) {
        console.warn(`Using fallback chart for "${symbol}":`, error.message);
        return buildFallbackChart(fallbackQuote, range).map(point => ({
          ...point,
          provider: 'WalletStack Offline Demo',
        }));
      }
      throw error;
    }
  }, 10); // 10 seconds TTL
};
