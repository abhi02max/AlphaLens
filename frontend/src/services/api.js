import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password, learningMode) => api.post('/auth/register', { name, email, password, learningMode }),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (learningMode) => api.put('/auth/preferences', { learningMode }),
}

export const stockApi = {
  search: (query) => api.get('/stocks/search', { params: { q: query } }),
  getDetails: (symbol) => api.get(`/stocks/quote/${symbol}`),
  getChart: (symbol, range = '1mo') => api.get(`/stocks/chart/${symbol}`, { params: { range } }),
}

export const aiApi = {
  getInsight: (symbol, mode = 'beginner') => api.get(`/ai/insight/${symbol}`, { params: { mode } }),
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