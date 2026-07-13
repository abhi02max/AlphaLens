import OpenAI from 'openai';

// We initialize the OpenAI client. It automatically looks for process.env.OPENAI_API_KEY
// We provide a fallback dummy key so the server doesn't crash on boot if the user hasn't set up .env yet
const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || 'dummy-key-to-prevent-crash';
const hasUsableAiKey = Boolean(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY);
const defaultOpenRouterModels = [
  'meta-llama/llama-3.1-8b-instruct',
  'tencent/hy3:free',
  'cohere/north-mini-code:free',
];
const openRouterModels = (process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || defaultOpenRouterModels.join(','))
  .split(',')
  .map(model => model.trim())
  .filter(Boolean);
const prioritizedOpenRouterModels = [
  ...openRouterModels.filter(model => model.endsWith(':free')),
  ...openRouterModels.filter(model => !model.endsWith(':free')),
];
const openRouterTimeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS || 25000);

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://openrouter.ai/api/v1', // Point to OpenRouter
  defaultHeaders: {
    "HTTP-Referer": "https://alphalens.app", // Optional, for including your app on openrouter.ai rankings.
    "X-Title": "AlphaLens", // Optional. Shows in rankings on openrouter.ai.
  }
}); 

const parseJsonContent = (content) => {
  let jsonString = String(content || '').trim();

  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/```/g, '').trim();
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    const match = jsonString.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response did not contain parseable JSON.');
    return JSON.parse(match[0]);
  }
};

const createJsonCompletion = async ({
  temperature,
  messages,
  timeoutMs = openRouterTimeoutMs,
  maxModels = prioritizedOpenRouterModels.length,
}) => {
  let lastError;

  for (const model of prioritizedOpenRouterModels.slice(0, maxModels)) {
    try {
      return await openai.chat.completions.create({
        model,
        temperature,
        messages,
        response_format: { type: 'json_object' },
        timeout: timeoutMs,
      });
    } catch (error) {
      lastError = error;
      const message = String(error.message || '');

      if (message.includes('402') || message.toLowerCase().includes('insufficient credits')) {
        console.warn(`OpenRouter model "${model}" failed:`, lastError.message);
        continue;
      }

      if (message.includes('response_format') || message.includes('structured') || message.includes('schema')) {
        try {
          return await openai.chat.completions.create({
            model,
            temperature,
            messages,
            timeout: timeoutMs,
          });
        } catch (retryError) {
          lastError = retryError;
        }
      }

      console.warn(`OpenRouter model "${model}" failed:`, lastError.message);
    }
  }

  throw lastError || new Error('No OpenRouter model returned a usable completion.');
};

/**
 * Generates structured AI insights based on raw stock data.
 * @param {Object} stockData - The financial metrics fetched from Yahoo Finance.
 * @param {string} learningMode - "beginner" or "pro". Decides the complexity of the language.
 * @returns {Object} - Parsed JSON object containing the insights.
 */
export const generateStockInsight = async (stockData, learningMode = 'beginner') => {
  // If no API key, return mock data for demo purposes
  if (!hasUsableAiKey) {
    return getMockInsight(stockData, learningMode);
  }

  // 1. Prompt Engineering: The System Prompt
  // Sets the AI's identity, behavior limitations, and specific rules.
  const systemPrompt = `
    You are an elite financial analyst working for AlphaLens.
    Your task is to analyze raw stock data and provide insights for a ${learningMode} investor.
    
    RULES TO AVOID HALLUCINATIONS:
    1. Base your analysis STRICTLY on the JSON data provided by the user.
    2. Do not invent news, events, or numbers that are not in the data provided.
    3. If the data is missing critical metrics (like PE ratio or EPS), acknowledge it rather than guessing.
    4. Do not provide outright financial advice to buy or sell. Be objective.
    5. Output ONLY raw, strict, parseable JSON. Do not include markdown codeblocks or any backticks.
    
    TONE:
    - If mode is "beginner", explain metrics simply (e.g., explain what high P/E means).
    - If mode is "pro", be concise, analytical, and use standard financial jargon.
    
    REQUIRED JSON SCHEMA:
    {
      "summary": "A 2-3 sentence overall summary of the stock based on the data.",
      "risk": "Must be one of: Low, Medium, High, Unknown",
      "reason": "Why the stock might be currently priced the way it is (causal explanation).",
      "sentiment": "Must be one of: Bullish, Bearish, Neutral"
    }
  `;

  // 2. Prompt Engineering: The User Prompt
  // This physically hands the context to the model.
  const userPrompt = `
    Here is the live stock data:
    ${JSON.stringify(stockData, null, 2)}
    
    Generate your analysis. Ensure standard JSON formatting matching the requested schema.
  `;

  try {
    // 3. API Call with model fallback chain.
    const response = await createJsonCompletion({
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    return parseJsonContent(response.choices[0].message.content);
    
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    // Return mock data as fallback instead of throwing
    return getMockInsight(stockData, learningMode);
  }
};

export const generateTradeSimulationAnalysis = async (stockData, simulation, learningMode = 'beginner') => {
  if (!hasUsableAiKey) {
    return getMockTradeAnalysis(stockData, simulation);
  }

  const systemPrompt = `
    You are AlphaLens, an AI financial research assistant for an educational virtual-money stock simulator.
    Explain possible outcomes before a user takes real action elsewhere.

    STRICT RULES:
    1. Do not give direct financial advice. Do not command the user to buy, sell, hold, or avoid.
    2. Do not guarantee future price movement. Use probabilistic language: may, could, risk, scenario, watch.
    3. Base analysis only on the provided metrics and simulation details.
    4. If news, earnings, sector, macro, or sentiment data is missing, say that clearly.
    5. Output only raw strict JSON.

    REQUIRED JSON SCHEMA:
    {
      "educationalVerdict": "One of: Favorable setup, Mixed setup, Risky setup, Insufficient data",
      "likelyDirection": "One of: Upward bias, Downward bias, Sideways or uncertain, Unknown",
      "confidence": "One of: Low, Medium, High",
      "plainEnglishSummary": "2-4 sentences explaining the simulated trade setup.",
      "whyItMayRise": ["factor 1", "factor 2", "factor 3"],
      "whyItMayFall": ["risk 1", "risk 2", "risk 3"],
      "whatMovedItRecently": "Explain today's rise/fall using only available price, percent change, volume, range, valuation, and data source.",
      "simulationImpact": {
        "virtualAmount": "string",
        "positionSizeComment": "string",
        "riskIfFalls5Percent": "string",
        "gainIfRises5Percent": "string"
      },
      "missingDataToCheck": ["item 1", "item 2", "item 3"],
      "beforeRealMoneyChecklist": ["check 1", "check 2", "check 3", "check 4"],
      "notFinancialAdvice": "One-sentence disclaimer."
    }
  `;

  const userPrompt = `
    Stock metrics:
    ${JSON.stringify(stockData, null, 2)}

    Virtual simulation details:
    ${JSON.stringify(simulation, null, 2)}

    Learning mode: ${learningMode}
  `;

  try {
    const response = await createJsonCompletion({
      temperature: 0.15,
      timeoutMs: Number(process.env.OPENROUTER_SIMULATION_TIMEOUT_MS || 7000),
      maxModels: Number(process.env.OPENROUTER_SIMULATION_MAX_MODELS || 1),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return parseJsonContent(response.choices[0].message.content);
  } catch (error) {
    console.error('Trade Simulation AI Error:', error.message);
    return getMockTradeAnalysis(stockData, simulation);
  }
};

export const generateProfessionalStockReport = async ({ stockData, chartData = [], news = [] }) => {
  const context = buildProfessionalReportContext(stockData, chartData, news);

  if (!hasUsableAiKey) {
    return getMockProfessionalReport(context);
  }

  const systemPrompt = `
    You are AlphaLens' institutional equity research engine.
    Produce a concise trader-grade stock report for experienced market participants.

    STYLE:
    - Professional, concise, market-desk tone.
    - No beginner explanations, no tutorials, no promotional language.
    - Do not say "you should buy/sell." Use "AI view", "model suggests", or "current setup favors".
    - No guaranteed predictions.
    - State uncertainty and data gaps clearly.
    - Base the report only on the provided JSON metrics, chart summary, and news items.
    - Do not invent news, revenue, earnings, or events that are not provided.
    - Output only raw strict JSON. No markdown fences.

    REQUIRED JSON SCHEMA:
    {
      "stockSummary": "Concise professional setup covering price action, recent performance, valuation, market cap, P/E, EPS, volume, volatility, 52-week range, momentum, technical levels, and institutional interpretation.",
      "executiveSnapshot": "3-5 concise sentences covering current setup, price action, valuation, momentum, and desk-style interpretation.",
      "keyMetrics": [
        { "label": "string", "value": "string", "read": "short professional interpretation" }
      ],
      "technicalMomentumRead": {
        "trend": "string",
        "momentum": "string",
        "volatility": "string",
        "keyLevels": ["level/read 1", "level/read 2", "level/read 3"]
      },
      "fundamentalRead": {
        "valuation": "string",
        "quality": "string",
        "earningsPower": "string",
        "dataGaps": ["gap 1", "gap 2"]
      },
      "newsCatalystSummary": [
        { "headline": "string", "whyItMatters": "string", "likelyImpact": "string" }
      ],
      "aiAnalysis": {
        "pastPerformance": "string",
        "currentMarketConditions": "string",
        "fundamentalStrength": "string",
        "valuationRisk": "string",
        "momentumVolatility": "string",
        "sectorSentiment": "string",
        "forwardOutlook": "string"
      },
      "aiRecommendation": {
        "view": "HOLD or RELEASE",
        "confidence": "Low, Medium, or High",
        "timeHorizon": "Short-term, medium-term, or long-term",
        "rationale": ["reason 1", "reason 2", "reason 3"],
        "invalidationRisks": ["risk 1", "risk 2", "risk 3"],
        "monitorNext": ["event or level 1", "event or level 2", "event or level 3"]
      },
      "riskFactors": ["risk 1", "risk 2", "risk 3"],
      "watchlistTriggers": ["trigger 1", "trigger 2", "trigger 3"],
      "disclaimer": "This report is analytical and educational for simulation use only; it is not licensed financial advice or a directive to trade."
    }
  `;

  const userPrompt = `Generate a professional AlphaLens stock report from this context:\n${JSON.stringify(context, null, 2)}`;

  try {
    const response = await createJsonCompletion({
      temperature: 0.12,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return normalizeProfessionalReport(parseJsonContent(response.choices[0].message.content), context);
  } catch (error) {
    console.error('Professional Report AI Error:', error.message);
    return getMockProfessionalReport(context);
  }
};

/**
 * Generates mock AI insight for demo purposes when API is unavailable
 */
function getMockInsight(stockData, learningMode) {
  const price = stockData.price || 0;
  const change = stockData.change || 0;
  const changePercent = stockData.changePercent || 0;
  const peRatio = stockData.peRatio;
  const marketCap = stockData.marketCap;
  
  let sentiment = 'Neutral';
  let risk = 'Medium';
  
  if (change > 0) sentiment = 'Bullish';
  else if (change < 0) sentiment = 'Bearish';
  
  if (peRatio && peRatio > 30) risk = 'High';
  else if (peRatio && peRatio < 15) risk = 'Low';
  
  const summary = learningMode === 'beginner'
    ? `${stockData.name} (${stockData.symbol}) is currently trading at $${price.toFixed(2)}. The stock has ${change >= 0 ? 'gained' : 'declined'} ${Math.abs(changePercent).toFixed(2)}% today. ${sentiment === 'Bullish' ? 'This suggests positive momentum.' : sentiment === 'Bearish' ? 'This suggests negative momentum.' : 'The stock is relatively stable.'}`
    : `${stockData.symbol} at $${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%). ${sentiment} sentiment. Risk: ${risk}. PE: ${peRatio || 'N/A'}. Market Cap: ${marketCap ? (marketCap/1e9).toFixed(1)+'B' : 'N/A'}.`;

  return {
    summary,
    risk,
    reason: `Price movement driven by ${sentiment.toLowerCase()} market sentiment and ${peRatio ? 'elevated' : 'moderate'} valuation metrics.`,
    sentiment,
  };
}

function getMockTradeAnalysis(stockData, simulation) {
  const price = Number(stockData.price || 0);
  const changePercent = Number(stockData.changePercent || 0);
  const peRatio = stockData.peRatio;
  const volume = stockData.volume;
  const avgVolume = stockData.avgVolume;
  const amount = Number(simulation.orderValue || simulation.virtualAmount || 0);
  const quantity = Number(simulation.quantity || 0);
  const riskFive = amount * 0.05;
  const gainFive = amount * 0.05;

  const upward = changePercent > 0.5;
  const downward = changePercent < -0.5;
  const expensive = peRatio && peRatio > 35;
  const volumeElevated = volume && avgVolume && volume > avgVolume * 1.2;

  let educationalVerdict = 'Mixed setup';
  let likelyDirection = 'Sideways or uncertain';
  let confidence = 'Low';

  if (upward && !expensive) {
    educationalVerdict = 'Favorable setup';
    likelyDirection = 'Upward bias';
    confidence = 'Medium';
  } else if (downward || expensive) {
    educationalVerdict = 'Risky setup';
    likelyDirection = downward ? 'Downward bias' : 'Sideways or uncertain';
    confidence = 'Medium';
  }

  return {
    educationalVerdict,
    likelyDirection,
    confidence,
    plainEnglishSummary: `${stockData.symbol} is trading at ${price ? price.toFixed(2) : 'an unavailable price'} with a ${changePercent >= 0 ? 'positive' : 'negative'} move of ${changePercent.toFixed(2)}%. A virtual ${simulation.side || 'buy'} of ${quantity || 'N/A'} shares helps you see how position size affects profit and loss before risking real money.`,
    whyItMayRise: [
      upward ? 'Current price momentum is positive.' : 'A recovery could happen if buyers step in near support levels.',
      volumeElevated ? 'Volume is above average, which can confirm stronger market interest.' : 'Stable volume may support a calmer move.',
      peRatio && peRatio < 25 ? 'Valuation is not extremely stretched based on P/E.' : 'If earnings growth improves, investors may accept the valuation.',
    ],
    whyItMayFall: [
      downward ? 'The stock is already under pressure today.' : 'Momentum can reverse if broader market sentiment weakens.',
      expensive ? 'P/E looks elevated, so expectations may already be high.' : 'Valuation data alone is not enough to remove risk.',
      'Missing news, earnings, and sector data could hide important risks.',
    ],
    whatMovedItRecently: `Based on available data, the recent move appears linked to price momentum (${changePercent.toFixed(2)}%), trading range, volume, and valuation. No verified news catalyst was provided in the data.`,
    simulationImpact: {
      virtualAmount: amount ? `${amount.toFixed(2)} virtual currency units` : 'Not enough data',
      positionSizeComment: amount > 20000 ? 'This is a large simulated position, so swings will strongly affect your portfolio.' : 'This is a moderate simulated position for learning position sizing.',
      riskIfFalls5Percent: `A 5% fall would reduce this virtual position by about ${riskFive.toFixed(2)}.`,
      gainIfRises5Percent: `A 5% rise would increase this virtual position by about ${gainFive.toFixed(2)}.`,
    },
    missingDataToCheck: ['latest company news', 'earnings date and result', 'sector trend', 'broader market direction'],
    beforeRealMoneyChecklist: [
      'Check whether the move is caused by news or earnings.',
      'Compare valuation with similar companies.',
      'Decide your maximum loss before entering.',
      'Use the simulator for multiple scenarios before using real money.',
    ],
    notFinancialAdvice: 'This is educational simulator analysis, not a recommendation to buy or sell.',
  };
}

function buildProfessionalReportContext(stockData, chartData, news) {
  const cleanChart = [...(chartData || [])]
    .filter(point => point?.close != null)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = cleanChart[0];
  const last = cleanChart[cleanChart.length - 1];
  const closes = cleanChart.map(point => Number(point.close)).filter(Number.isFinite);
  const highs = cleanChart.map(point => Number(point.high ?? point.close)).filter(Number.isFinite);
  const lows = cleanChart.map(point => Number(point.low ?? point.close)).filter(Number.isFinite);
  const chartReturn = first?.close && last?.close
    ? ((Number(last.close) - Number(first.close)) / Number(first.close)) * 100
    : undefined;
  const averageVolume = cleanChart.length
    ? cleanChart.reduce((sum, point) => sum + Number(point.volume || 0), 0) / cleanChart.length
    : undefined;

  return {
    generatedAt: new Date().toISOString(),
    stock: stockData,
    chartSummary: {
      points: cleanChart.length,
      startDate: first?.date,
      endDate: last?.date,
      startClose: first?.close,
      lastClose: last?.close,
      periodReturnPercent: chartReturn,
      periodHigh: highs.length ? Math.max(...highs) : undefined,
      periodLow: lows.length ? Math.min(...lows) : undefined,
      averageChartVolume: averageVolume,
      latestProvider: last?.provider,
      latestFreshness: last?.freshness,
    },
    news: (news || []).slice(0, 10),
  };
}

function normalizeProfessionalReport(report, context) {
  const fallback = getMockProfessionalReport(context);
  return {
    stockSummary: report.stockSummary || fallback.stockSummary,
    executiveSnapshot: report.executiveSnapshot || fallback.executiveSnapshot,
    keyMetrics: Array.isArray(report.keyMetrics) ? report.keyMetrics : fallback.keyMetrics,
    technicalMomentumRead: report.technicalMomentumRead || fallback.technicalMomentumRead,
    fundamentalRead: report.fundamentalRead || fallback.fundamentalRead,
    newsCatalystSummary: Array.isArray(report.newsCatalystSummary) && report.newsCatalystSummary.length
      ? report.newsCatalystSummary
      : fallback.newsCatalystSummary,
    aiAnalysis: report.aiAnalysis || fallback.aiAnalysis,
    aiRecommendation: report.aiRecommendation || fallback.aiRecommendation,
    riskFactors: Array.isArray(report.riskFactors) ? report.riskFactors : fallback.riskFactors,
    watchlistTriggers: Array.isArray(report.watchlistTriggers) ? report.watchlistTriggers : fallback.watchlistTriggers,
    disclaimer: report.disclaimer || fallback.disclaimer,
  };
}

function getMockProfessionalReport(context) {
  const stock = context.stock || {};
  const chart = context.chartSummary || {};
  const changePercent = Number(stock.changePercent || 0);
  const periodReturn = Number(chart.periodReturnPercent || 0);
  const pe = Number(stock.peRatio || 0);
  const price = Number(stock.price || 0);
  const dayHigh = Number(stock.dayHigh || 0);
  const dayLow = Number(stock.dayLow || 0);
  const weekHigh = Number(stock.fiftyTwoWeekHigh || 0);
  const weekLow = Number(stock.fiftyTwoWeekLow || 0);
  const volume = Number(stock.volume || 0);
  const avgVolume = Number(stock.avgVolume || chart.averageChartVolume || 0);
  const volumeRead = volume && avgVolume ? `${(volume / avgVolume).toFixed(2)}x average volume` : 'volume context limited';
  const nearHigh = weekHigh && price ? price > weekHigh * 0.9 : false;
  const belowTrend = periodReturn < -3;
  const stretched = pe > 35 || nearHigh;
  const weakMomentum = changePercent < -0.5 || belowTrend;
  const view = weakMomentum && stretched ? 'RELEASE' : 'HOLD';
  const confidence = context.news?.length >= 3 && chart.points >= 10 ? 'Medium' : 'Low';

  const newsSummary = context.news?.length
    ? context.news.slice(0, 5).map(item => ({
        headline: item.title || 'Market item unavailable',
        whyItMatters: `${item.publisher || 'Market source'} reported a catalyst relevant to ${stock.symbol || 'the instrument'}.`,
        likelyImpact: 'Monitor for follow-through in volume, spreads, and sector-relative performance.',
      }))
    : [{
        headline: 'No verified recent catalyst available from connected feeds',
        whyItMatters: 'The model cannot attribute the current move to a confirmed company or sector headline.',
        likelyImpact: 'Price action should be treated as technically driven until a verified catalyst is available.',
      }];

  return {
    stockSummary: `${stock.symbol} trades at ${formatCurrencyValue(price, stock.currency)} with session movement of ${formatPercentValue(changePercent)} and recent chart-window performance of ${formatPercentValue(periodReturn)}. Market cap is ${formatLargeNumber(stock.marketCap)}, P/E is ${stock.peRatio ? `${Number(stock.peRatio).toFixed(2)}x` : 'not reported'}, EPS is ${stock.eps ?? 'not reported'}, and volume is ${formatLargeNumber(volume)} versus ${avgVolume ? formatLargeNumber(avgVolume) : 'limited'} average context. The mapped range is ${formatCurrencyValue(weekLow, stock.currency)} to ${formatCurrencyValue(weekHigh, stock.currency)} across the 52-week band, with tactical levels around ${dayLow ? formatCurrencyValue(dayLow, stock.currency) : 'unreported support'} and ${dayHigh ? formatCurrencyValue(dayHigh, stock.currency) : 'unreported resistance'}. Institutional read: ${stretched ? 'valuation sensitivity is elevated' : 'valuation is not the dominant risk on available inputs'}, while ${weakMomentum ? 'momentum requires confirmation before risk can be expanded' : 'momentum supports a monitoring stance rather than immediate risk reduction'}.`,
    executiveSnapshot: `${stock.symbol} is trading at ${formatCurrencyValue(price, stock.currency)} with session performance of ${formatPercentValue(changePercent)}. The recent chart window shows ${formatPercentValue(periodReturn)} performance, with price positioned between ${formatCurrencyValue(weekLow, stock.currency)} and ${formatCurrencyValue(weekHigh, stock.currency)} across the 52-week band. Valuation screens at ${stock.peRatio ? `${Number(stock.peRatio).toFixed(2)}x P/E` : 'limited P/E visibility'}, while EPS is ${stock.eps ?? 'not reported'} and market cap is ${formatLargeNumber(stock.marketCap)}. The current setup favors ${view === 'HOLD' ? 'continued monitoring rather than forced exit' : 'risk reduction'} based on momentum, valuation, and available catalyst visibility.`,
    keyMetrics: [
      { label: 'Price', value: formatCurrencyValue(price, stock.currency), read: `${formatPercentValue(changePercent)} session move; latest quote ${stock.freshness || 'freshness unknown'}.` },
      { label: 'Market Cap', value: formatLargeNumber(stock.marketCap), read: 'Scale and liquidity context for institutional positioning.' },
      { label: 'P/E', value: stock.peRatio ? `${Number(stock.peRatio).toFixed(2)}x` : 'Not reported', read: pe > 35 ? 'Premium multiple; execution risk is elevated.' : 'Multiple does not screen as aggressively extended on available data.' },
      { label: 'EPS', value: stock.eps != null ? String(stock.eps) : 'Not reported', read: 'Earnings power input for valuation sensitivity.' },
      { label: 'Volume', value: formatLargeNumber(volume), read: volumeRead },
      { label: '52W Range', value: `${formatCurrencyValue(weekLow, stock.currency)} - ${formatCurrencyValue(weekHigh, stock.currency)}`, read: nearHigh ? 'Price is operating near upper range; pullback risk rises if momentum fades.' : 'Price is not at an obvious 52-week upside extreme.' },
    ],
    technicalMomentumRead: {
      trend: periodReturn >= 0 ? `Positive period trend of ${formatPercentValue(periodReturn)}.` : `Negative period trend of ${formatPercentValue(periodReturn)}.`,
      momentum: changePercent >= 0 ? 'Session momentum is constructive, pending volume confirmation.' : 'Session momentum is defensive; watch whether sellers press below intraday support.',
      volatility: dayHigh && dayLow ? `Session range: ${formatCurrencyValue(dayLow, stock.currency)} to ${formatCurrencyValue(dayHigh, stock.currency)}.` : 'Intraday volatility data is incomplete.',
      keyLevels: [
        dayLow ? `Intraday support: ${formatCurrencyValue(dayLow, stock.currency)}` : 'Intraday support not reported',
        dayHigh ? `Intraday resistance: ${formatCurrencyValue(dayHigh, stock.currency)}` : 'Intraday resistance not reported',
        weekHigh ? `Major upside reference: ${formatCurrencyValue(weekHigh, stock.currency)} 52-week high` : '52-week high unavailable',
      ],
    },
    fundamentalRead: {
      valuation: pe ? `${pe.toFixed(2)}x P/E; ${stretched ? 'valuation risk is material if growth expectations moderate.' : 'valuation risk appears manageable on available metrics.'}` : 'P/E not reported; valuation confidence is reduced.',
      quality: stock.marketCap ? 'Market-cap profile supports liquidity assessment, but balance-sheet and margin data are not connected in this feed.' : 'Quality read constrained by missing market-cap data.',
      earningsPower: stock.eps != null ? `EPS reported at ${stock.eps}; monitor revisions and upcoming earnings.` : 'EPS missing; earnings-power view is incomplete.',
      dataGaps: ['Revenue trend', 'margin trend', 'earnings revisions', 'balance-sheet leverage'].filter(Boolean),
    },
    newsCatalystSummary: newsSummary,
    aiAnalysis: {
      pastPerformance: `Recent chart-window return is ${formatPercentValue(periodReturn)} across ${chart.points || 0} usable data points.`,
      currentMarketConditions: `Session tape is ${changePercent >= 0 ? 'constructive' : 'defensive'} with ${volumeRead}; broader market attribution is limited to connected feeds.`,
      fundamentalStrength: stock.marketCap ? `Scale is visible through market cap of ${formatLargeNumber(stock.marketCap)}, but revenue, margin, and balance-sheet trends are not connected in the current feed.` : 'Fundamental strength is constrained by missing market-cap, revenue, margin, and balance-sheet context.',
      valuationRisk: pe ? `${pe.toFixed(2)}x P/E indicates ${stretched ? 'elevated multiple-compression risk if growth expectations weaken.' : 'manageable valuation risk on available data.'}` : 'P/E is not reported, reducing valuation confidence.',
      momentumVolatility: dayHigh && dayLow ? `Momentum reference is ${formatPercentValue(changePercent)} with intraday range from ${formatCurrencyValue(dayLow, stock.currency)} to ${formatCurrencyValue(dayHigh, stock.currency)}.` : 'Volatility read is incomplete because intraday range data is missing.',
      sectorSentiment: stock.sector ? `${stock.sector} sentiment should be monitored against sector peers and macro risk appetite.` : 'Sector sentiment is unavailable from the connected quote feed.',
      forwardOutlook: view === 'HOLD'
        ? 'Current setup favors maintaining the simulated position view while monitoring support, resistance, volume confirmation, and verified catalysts.'
        : 'Current setup favors simulated risk reduction until momentum stabilizes or valuation/catalyst support improves.',
    },
    aiRecommendation: {
      view,
      confidence,
      timeHorizon: weakMomentum ? 'Short-term' : 'Medium-term',
      rationale: [
        `Current price action is ${changePercent >= 0 ? 'constructive' : 'under pressure'} at ${formatPercentValue(changePercent)}.`,
        `Recent chart return is ${formatPercentValue(periodReturn)}, informing momentum bias.`,
        pe ? `Valuation at ${pe.toFixed(2)}x P/E ${stretched ? 'raises multiple-compression risk' : 'does not dominate the setup'}.` : 'Valuation confidence is limited by missing P/E.',
      ],
      invalidationRisks: [
        'Unexpected earnings revision or guidance change.',
        'Sector-wide de-rating or macro risk-off move.',
        'Breakdown below mapped support with expanding volume.',
      ],
      monitorNext: [
        dayLow ? `Break/hold around ${formatCurrencyValue(dayLow, stock.currency)} intraday support.` : 'Next reported support level.',
        dayHigh ? `Acceptance above ${formatCurrencyValue(dayHigh, stock.currency)} intraday resistance.` : 'Next reported resistance level.',
        'Confirmed company or sector catalyst from verified news feed.',
      ],
    },
    riskFactors: [
      'Free-market data feeds may be delayed or incomplete for some exchanges.',
      'News coverage may miss filings, paywalled research, or local-language catalysts.',
      'Forward-looking view is scenario-based and sensitive to market regime changes.',
    ],
    watchlistTriggers: [
      'Volume expansion above average with price holding above intraday resistance.',
      'P/E re-rating without earnings revision support.',
      'Company-specific news that changes revenue, margin, or capital-allocation expectations.',
    ],
    disclaimer: 'This report is analytical and educational for simulation use only; it is not licensed financial advice or a directive to trade.',
  };
}

function formatCurrencyValue(value, currency = 'USD') {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Not reported';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: number > 1000 ? 0 : 2,
  }).format(number);
}

function formatPercentValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Not reported';
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`;
}

function formatLargeNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Not reported';
  if (Math.abs(number) >= 1e12) return `${(number / 1e12).toFixed(2)}T`;
  if (Math.abs(number) >= 1e9) return `${(number / 1e9).toFixed(2)}B`;
  if (Math.abs(number) >= 1e6) return `${(number / 1e6).toFixed(2)}M`;
  return number.toLocaleString();
}
