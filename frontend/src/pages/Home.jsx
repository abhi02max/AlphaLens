import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { stockApi, healthApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [health, setHealth] = useState(null)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => { healthApi.check().then(r => setHealth(r.data)).catch(() => {}) }, [])

  useEffect(() => {
    if (query.length < 1) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await stockApi.search(query)
        setSuggestions(res.data.data?.slice(0, 6) || [])
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (symbol) => {
    setShowSuggestions(false)
    setQuery('')
    navigate(`/stock/${symbol}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      navigate(`/search?q=${query}`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20">
          <span className="text-3xl font-bold text-white">A</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Financial Intelligence</span>
          <br />Powered by AI
        </h1>
        <p className="text-lg text-dark-600 dark:text-dark-400 mb-8 max-w-lg mx-auto">
          Search any stock. Understand what&apos;s happening. Make informed decisions.
        </p>
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks, ETFs, indexes... (e.g. AAPL, RELIANCE.NS)"
            className="input pl-5 pr-12 py-4 text-lg rounded-2xl shadow-lg shadow-primary-500/5"
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary p-2.5 rounded-xl text-lg">
            →
          </button>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 card animate-fade-in z-10 divide-y dark:divide-dark-700">
              {suggestions.map((s) => (
                <button key={s.symbol} onMouseDown={() => handleSelect(s.symbol)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors text-left">
                  <div>
                    <div className="font-semibold text-sm">{s.symbol}</div>
                    <div className="text-xs text-dark-500 dark:text-dark-400">{s.name}</div>
                  </div>
                  <div className="ml-auto text-xs badge-info">{s.type}</div>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
        <div className="card p-5 text-center">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-semibold mb-1">AI Insights</h3>
          <p className="text-sm text-dark-500">Understand why stocks move</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold mb-1">Live Charts</h3>
          <p className="text-sm text-dark-500">Interactive price action</p>
        </div>
        <div className="card p-5 text-center">
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold mb-1">Learning Mode</h3>
          <p className="text-sm text-dark-500">Beginner to Pro</p>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="flex gap-3 mt-4">
          <Link to="/login" className="btn-primary">Sign In</Link>
          <Link to="/register" className="btn-secondary">Get Started</Link>
        </div>
      )}

      {health && (
        <div className="text-xs text-dark-400 dark:text-dark-500 flex items-center gap-2 mt-4">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
          API {health.message}
        </div>
      )}
    </div>
  )
}