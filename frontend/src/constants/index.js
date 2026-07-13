// Design Tokens (Stripe-inspired)
export const COLORS = {
  // Brand
  primary: '#0F172A', // slate-900 (dark navy)
  accent: '#0066FF', // vibrant blue
  success: '#10B981', // emerald
  warning: '#F59E0B', // amber
  danger: '#EF4444', // red

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
}

// Stock Market Symbols
export const MARKET_SYMBOLS = {
  'S&P 500': '^GSPC',
  'NASDAQ': '^IXIC',
  'Bitcoin': 'BTC-USD',
  'Gold': 'GC=F',
  'Crude Oil': 'CL=F',
  'EUR/USD': 'EURUSD=X',
}

export const STOCK_SYMBOLS = [
  { symbol: '^GSPC', name: 'S&P 500', category: 'Index' },
  { symbol: '^IXIC', name: 'NASDAQ', category: 'Index' },
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'Crypto' },
  { symbol: 'GC=F', name: 'Gold', category: 'Commodity' },
  { symbol: 'CL=F', name: 'Crude Oil', category: 'Commodity' },
  { symbol: 'EURUSD=X', name: 'EUR/USD', category: 'Forex' },
]

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  TIMEOUT: 10000,
  POLLING_INTERVALS: {
    QUOTE: 60000, // 60s for live quotes
    CHART: 300000, // 5m for chart data
    SEARCH: 0, // No polling, manual search
    WATCHLIST: 120000, // 2m for watchlist
    HEALTH: 30000, // 30s for health checks
  },
}

// Chart Configuration
export const CHART_TIMEFRAMES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', 'max']

export const WORKSPACE_PROFILE = 'legendary-pro'

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 3000,
  DEBOUNCE_SEARCH: 300,
  SKELETON_WAVES: 3,
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The resource you\'re looking for was not found.',
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Logged in successfully!',
  REGISTER: 'Account created successfully!',
  LOGOUT: 'Logged out successfully!',
  WATCHLIST_ADDED: 'Added to watchlist',
  WATCHLIST_REMOVED: 'Removed from watchlist',
}
