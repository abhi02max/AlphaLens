import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, GitCompare, Plus, Search, WalletCards, X } from 'lucide-react'
import { stockApi } from '../services/api'

const defaultSymbols = ['AAPL', 'MSFT', 'RELIANCE.NS']

export default function Compare() {
  const [symbols, setSymbols] = useState(defaultSymbols)
  const [input, setInput] = useState('')

  const quoteQueries = useQueries({
    queries: symbols.map(symbol => ({
      queryKey: ['compare-quote', symbol],
      queryFn: () => stockApi.getDetails(symbol).then(r => r.data.data),
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    })),
  })

  const rows = quoteQueries.map((query, index) => ({
    symbol: symbols[index],
    loading: query.isLoading,
    error: query.error,
    data: query.data,
  }))

  const bestMomentum = useMemo(() => {
    return rows
      .filter(row => row.data?.changePercent != null)
      .sort((a, b) => b.data.changePercent - a.data.changePercent)[0]?.data?.symbol
  }, [rows])

  const formatMoney = (value, currency = 'USD') => {
    if (value == null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatCompact = (value) => {
    if (value == null) return 'N/A'
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    return value.toLocaleString()
  }

  const addSymbol = (event) => {
    event.preventDefault()
    const symbol = input.trim().toUpperCase()
    if (!symbol || symbols.includes(symbol)) return
    setSymbols(prev => [...prev, symbol].slice(0, 5))
    setInput('')
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-3">
              <GitCompare size={14} />
              Explainable comparison
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              Compare stocks without tab switching.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 max-w-2xl">
              Put companies side-by-side and compare price action, valuation, market cap, range, data source, and simulator readiness.
            </p>
          </div>
          <form onSubmit={addSymbol} className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="input pl-9"
                placeholder="Add ticker"
              />
            </div>
            <button className="btn-primary" type="submit">
              <Plus size={16} />
              Add
            </button>
          </form>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {rows.map(row => {
          const stock = row.data
          const positive = (stock?.changePercent || 0) >= 0
          const TrendIcon = positive ? ArrowUpRight : ArrowDownRight

          return (
            <article key={row.symbol} className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{stock?.symbol || row.symbol}</h2>
                    {bestMomentum === stock?.symbol && (
                      <span className="badge-success">Momentum lead</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 truncate max-w-72">{stock?.name || (row.loading ? 'Loading...' : 'Unable to load')}</p>
                </div>
                <button
                  onClick={() => setSymbols(prev => prev.filter(symbol => symbol !== row.symbol))}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  aria-label={`Remove ${row.symbol}`}
                >
                  <X size={16} />
                </button>
              </div>

              {row.loading ? (
                <div className="space-y-3">
                  <div className="h-8 skeleton" />
                  <div className="h-20 skeleton" />
                </div>
              ) : stock ? (
                <>
                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <div className="text-3xl font-bold text-slate-950 dark:text-white">{formatMoney(stock.price, stock.currency || 'USD')}</div>
                      <div className={`flex items-center text-sm font-semibold mt-1 ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        <TrendIcon size={16} />
                        {positive ? '+' : ''}{stock.changePercent?.toFixed(2) || '0.00'}%
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{stock.provider || 'Provider'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Market Cap" value={formatCompact(stock.marketCap)} />
                    <Metric label="P/E" value={stock.peRatio?.toFixed(2) || 'N/A'} />
                    <Metric label="EPS" value={stock.eps?.toFixed(2) || 'N/A'} />
                    <Metric label="Volume" value={formatCompact(stock.volume)} />
                    <Metric label="52W Low" value={formatMoney(stock.fiftyTwoWeekLow, stock.currency || 'USD')} />
                    <Metric label="52W High" value={formatMoney(stock.fiftyTwoWeekHigh, stock.currency || 'USD')} />
                  </div>

                  <div className="flex gap-2 mt-5">
                    <Link to={`/stock/${stock.symbol}`} className="btn-secondary flex-1">Research</Link>
                    <Link to={`/simulator?symbol=${encodeURIComponent(stock.symbol)}`} className="btn-primary flex-1">
                      <WalletCards size={16} />
                      Simulate
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-sm text-red-500">No data returned for this symbol.</div>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-100 dark:border-slate-800 p-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="font-bold text-slate-950 dark:text-white mt-1">{value}</div>
    </div>
  )
}
