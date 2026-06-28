import OpenAI from 'openai';
import { InternalServerError } from '../utils/appError.js';

// We initialize the OpenAI client. It automatically looks for process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,      // Use the key from .env (Nvidia NIM API Key)
  baseURL: 'https://integrate.api.nvidia.com/v1', // Point to Nvidia inference endpoint
}); 

/**
 * Generates structured AI insights based on raw stock data.
 * @param {Object} stockData - The financial metrics fetched from Yahoo Finance.
 * @param {string} learningMode - "beginner" or "pro". Decides the complexity of the language.
 * @returns {Object} - Parsed JSON object containing the insights.
 */
export const generateStockInsight = async (stockData, learningMode = 'beginner') => {
  // If no API key, return mock data for demo purposes
  if (!process.env.OPENAI_API_KEY) {
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
    // 3. API Call with Structured Outputs (Strict JSON)
    const response = await openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct', // Uses Nvidia's standard Llama 3.1 8B Endpoint
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    let insightJsonString = response.choices[0].message.content;
    
    // Safety fallback in case LLM decides to wrap it in markdown
    if (insightJsonString.startsWith("\`\`\`json")) {
        insightJsonString = insightJsonString.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    }
    
    return JSON.parse(insightJsonString);
    
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    // Return mock data as fallback instead of throwing
    return getMockInsight(stockData, learningMode);
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
