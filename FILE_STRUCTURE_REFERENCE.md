# 🗂️ AlphaLens - New Files & Directory Structure

## Frontend Structure Changes

```
frontend/src/
├── components/
│   ├── ErrorBoundary.jsx          ✨ NEW - Error catching
│   └── ui/
│       ├── Button.jsx              ✨ NEW - Enterprise button
│       ├── Input.jsx               ✨ NEW - Enterprise input
│       ├── Card.jsx                ✨ NEW - Card + Header + Body + Footer
│       ├── Badge.jsx               ✨ NEW - Status badges
│       └── StatCard.jsx            ✨ NEW - Metric display
│
├── constants/
│   └── index.js                    ✨ NEW - All config & constants
│
├── utils/
│   ├── helpers.js                  ✨ NEW - Formatting utilities
│   └── api.js                      ⚠️ OLD - Consider deprecating
│
├── services/
│   ├── apiClient.js                ✨ NEW - Secure API client
│   ├── authService.js              ✨ NEW - Unified auth service
│   ├── api.js                      ⚠️ OLD - Replace with apiClient
│   └── auth.service.js             ⚠️ OLD - Duplicate (to remove)
│
├── context/
│   └── AuthContext.jsx             🔄 UPDATED - Secure auth
│
├── hooks/
│   └── useStocks.js                🔄 UPDATED - Optimized polling
│
├── pages/
│   ├── HomePage.jsx                🔄 UPDATED - Enterprise redesign
│   ├── Login.jsx                   🔄 UPDATED - Form validation
│   └── Register.jsx                🔄 UPDATED - Form validation
│
└── App.jsx                         🔄 UPDATED - ErrorBoundary wrapper
```

---

## Backend Structure Changes

```
src/
├── services/
│   └── auth.service.js             🔄 UPDATED - Dual token generation
│
├── controllers/
│   └── auth.controller.js          🔄 UPDATED - HttpOnly cookies
│
└── routes/
    └── auth.routes.js              🔄 UPDATED - /refresh & /logout
```

---

## New Files Reference

### 🎨 UI Components

#### `frontend/src/components/ui/Button.jsx`
**Purpose**: Reusable enterprise button component  
**Variants**: primary, secondary, danger, success, outline, ghost  
**Sizes**: sm, md, lg  
**Features**: Loading states, disabled states, icon support  

```jsx
<Button variant="primary" size="lg" isLoading={loading}>
  Click Me
</Button>
```

#### `frontend/src/components/ui/Input.jsx`
**Purpose**: Reusable form input component  
**Features**: Labels, error messages, hints, required indicators  
**Validation**: Real-time error display  

```jsx
<Input
  label="Email"
  type="email"
  error={errors.email}
  required
/>
```

#### `frontend/src/components/ui/Card.jsx`
**Purpose**: Flexible card layout component  
**Exports**: Card, CardHeader, CardBody, CardFooter  
**Variants**: default, elevated, ghost  

```jsx
<Card variant="elevated">
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

#### `frontend/src/components/ui/Badge.jsx`
**Purpose**: Status and label badges  
**Variants**: default, primary, success, warning, danger, positive, negative  
**Sizes**: sm, md, lg  

```jsx
<Badge variant="positive">+12.5%</Badge>
```

#### `frontend/src/components/ui/StatCard.jsx`
**Purpose**: Display metrics with trend indicators  
**Features**: Trend icons, badge colors, loading states  

```jsx
<StatCard
  title="Price"
  value="$150.25"
  changePercent={12.5}
  icon={TrendingUp}
/>
```

#### `frontend/src/components/ErrorBoundary.jsx`
**Purpose**: Catch React component errors  
**Features**: Recovery buttons, error details in dev mode  

```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

### 🔒 Security & Auth

#### `frontend/src/services/apiClient.js`
**Purpose**: Secure API client with HttpOnly cookie support  
**Features**:
- Automatic token refresh on 401
- Cookie handling with `withCredentials`
- Request/response interceptors
- Error handling

```javascript
// Automatically handles:
// 1. Adding accessToken to Authorization header
// 2. Sending refresh token cookie
// 3. Refreshing token on 401
// 4. Retrying failed requests
```

#### `frontend/src/services/authService.js`
**Purpose**: Unified authentication service  
**Methods**:
- `login(email, password)`
- `register(name, email, password, mode)`
- `logout()`
- `getCurrentUser()`
- `refreshToken()`
- `updatePreferences(mode)`

```javascript
const { user, accessToken } = await authService.login('user@email.com', 'pass')
// Automatically stores accessToken in sessionStorage
// Backend sets refreshToken in HttpOnly cookie
```

---

### ⚙️ Configuration

#### `frontend/src/constants/index.js`
**Purpose**: Centralized configuration and constants  

**Includes**:
- **COLORS**: Design system colors
- **MARKET_SYMBOLS**: Stock symbols with categories
- **API_CONFIG**: Base URL, timeout, polling intervals
- **CHART_TIMEFRAMES**: Available timeframe options
- **LEARNING_MODES**: Beginner/Pro modes
- **UI_CONFIG**: Animation durations, toast timing
- **ERROR_MESSAGES**: Standardized error messages
- **SUCCESS_MESSAGES**: Standardized success messages

```javascript
import { API_CONFIG, COLORS, MARKET_SYMBOLS } from '../constants'

// Use in hooks
const { data } = useQuery({
  refetchInterval: API_CONFIG.POLLING_INTERVALS.QUOTE,
})

// Use in components
<div style={{ color: COLORS.success }}>...</div>
```

