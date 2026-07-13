import api from './apiClient'

export const stockService = {
  searchStocks: async (query) => {
    const response = await api.get('/stocks/search', { params: { q: query } });
    return response.data.data;
  },
  
  getStockQuote: async (symbol) => {
    const response = await api.get(`/stocks/quote/${symbol}`);
    return response.data.data;
  },

  getStockChart: async (symbol, range = '1mo') => {
    const response = await api.get(`/stocks/chart/${symbol}?range=${range}`);
    return response.data.data; 
  },

  getAiInsights: async (symbol) => {
    const response = await api.get(`/ai/insight/${symbol}?mode=pro`);
    return response.data.data ? response.data.data.insight : response.data.insight; 
  }
};
