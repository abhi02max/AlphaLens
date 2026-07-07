import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { stockApi } from '../services/api'
import { Search as SearchIcon, ArrowRight, Database } from 'lucide-react'

const popularSearches = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', market: 'NSE' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', market: 'NSE' },
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'Nasdaq' },
  { symbol: 'MSFT', name: 'Microsoft', market: 'Nasdaq' },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'Nasdaq' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', market: 'Crypto' },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const performSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 1) return
    setLoading(true)
    setError(null)
    try {
      const res = await stockApi.search(q)
      setResults(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      performSearch(q)
    }
  }, [searchParams, performSearch])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
    }
  }

  const openSymbol = (symbol) => navigate(`/stock/${symbol}`)

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Explore Markets
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Search stocks, ETFs, indices, and more from global markets
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="mb-10">
        <div className="relative flex items-center shadow-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <SearchIcon size={22} className="absolute left-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks, ETFs, indexes..."
            className="w-full pl-12 pr-28 py-4 text-lg rounded-xl bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
          <button type="submit" className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
            Search
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4 animate-pulse">
            <SearchIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Searching global markets...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-8 text-center max-w-lg mx-auto mb-8">
          <div className="text-red-600 dark:text-red-400 font-semibold mb-2">Search Failed</div>
          <p className="text-sm text-red-500/80 dark:text-red-400/80">{error}</p>
          <button
            onClick={() => query && performSearch(query)}
            className="mt-5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Retry search
          </button>
        </div>
      )}

      {!loading && !error && !searchParams.get('q') && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Popular instruments</h2>
              <p className="text-sm text-slate-500">Start with widely tracked stocks, indexes, and crypto.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularSearches.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => openSymbol(stock.symbol)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 p-4 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    {stock.symbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 dark:text-white">{stock.symbol}</div>
                    <div className="text-xs text-slate-500 truncate">{stock.name}</div>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{stock.market}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && results.length === 0 && searchParams.get('q') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Database size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No results found</h3>
          <p className="text-slate-500 text-sm">No results for "{searchParams.get('q')}". Try a different search term or symbol.</p>
        </div>
      )}

      {/* Results List */}
      <div className="grid gap-3">
        {results.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => openSymbol(stock.symbol)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md p-4 rounded-xl flex items-center gap-4 w-full text-left transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              {stock.symbol?.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-slate-900 dark:text-white">{stock.symbol}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${stock.type === 'EQUITY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {stock.type}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{stock.name}</p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-400 dark:text-slate-500">{stock.exchange || stock.sector}</div>
              {stock.sector && stock.sector !== 'N/A' && <div className="text-xs text-slate-400 mt-1">{stock.sector}</div>}
            </div>
            <ArrowRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200 ml-2" />
          </button>
        ))}
      </div>
    </div>
  )
}
