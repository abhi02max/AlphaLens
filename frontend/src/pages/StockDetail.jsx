import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { stockApi, aiApi, watchlistApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StockChart from '../components/StockChart'
import MetricCard from '../components/MetricCard'
import toast from 'react-hot-toast'

export default function StockDetail() {
  const { symbol } = useParams()
  const { user, isAuthenticated } = useAuth()
  const mode = user?.learningMode || 'beginner'
  const [range, setRange] = useState('1mo')

  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => stockApi.getDetails(symbol).then(r => r.data.data),
    enabled: !!symbol,
    retry: false,
  })

  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ['chart', symbol, range],
    queryFn: () => stockApi.getChart(symbol, range).then(r => r.data.data),
    enabled: !!symbol,
  })

  const { data: insight, isLoading: loadingInsight } = useQuery({
    queryKey: ['insight', symbol, mode],
    queryFn: () => aiApi.getInsight(symbol, mode).then(r => r.data.data),
    enabled: !!symbol,
  })

  const handleAddWatchlist = async () => {
    try {
      await watchlistApi.add(symbol)
      toast.success(`${symbol} added to watchlist`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add')
    }
  }

  if (loadingDetails) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">❓</div>
        <h2 className="text-xl font-bold mb-2">Stock not found</h2>
        <p className="text-dark-500 mb-4">Check the symbol and try again</p>
        <Link to="/search" className="btn-primary">Search Stocks</Link>
      </div>
    )
  }

  const formatCurrency = (v) => {
    if (v == null) return 'N/A'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: details.currency || 'USD' }).format(v)
  }
  const formatCompact = (v) => {
    if (v == null) return 'N/A'
    if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T'
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
    return v.toLocaleString()
  }
  const changeColor = details.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  const changeIcon = details.change >= 0 ? '▲' : '▼'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{details.symbol}</h1>
              {isAuthenticated && (
                <button onClick={handleAddWatchlist} className="btn-ghost p-1.5 rounded-lg text-lg" title="Add to watchlist">+</button>
              )}
            </div>
            <p className="text-dark-500 dark:text-dark-400">{details.name}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(details.price)}</div>
            <div className={`text-lg font-medium ${changeColor}`}>
              {changeIcon} {formatCurrency(details.change)} ({details.changePercent?.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Mode badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className={`badge ${mode === 'beginner' ? 'badge-info' : 'badge-warning'}`}>
            {mode === 'beginner' ? '📖 Beginner Mode' : '🚀 Pro Mode'}
          </span>
          <span className="text-xs text-dark-400">
            {mode === 'beginner' ? 'Simplified explanations' : 'Advanced metrics'}
          </span>
        </div>
      </div>

      {/* Main grid: Chart + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Price Chart</h2>
            <div className="flex gap-1">
              {['1d','5d','1mo','6mo','1y'].map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    range === r ? 'bg-primary-500 text-white' : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-700'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <StockChart data={chartData} loading={loadingChart} />
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <MetricCard label={mode === 'beginner' ? 'Market Value' : 'Market Cap'} value={formatCompact(details.marketCap)} />
          <MetricCard label={mode === 'beginner' ? 'Price-to-Earnings' : 'P/E Ratio'} value={details.peRatio?.toFixed(2) || 'N/A'}
            explanation={mode === 'beginner' ? 'How much you pay for each dollar of profit' : ''} />
          <MetricCard label="EPS" value={details.eps?.toFixed(2) || 'N/A'}
            explanation={mode === 'beginner' ? 'Profit per share' : ''} />
          <MetricCard label="Volume" value={formatCompact(details.volume)} />
          <div className="card p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark-500">52W High</span>
              <span className="font-semibold">{formatCurrency(details.fiftyTwoWeekHigh)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-dark-500">52W Low</span>
              <span className="font-semibold">{formatCurrency(details.fiftyTwoWeekLow)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {loadingInsight ? (
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-primary-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-dark-400">Analyzing with AI...</p>
        </div>
      ) : insight?.insight ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💡</span>
              <h3 className="font-semibold">AI Summary</h3>
            </div>
            <p className="text-sm text-dark-700 dark:text-dark-300 leading-relaxed">{insight.insight.summary}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`card p-5 ${insight.insight.risk === 'Low' ? 'border-l-4 border-l-green-500' : insight.insight.risk === 'High' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-yellow-500'}`}>
              <div className="text-sm text-dark-500 mb-1">Risk</div>
              <div className="text-lg font-bold">{insight.insight.risk}</div>
              <div className="text-xs text-dark-400 mt-1">{insight.insight.reason?.slice(0, 60)}...</div>
            </div>
            <div className={`card p-5 ${insight.insight.sentiment === 'Bullish' ? 'border-l-4 border-l-green-500' : insight.insight.sentiment === 'Bearish' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-yellow-500'}`}>
              <div className="text-sm text-dark-500 mb-1">Sentiment</div>
              <div className="text-lg font-bold">{insight.insight.sentiment}</div>
              <div className="text-xs text-dark-400 mt-1">Market outlook</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}