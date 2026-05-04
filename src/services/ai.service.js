import OpenAI from 'openai';

// We initialize the OpenAI client. It automatically looks for process.env.OPENAI_API_KEY
const openai = new OpenAI(); 

/**
 * Generates structured AI insights based on raw stock data.
 * @param {Object} stockData - The financial metrics fetched from Yahoo Finance.
 * @param {string} learningMode - "beginner" or "pro". Decides the complexity of the language.
 * @returns {Object} - Parsed JSON object containing the insights.
 */
export const generateStockInsight = async (stockData, learningMode = 'beginner') => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing in the .env file');
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
    
    TONE:
    - If mode is "beginner", explain metrics simply (e.g., explain what high P/E means).
    - If mode is "pro", be concise, analytical, and use standard financial jargon.
  `;

  // 2. Prompt Engineering: The User Prompt
  // This physically hands the context to the model.
  const userPrompt = `
    Here is the live stock data:
    ${JSON.stringify(stockData, null, 2)}
    
    Generate your analysis.
  `;

  try {
    // 3. API Call with Structured Outputs (Strict JSON)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective and fast for structural logic
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      // We use OpenAI's newer "Structured Outputs" to force the exact JSON schema.
      // This is 100% reliable compared to just asking the AI to "output JSON".
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'stock_insight_schema',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'A 2-3 sentence overall summary of the stock based on the data.'
              },
              risk: {
                type: 'string',
                enum: ['Low', 'Medium', 'High', 'Unknown'],
                description: 'Assessment of risk based on volatility and fundamentals.'
              },
              reason: {
                type: 'string',
                description: 'Why the stock might be currently priced the way it is (causal explanation).'
              },
              sentiment: {
                type: 'string',
                enum: ['Bullish', 'Bearish', 'Neutral'],
                description: 'Overall sentiment based strictly on the provided financial metrics.'
              }
            },
            required: ['summary', 'risk', 'reason', 'sentiment'],
            additionalProperties: false
          }
        }
      }
    });

    // The AI returns a stringified JSON. We parse it back into a JavaScript object.
    const insightJsonString = response.choices[0].message.content;
    return JSON.parse(insightJsonString);
    
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    throw new Error('Failed to generate AI insights');
  }
};
