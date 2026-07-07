// Common utility functions

export const formatCurrency = (value, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const formatPercent = (value, decimals = 2) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export const formatNumber = (value, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const formatDate = (date, format = 'short') => {
  const options = {
    short: { month: 'short', day: 'numeric', year: '2-digit' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    time: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  }
  return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(new Date(date))
}

export const clsx = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

export const isStockSymbol = (symbol) => {
  return /^[A-Z0-9\-=.^]{1,10}$/.test(symbol)
}

export const throttle = (func, limit) => {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const debounce = (func, delay) => {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

export const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const truncate = (text, length = 50) => {
  return text.length > length ? text.slice(0, length) + '...' : text
}
