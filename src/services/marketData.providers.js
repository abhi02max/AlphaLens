import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: { logErrors: false },
});

const toNumber = (value) => {
  const rawValue = value && typeof value === 'object' && 'raw' in value ? value.raw : value;
  const number = Number(rawValue);
  return Number.isFinite(number) ? number : undefined;
};

const compactName = (value, fallback) => value || fallback || 'Unknown';

const redactSecrets = (message) => String(message || '')
  .replace(/[A-Z0-9]{12,}/g, '[redacted]')
  .replace(/apikey=[^&\s]+/gi, 'apikey=[redacted]')
  .replace(/token=[^&\s]+/gi, 'token=[redacted]');

const requestJson = async (url, providerName) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${providerName} request failed: ${response.status}`);
  }

  if (data?.status === 'error' || data?.['Error Message'] || data?.Note || data?.Information) {
    throw new Error(redactSecrets(data.message || data['Error Message'] || data.Note || data.Information));
  }

  return data;
};

const rangeToTwelveInterval = (range) => {
  if (range === '1d') return { interval: '5min', outputsize: 96 };
  if (range === '5d') return { interval: '15min', outputsize: 160 };
  if (range === '6mo') return { interval: '1week', outputsize: 28 };
  if (range === '1y') return { interval: '1month', outputsize: 13 };
  return { interval: '1day', outputsize: 35 };
};

const rangeToFinnhubResolution = (range) => {
  if (range === '1d') return { resolution: '5', days: 1 };
  if (range === '5d') return { resolution: '15', days: 5 };
  if (range === '6mo') return { resolution: 'W', days: 190 };
  if (range === '1y') return { resolution: 'M', days: 380 };
  return { resolution: 'D', days: 40 };
};

const yahooChartOptions = (range) => {
  const period1 = new Date();

  switch (range) {
    case '1d': period1.setDate(period1.getDate() - 1); return { period1, interval: '5m' };
    case '5d': period1.setDate(period1.getDate() - 5); return { period1, interval: '15m' };
    case '6mo': period1.setMonth(period1.getMonth() - 6); return { period1, interval: '1wk' };
    case '1y': period1.setFullYear(period1.getFullYear() - 1); return { period1, interval: '1mo' };
    case '1mo':
    default: period1.setMonth(period1.getMonth() - 1); return { period1, interval: '1d' };
  }
};

const yahooDailyChartOptions = (range) => {
  const period1 = new Date();

  switch (range) {
    case '1d':
    case '5d': period1.setDate(period1.getDate() - 10); break;
    case '6mo': period1.setMonth(period1.getMonth() - 6); break;
    case '1y': period1.setFullYear(period1.getFullYear() - 1); break;
    case '1mo':
    default: period1.setMonth(period1.getMonth() - 1); break;
  }

  return { period1, interval: '1d' };
};

const formatChartResult = (result, providerName) => (
  (result.quotes || [])
    .filter(q => q.date && q.close != null)
    .map(q => ({
      date: q.date,
      open: toNumber(q.open) ?? toNumber(q.close),
      high: toNumber(q.high) ?? toNumber(q.close),
      low: toNumber(q.low) ?? toNumber(q.close),
      close: toNumber(q.close),
      volume: toNumber(q.volume),
      provider: providerName,
    }))
);

export const marketDataProviders = {
  twelveData: {
    name: 'Twelve Data',
    enabled: () => Boolean(process.env.TWELVE_DATA_API_KEY),
    async search(query) {
      const url = new URL('https://api.twelvedata.com/symbol_search');
      url.searchParams.set('symbol', query);
      url.searchParams.set('apikey', process.env.TWELVE_DATA_API_KEY);
      const data = await requestJson(url, this.name);
      return (data.data || []).map(item => ({
        symbol: item.symbol,
        name: compactName(item.instrument_name, item.symbol),
        exchange: item.exchange,
        type: item.instrument_type || item.type || 'EQUITY',
        sector: 'N/A',
        industry: 'N/A',
        provider: this.name,
      }));
    },
    async quote(symbol) {
      const url = new URL('https://api.twelvedata.com/quote');
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('apikey', process.env.TWELVE_DATA_API_KEY);
      const data = await requestJson(url, this.name);
      return {
        symbol: data.symbol || symbol,
        name: compactName(data.name, symbol),
        exchange: data.exchange,
        quoteType: data.type,
        price: toNumber(data.close),
        currency: data.currency,
        change: toNumber(data.change),
        changePercent: toNumber(data.percent_change),
        open: toNumber(data.open),
        previousClose: toNumber(data.previous_close),
        dayHigh: toNumber(data.high),
        dayLow: toNumber(data.low),
        volume: toNumber(data.volume),
        fiftyTwoWeekHigh: toNumber(data.fifty_two_week?.high),
        fiftyTwoWeekLow: toNumber(data.fifty_two_week?.low),
        provider: this.name,
        freshness: data.is_market_open ? 'live' : 'last-close',
      };
    },
    async chart(symbol, range) {
      const { interval, outputsize } = rangeToTwelveInterval(range);
      const url = new URL('https://api.twelvedata.com/time_series');
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('interval', interval);
      url.searchParams.set('outputsize', String(outputsize));
      url.searchParams.set('apikey', process.env.TWELVE_DATA_API_KEY);
      const data = await requestJson(url, this.name);
      return (data.values || []).reverse().map(item => ({
        date: item.datetime,
        open: toNumber(item.open),
        high: toNumber(item.high),
        low: toNumber(item.low),
        close: toNumber(item.close),
        volume: toNumber(item.volume),
        provider: this.name,
      }));
    },
  },

  alphaVantage: {
    name: 'Alpha Vantage',
    enabled: () => Boolean(process.env.ALPHA_VANTAGE_API_KEY),
    async search(query) {
      const url = new URL('https://www.alphavantage.co/query');
      url.searchParams.set('function', 'SYMBOL_SEARCH');
      url.searchParams.set('keywords', query);
      url.searchParams.set('apikey', process.env.ALPHA_VANTAGE_API_KEY);
      const data = await requestJson(url, this.name);
      return (data.bestMatches || []).map(item => ({
        symbol: item['1. symbol'],
        name: compactName(item['2. name'], item['1. symbol']),
        exchange: item['4. region'],
        type: item['3. type'],
        sector: 'N/A',
        industry: 'N/A',
        provider: this.name,
      }));
    },
    async quote(symbol) {
      const [quoteData, overviewData] = await Promise.allSettled([
        requestJson(new URL(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`), this.name),
        requestJson(new URL(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`), this.name),
      ]);
      const quote = quoteData.value?.['Global Quote'] || {};
      const overview = overviewData.value || {};

      if (!quote['01. symbol'] && !overview.Symbol) return null;

      return {
        symbol: quote['01. symbol'] || overview.Symbol || symbol,
        name: compactName(overview.Name, symbol),
        exchange: overview.Exchange,
        quoteType: overview.AssetType,
        price: toNumber(quote['05. price']),
        currency: overview.Currency,
        marketCap: toNumber(overview.MarketCapitalization),
        peRatio: toNumber(overview.PERatio),
        eps: toNumber(overview.EPS),
        volume: toNumber(quote['06. volume']),
        change: toNumber(quote['09. change']),
        changePercent: toNumber(String(quote['10. change percent'] || '').replace('%', '')),
        open: toNumber(quote['02. open']),
        previousClose: toNumber(quote['08. previous close']),
        dayHigh: toNumber(quote['03. high']),
        dayLow: toNumber(quote['04. low']),
        fiftyTwoWeekHigh: toNumber(overview['52WeekHigh']),
        fiftyTwoWeekLow: toNumber(overview['52WeekLow']),
        dividendYield: toNumber(overview.DividendYield),
        beta: toNumber(overview.Beta),
        sector: overview.Sector,
        industry: overview.Industry,
        provider: this.name,
        freshness: 'latest-quote',
      };
    },
  },

  finnhub: {
    name: 'Finnhub',
    enabled: () => Boolean(process.env.FINNHUB_API_KEY),
    async search(query) {
      const url = new URL('https://finnhub.io/api/v1/search');
      url.searchParams.set('q', query);
      url.searchParams.set('token', process.env.FINNHUB_API_KEY);
      const data = await requestJson(url, this.name);
      return (data.result || []).map(item => ({
        symbol: item.symbol,
        name: compactName(item.description, item.symbol),
        exchange: item.displaySymbol,
        type: item.type || 'EQUITY',
        sector: 'N/A',
        industry: 'N/A',
        provider: this.name,
      }));
    },
    async quote(symbol) {
      const [quoteData, profileData, metricData] = await Promise.allSettled([
        requestJson(new URL(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`), this.name),
        requestJson(new URL(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_API_KEY}`), this.name),
        requestJson(new URL(`https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${process.env.FINNHUB_API_KEY}`), this.name),
      ]);
      const quote = quoteData.value || {};
      const profile = profileData.value || {};
      const metric = metricData.value?.metric || {};

      if (!quote.c && !profile.ticker) return null;

      return {
        symbol: profile.ticker || symbol,
        name: compactName(profile.name, symbol),
        exchange: profile.exchange,
        quoteType: 'EQUITY',
        price: toNumber(quote.c),
        currency: profile.currency,
        marketCap: toNumber(profile.marketCapitalization) ? toNumber(profile.marketCapitalization) * 1000000 : undefined,
        peRatio: toNumber(metric.peNormalizedAnnual),
        eps: toNumber(metric.epsBasicExclExtraItemsTTM),
        volume: undefined,
        change: toNumber(quote.d),
        changePercent: toNumber(quote.dp),
        open: toNumber(quote.o),
        previousClose: toNumber(quote.pc),
        dayHigh: toNumber(quote.h),
        dayLow: toNumber(quote.l),
        fiftyTwoWeekHigh: toNumber(metric['52WeekHigh']),
        fiftyTwoWeekLow: toNumber(metric['52WeekLow']),
        beta: toNumber(metric.beta),
        provider: this.name,
        freshness: 'latest-quote',
      };
    },
    async chart(symbol, range) {
      const { resolution, days } = rangeToFinnhubResolution(range);
      const to = Math.floor(Date.now() / 1000);
      const from = to - days * 24 * 60 * 60;
      const url = new URL('https://finnhub.io/api/v1/stock/candle');
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('resolution', resolution);
      url.searchParams.set('from', String(from));
      url.searchParams.set('to', String(to));
      url.searchParams.set('token', process.env.FINNHUB_API_KEY);
      const data = await requestJson(url, this.name);
      if (data.s !== 'ok') return [];
      return data.t.map((timestamp, index) => ({
        date: new Date(timestamp * 1000),
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: data.c[index],
        volume: data.v[index],
        provider: this.name,
      }));
    },
    async news(symbol) {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 14);
      const url = new URL('https://finnhub.io/api/v1/company-news');
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('from', from.toISOString().slice(0, 10));
      url.searchParams.set('to', to.toISOString().slice(0, 10));
      url.searchParams.set('token', process.env.FINNHUB_API_KEY);
      const data = await requestJson(url, this.name);
      return (data || []).map(item => ({
        title: item.headline,
        publisher: item.source || this.name,
        link: item.url,
        publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : undefined,
        type: 'company',
        relatedTickers: [symbol],
        scope: 'company',
        provider: this.name,
      }));
    },
  },

  fmp: {
    name: 'Financial Modeling Prep',
    enabled: () => Boolean(process.env.FMP_API_KEY),
    async search(query) {
      const url = new URL('https://financialmodelingprep.com/api/v3/search');
      url.searchParams.set('query', query);
      url.searchParams.set('limit', '20');
      url.searchParams.set('apikey', process.env.FMP_API_KEY);
      const data = await requestJson(url, this.name);
      return (data || []).map(item => ({
        symbol: item.symbol,
        name: compactName(item.name, item.symbol),
        exchange: item.exchangeShortName || item.exchange,
        type: 'EQUITY',
        sector: 'N/A',
        industry: 'N/A',
        provider: this.name,
      }));
    },
    async quote(symbol) {
      const data = await requestJson(new URL(`https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbol)}?apikey=${process.env.FMP_API_KEY}`), this.name);
      const quote = data?.[0];
      if (!quote) return null;
      return {
        symbol: quote.symbol,
        name: compactName(quote.name, symbol),
        exchange: quote.exchange,
        quoteType: 'EQUITY',
        price: toNumber(quote.price),
        currency: undefined,
        marketCap: toNumber(quote.marketCap),
        peRatio: toNumber(quote.pe),
        eps: toNumber(quote.eps),
        volume: toNumber(quote.volume),
        avgVolume: toNumber(quote.avgVolume),
        change: toNumber(quote.change),
        changePercent: toNumber(quote.changesPercentage),
        open: toNumber(quote.open),
        previousClose: toNumber(quote.previousClose),
        dayHigh: toNumber(quote.dayHigh),
        dayLow: toNumber(quote.dayLow),
        fiftyTwoWeekHigh: toNumber(quote.yearHigh),
        fiftyTwoWeekLow: toNumber(quote.yearLow),
        provider: this.name,
        freshness: 'latest-quote',
      };
    },
  },

  yahoo: {
    name: 'Yahoo Finance',
    enabled: () => true,
    async search(query) {
      const results = await yahooFinance.search(
        query,
        { quotesCount: 25, newsCount: 0 },
        { validateResult: false }
      );
      return (results.quotes || [])
        .filter(quote => quote.symbol && (quote.quoteType || quote.shortname || quote.longname))
        .map(quote => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          exchange: quote.exchDisp,
          type: quote.quoteType,
          sector: quote.sector || 'N/A',
          industry: quote.industry || 'N/A',
          provider: this.name,
        }));
    },
    async quote(symbol) {
      const [quoteResult, summaryResult] = await Promise.allSettled([
        yahooFinance.quote(symbol, {}, { validateResult: false }),
        yahooFinance.quoteSummary(
          symbol,
          {
            formatted: false,
            modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile', 'quoteType'],
          },
          { validateResult: false }
        ),
      ]);
      const result = quoteResult.value || {};
      const summary = summaryResult.value || {};
      const price = summary.price || {};
      const summaryDetail = summary.summaryDetail || {};
      const keyStats = summary.defaultKeyStatistics || {};
      const financialData = summary.financialData || {};
      const profile = summary.assetProfile || {};
      const quoteType = summary.quoteType || {};

      if (!result?.symbol && !price?.symbol && !quoteType?.symbol) return null;
      return {
        symbol: result.symbol || price.symbol || quoteType.symbol || symbol,
        name: result.shortName || result.longName || price.shortName || price.longName || quoteType.longName,
        exchange: result.fullExchangeName || result.exchange || price.exchangeName || price.exchange,
        quoteType: result.quoteType || quoteType.quoteType,
        price: toNumber(result.regularMarketPrice) ?? toNumber(price.regularMarketPrice),
        currency: result.currency || price.currency || financialData.financialCurrency,
        marketCap: toNumber(result.marketCap) ?? toNumber(price.marketCap) ?? toNumber(summaryDetail.marketCap),
        peRatio: toNumber(result.trailingPE) ?? toNumber(summaryDetail.trailingPE) ?? toNumber(keyStats.trailingPE) ?? toNumber(financialData.forwardPE) ?? toNumber(keyStats.forwardPE),
        eps: toNumber(result.epsTrailingTwelveMonths) ?? toNumber(keyStats.trailingEps) ?? toNumber(financialData.trailingEps),
        volume: toNumber(result.regularMarketVolume) ?? toNumber(price.regularMarketVolume) ?? toNumber(summaryDetail.volume),
        avgVolume: toNumber(result.averageDailyVolume3Month) ?? toNumber(summaryDetail.averageVolume) ?? toNumber(summaryDetail.averageVolume10days),
        change: toNumber(result.regularMarketChange) ?? toNumber(price.regularMarketChange),
        changePercent: toNumber(result.regularMarketChangePercent) ?? toNumber(price.regularMarketChangePercent),
        open: toNumber(result.regularMarketOpen) ?? toNumber(summaryDetail.open),
        previousClose: toNumber(result.regularMarketPreviousClose) ?? toNumber(summaryDetail.previousClose),
        dayHigh: toNumber(result.regularMarketDayHigh) ?? toNumber(summaryDetail.dayHigh),
        dayLow: toNumber(result.regularMarketDayLow) ?? toNumber(summaryDetail.dayLow),
        fiftyTwoWeekHigh: toNumber(result.fiftyTwoWeekHigh) ?? toNumber(summaryDetail.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: toNumber(result.fiftyTwoWeekLow) ?? toNumber(summaryDetail.fiftyTwoWeekLow),
        dividendYield: toNumber(result.trailingAnnualDividendYield) ?? toNumber(summaryDetail.dividendYield),
        beta: toNumber(result.beta) ?? toNumber(summaryDetail.beta) ?? toNumber(keyStats.beta),
        sector: profile.sector,
        industry: profile.industry,
        provider: this.name,
        freshness: 'latest-quote',
      };
    },
    async chart(symbol, range) {
      const primary = await yahooFinance.chart(symbol, yahooChartOptions(range), { validateResult: false });
      const primaryRows = formatChartResult(primary, this.name);
      if (primaryRows.length > 0) return primaryRows;

      const daily = await yahooFinance.chart(symbol, yahooDailyChartOptions(range), { validateResult: false });
      return formatChartResult(daily, this.name);
    },
  },
};

export const providerOrder = [
  marketDataProviders.twelveData,
  marketDataProviders.alphaVantage,
  marketDataProviders.finnhub,
  marketDataProviders.fmp,
  marketDataProviders.yahoo,
];

export const runProviderChain = async (method, args, validate = value => Boolean(value)) => {
  const errors = [];

  for (const provider of providerOrder) {
    if (!provider.enabled() || typeof provider[method] !== 'function') continue;

    try {
      const result = await provider[method](...args);
      if (validate(result)) return result;
    } catch (error) {
      errors.push(`${provider.name}: ${error.message}`);
      console.warn(`${provider.name} ${method} failed:`, error.message);
    }
  }

  const error = new Error(`No market data provider returned usable ${method} data. ${errors.join(' | ')}`);
  error.providerErrors = errors;
  throw error;
};

export const collectProviderResults = async (method, args, validate = value => Boolean(value)) => {
  const results = [];
  const errors = [];

  for (const provider of providerOrder) {
    if (!provider.enabled() || typeof provider[method] !== 'function') continue;

    try {
      const result = await provider[method](...args);
      if (validate(result)) {
        results.push(result);
      }
    } catch (error) {
      errors.push(`${provider.name}: ${error.message}`);
      console.warn(`${provider.name} ${method} failed:`, error.message);
    }
  }

  return { results, errors };
};

const normalizeText = value => String(value || '').toLowerCase();

const newsRelevanceScore = (item, { symbol, companyName, sector }) => {
  const title = normalizeText(item.title);
  const relatedTickers = (item.relatedTickers || []).map(normalizeText);
  const normalizedSymbol = normalizeText(symbol);
  const companyTokens = normalizeText(companyName)
    .split(/[^a-z0-9.]+/i)
    .filter(token => token.length > 3 && !['limited', 'inc', 'corp', 'plc', 'group', 'class', 'common'].includes(token));
  const sectorTokens = normalizeText(sector)
    .split(/[^a-z0-9.]+/i)
    .filter(token => token.length > 4);

  let score = 0;
  if (normalizedSymbol && relatedTickers.includes(normalizedSymbol)) score += 8;
  if (normalizedSymbol && title.includes(normalizedSymbol)) score += 5;
  if (companyTokens.some(token => title.includes(token))) score += 6;
  if (sectorTokens.some(token => title.includes(token))) score += 2;
  return score;
};

export const getMarketNews = async (symbol, companyName, sector) => {
  if (symbol && typeof symbol === 'object') {
    companyName = symbol.companyName || symbol.name;
    sector = symbol.sector;
    symbol = symbol.symbol;
  }

  const queries = [
    { text: `${symbol} ${companyName || ''} stock earnings financial news`, scope: 'company' },
    sector ? { text: `${sector} sector market news stocks`, scope: 'sector' } : null,
    { text: 'stock market macro financial news', scope: 'macro' },
  ].filter(Boolean);

  const seen = new Set();
  const news = [];

  if (marketDataProviders.finnhub.enabled()) {
    try {
      const finnhubNews = await marketDataProviders.finnhub.news(symbol);
      for (const item of finnhubNews) {
        const key = item.link || item.title;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        news.push({ ...item, relevanceScore: 10 });
      }
    } catch (error) {
      console.warn(`Finnhub news failed for "${symbol}":`, redactSecrets(error.message));
    }
  }

  for (const queryPlan of queries) {
    try {
      const results = await yahooFinance.search(
        queryPlan.text,
        { quotesCount: 0, newsCount: 6 },
        { validateResult: false }
      );

      for (const item of results.news || []) {
        const key = item.uuid || item.link || item.title;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const normalizedItem = {
          title: item.title,
          publisher: item.publisher,
          link: item.link,
          publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime).toISOString() : undefined,
          type: item.type,
          relatedTickers: item.relatedTickers || [],
        };
        news.push({
          ...normalizedItem,
          scope: queryPlan.scope,
          provider: 'Yahoo Finance',
          relevanceScore: newsRelevanceScore(normalizedItem, { symbol, companyName, sector }),
        });
      }
    } catch (error) {
      console.warn(`Yahoo Finance news failed for "${queryPlan.text}":`, redactSecrets(error.message));
    }
  }

  return news
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .filter(item => item.relevanceScore > 0 || item.scope === 'macro')
    .slice(0, 10)
    .map(({ relevanceScore, ...item }) => item);
};
