import api from '../utils/api';

export const watchlistService = {
  getWatchlist: async () => {
    const response = await api.get('/watchlist');
    return response.data;
  },
  
  addToWatchlist: async (symbol) => {
    const response = await api.post('/watchlist', { symbol });
    return response.data;
  },

  removeFromWatchlist: async (symbol) => {
    const response = await api.delete(`/watchlist/${symbol}`);
    return response.data;
  },
  
  checkWatchlist: async (symbol) => {
    const response = await api.get(`/watchlist/check/${symbol}`);
    return response.data;
  }
};
