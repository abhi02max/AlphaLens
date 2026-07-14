export const FINANCE_KEYS = {
  portfolio: 'walletstack-portfolio-v1',
  budget: 'walletstack-budget-v1',
  goals: 'walletstack-goals-v1',
}

export const userStorageKey = (key, userId) => `${key}:${userId}`

export const readStorage = (key, fallback) => {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export const writeStorage = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const formatCurrency = (value, currency = 'INR') => {
  const amount = Number(value || 0)
  if (currency === 'V$') {
    return `V$${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  }
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (value) => {
  if (!value) return 'No date'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(parseLocalDate(value))
}

export const parseLocalDate = (value) => {
  if (value instanceof Date) return value
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

export const monthKey = (value = new Date()) => {
  const date = parseLocalDate(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
