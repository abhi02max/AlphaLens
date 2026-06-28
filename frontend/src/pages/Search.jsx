import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { stockApi } from '../services/api'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      performSearch(q)
    }
  }, [searchParams])

  const performSearch = async (q) => {
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
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
    }
  }

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks, ETFs, indexes..."
            className="input pl-5 pr-12 py-3.5 text-lg rounded-xl"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary p-2 rounded-lg">
            Search
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="card p-6 text-center text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && searchParams.get('q') && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-dark-500">No results found for &quot;{searchParams.get('q')}&quot;</p>
        </div>
      )}

      <div className="grid gap-3">
        {results.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => navigate(`/stock/${stock.symbol}`)}
            className="card-hover p-4 flex items-center gap-4 w-full text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{stock.symbol}</span>
                <span className={`badge ${stock.type === 'EQUITY' ? 'badge-success' : 'badge-info'}`}>{stock.type}</span>
              </div>
              <p className="text-sm text-dark-500 dark:text-dark-400 truncate">{stock.name}</p>
            </div>
            <div className="text-right text-xs text-dark-400 hidden sm:block">
              <div>{stock.exchange || stock.sector}</div>
              {stock.sector !== 'N/A' && <div>{stock.sector}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}