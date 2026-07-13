import api from './apiClient'

/**
 * Consolidated API service layer
 * All services use the single apiClient with proper auth handling
 */

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password, learningMode) => api.post('/auth/register', { name, email, password, learningMode }),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (learningMode) => api.put('/auth/preferences', { learningMode }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
}

export const stockApi = {
  search: (query) => api.get('/stocks/search', { params: { q: query } }),
  getDetails: (symbol) => api.get(`/stocks/quote/${encodeURIComponent(symbol)}`),
  getChart: (symbol, range = '1mo') => api.get(`/stocks/chart/${encodeURIComponent(symbol)}`, { params: { range } }),
  getNews: (symbol) => api.get(`/stocks/news/${encodeURIComponent(symbol)}`),
}

export const aiApi = {
  getInsight: (symbol, mode = 'beginner') => api.get(`/ai/insight/${symbol}`, { params: { mode } }),
  getProfessionalReport: (symbol) => api.get(`/ai/report/${encodeURIComponent(symbol)}`),
  analyzeSimulation: (payload) => api.post('/ai/simulate', payload, { timeout: 15000 }),
}

export const userApi = {
  getPreferences: () => api.get('/users/preferences'),
  updateLearningMode: (mode) => api.put('/users/preferences/mode', { mode }),
}

export const watchlistApi = {
  get: () => api.get('/watchlist'),
  add: (symbol) => api.post('/watchlist', { symbol }),
  remove: (symbol) => api.delete(`/watchlist/${symbol}`),
}

export const healthApi = {
  check: () => api.get('/health'),
}

export default api