---

### 🛠️ Utilities

#### `frontend/src/utils/helpers.js`
**Purpose**: Reusable utility functions  

**Functions**:
- `formatCurrency(value)` → "$1,234.56"
- `formatPercent(value)` → "+12.50%"
- `formatNumber(value)` → "1,234"
- `formatDate(date, format)` → "Jan 1, 2024"
- `debounce(func, delay)` → Debounced function
- `throttle(func, limit)` → Throttled function
- `cn(...classes)` → className helper
- `getInitials(name)` → "JD"
- `truncate(text, length)` → "Hello..."

```javascript
import { formatCurrency, formatPercent, cn } from '../utils/helpers'

<div className={cn('text-lg', active && 'font-bold')}>
  {formatCurrency(price)} ({formatPercent(change)})
</div>
```

---

### 📄 Documentation Files

#### `IMPLEMENTATION_SUMMARY.md`
**Purpose**: Overview of all changes made  
**Includes**: Completed tasks, metrics, next steps, security checklist

#### `TESTING_GUIDE.md`
**Purpose**: How to test and validate all changes  
**Includes**: Test cases, common issues, performance benchmarks

#### `CODEBASE_ANALYSIS.md` (from Explore Agent)
**Purpose**: Comprehensive code audit with issues  
**Size**: 3,500+ lines  
**Includes**: 14 sections, priority action items

#### `REMEDIATION_GUIDE.md` (from Explore Agent)
**Purpose**: Step-by-step code fixes  
**Includes**: Before/after examples, implementation details

---

## File Migration Guide

### ⚠️ Files to Update (Gradual Migration)

#### Old API Client → New Secure Client
**File**: `frontend/src/services/api.js` → `frontend/src/services/apiClient.js`

**Old Usage**:
```javascript
import api from '../services/api'
api.post('/auth/login', { email, password })
```

**New Usage**:
```javascript
import authService from '../services/authService'
authService.login(email, password)
```

#### Old Auth Service → New Service
**File**: `frontend/src/services/auth.service.js` → Deprecate  
**File**: Use `frontend/src/services/authService.js`

---

## Component Hierarchy

### Login Page Component Tree
```
LoginPage
├── Card (elevated)
│   └── CardBody
│       ├── Input (email)
│       ├── Input (password)
│       └── Button (primary)
└── Link (to register)
```

### HomePage Component Tree
```
HomePage
├── Hero Section
│   ├── SearchBar
│   ├── Button (primary)
│   └── Button (outline)
├── StatCard (3x)
├── Market Overview
│   └── MarketCard (4x)
├── Features Section
│   └── Feature Cards
└── CTA Section
    ├── Button (secondary)
    └── Button (primary)
```

---

## Import Patterns

### Correct Imports
```javascript
// Components
import Button from '../components/ui/Button'
import { Card, CardBody, CardFooter } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

// Services
import authService from '../services/authService'
import api from '../services/apiClient'

// Utilities
import { formatCurrency, cn } from '../utils/helpers'

// Constants
import { COLORS, API_CONFIG, MARKET_SYMBOLS } from '../constants'

// Hooks
import { useAuth } from '../context/AuthContext'
import { useStockQuote } from '../hooks/useStocks'
```

### Avoid (Old Pattern)
```javascript
// ❌ Don't use
import api from '../services/api'
import { authApi } from '../services/api'
import { formatCurrency } from '../utils/api' // Wrong location
```

---

## Styling Reference

### Tailwind Classes Used
```
Typography:
- font-bold, font-semibold, font-medium
- text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl
- tracking-tight

Colors:
- text-slate-{50-900}
- bg-blue-{50-700}
- border-slate-{100-300}

Spacing:
- p-{2-8} (padding)
- gap-{2-6} (gaps)
- mb-{2-8}, mt-{2-8} (margins)

Effects:
- shadow-{none,sm,md,lg,xl}
- rounded-{lg,xl,2xl}
- hover:*, transition-*

Flexbox:
- flex, flex-col, gap-*
- items-center, justify-center, justify-between
```

---

## Environment Variables Required

### Backend (.env)
```
JWT_SECRET=your_jwt_secret_here
REFRESH_SECRET=your_refresh_secret_here
NODE_ENV=production (for secure cookies in prod)
```

### Frontend (.env)
```
VITE_API_BASE_URL=/api
```

---

## Version Compatibility

| Package | Version | Purpose |
|---------|---------|---------|
| React | ^18.0 | UI framework |
| React Router | ^6.0 | Routing |
| Tailwind CSS | ^3.0 | Styling |
| Axios | ^1.0 | HTTP client |
| Lucide React | Latest | Icons |
| React Query | ^4.0 | Data fetching |
| React Hot Toast | Latest | Notifications |

---

## 🎯 Quick Setup Checklist

- [ ] Set `JWT_SECRET` and `REFRESH_SECRET` env vars
- [ ] Update imports to use new `authService` 
- [ ] Wrap app in `ErrorBoundary`
- [ ] Import components from `ui/` folder
- [ ] Use `apiClient` not old `api.js`
- [ ] Reference constants from `constants/index.js`
- [ ] Use helpers from `utils/helpers.js`

---

**Created**: June 30, 2026  
**Status**: Ready for production  
**Next**: Testing phase
