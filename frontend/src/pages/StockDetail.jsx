import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { stockApi, aiApi, watchlistApi, userApi } from '../services/api'
import { useUser } from '@clerk/clerk-react'
import StockChart from '../components/StockChart'
import MetricCard from '../components/MetricCard'
import toast from 'react-hot-toast'
import {
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Sparkles,
  TrendingUp,
  Search,
  BarChart3,
  Activity,
  Building2,
  Gauge,
  LineChart,
  Newspaper,
} from 'lucide-react'

export default function StockDetail() {
  const { symbol } = useParams()
  const { isSignedIn } = useUser()
  const [range, setRange] = useState('1mo')

  const { data: prefs } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => userApi.getPreferences().then(r => r.data.data),
    enabled: isSignedIn,
  })
  const mode = prefs?.learningMode || 'beginner'

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
    if (!isSignedIn) {
      toast.error('Please sign in to save stocks to your watchlist.')
      return
    }
    try {
      await watchlistApi.add(symbol)
      toast.success(`${symbol} added to watchlist`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add')
    }
  }

  if (loadingDetails) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BarChart3 size={24} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading market data...</p>
        </div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
          <Search size={28} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Stock not found</h2>
        <p className="text-slate-500 mb-8 text-sm">We couldn't find data for "{symbol}". Check the symbol and try again.</p>
        <Link to="/search" className="btn-primary">Explore Markets</Link>
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
  const formatPercent = (v) => v == null ? 'N/A' : `${(v * 100).toFixed(2)}%`
  
  const isPositive = details.change >= 0
  const changeColor = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
  const changeBg = isPositive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight

  const timeframes = ['1d', '5d', '1mo', '6mo', '1y']
  const dayRangeWidth = details.dayHigh && details.dayLow && details.price
    ? Math.min(100, Math.max(0, ((details.price - details.dayLow) / (details.dayHigh - details.dayLow)) * 100))
    : 0
  const weekRangeWidth = details.fiftyTwoWeekHigh && details.fiftyTwoWeekLow && details.price
    ? Math.min(100, Math.max(0, ((details.price - details.fiftyTwoWeekLow) / (details.fiftyTwoWeekHigh - details.fiftyTwoWeekLow)) * 100))
    : 0
  const valuationLabel = details.peRatio == null
    ? 'Insufficient data'
    : details.peRatio > 40
      ? 'Premium valuation'
      : details.peRatio > 20
        ? 'Balanced valuation'
        : 'Value zone'
  const momentumLabel = details.changePercent == null
    ? 'Neutral'
    : details.changePercent > 1
      ? 'Strong upside'
      : details.changePercent < -1
        ? 'Under pressure'
        : 'Stable move'

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xl text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
              {details.symbol?.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{details.symbol}</h1>
                <button
                  onClick={handleAddWatchlist}
                  className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors"
                  title="Add to watchlist"
                >
                  <Star size={18} />
                </button>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1">{details.name}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                {details.exchange && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                    <Building2 size={12} />
                    {details.exchange}
                  </span>
                )}
                {details.quoteType && (
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">{details.quoteType}</span>
                )}
                {details.currency && (
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">{details.currency}</span>
                )}
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${mode === 'beginner' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {mode === 'beginner' ? '📖 Beginner Mode' : '🚀 Pro Mode'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {mode === 'beginner' ? 'Simplified insights' : 'Advanced metrics'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(details.price)}
            </div>
            <div className={`flex items-center gap-2 sm:justify-end mt-2`}>
              <span className={`font-semibold flex items-center ${changeColor}`}>
                <ChangeIcon size={18} className="mr-1" />
                {formatCurrency(Math.abs(details.change))}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${changeBg}`}>
                {isPositive ? '+' : ''}{details.changePercent?.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Market Cap</div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">{formatCompact(details.marketCap)}</div>
          <div className="text-xs text-slate-500 mt-1">Company market value</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Day Range</div>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
            <span>{formatCurrency(details.dayLow)}</span>
            <span>{formatCurrency(details.dayHigh)}</span>
          </div>
          <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${dayRangeWidth}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Momentum</div>
          <div className={`text-2xl font-bold ${changeColor}`}>{momentumLabel}</div>
          <div className="text-xs text-slate-500 mt-1">Based on today&apos;s move</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Valuation</div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">{valuationLabel}</div>
          <div className="text-xs text-slate-500 mt-1">Using trailing P/E</div>
        </div>
      </div>

      {/* Chart + Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              Price Action
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {timeframes.map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    range === r
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <StockChart data={chartData} loading={loadingChart} />
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white pb-1">Key Statistics</h2>
          <MetricCard label={mode === 'beginner' ? 'Market Value' : 'Market Cap'} value={formatCompact(details.marketCap)} icon={BarChart3} />
          <MetricCard
            label={mode === 'beginner' ? 'Price-to-Earnings' : 'P/E Ratio'}
            value={details.peRatio?.toFixed(2) || 'N/A'}
            explanation={mode === 'beginner' ? 'How much you pay for each dollar of profit' : ''}
            icon={TrendingUp}
          />
          <MetricCard label="EPS" value={details.eps?.toFixed(2) || 'N/A'} explanation={mode === 'beginner' ? 'Profit per share' : ''} />
          <MetricCard label="Volume" value={formatCompact(details.volume)} />
          <MetricCard label="Avg Volume" value={formatCompact(details.avgVolume)} icon={Activity} />
          <MetricCard label="Open" value={formatCurrency(details.open)} />
          <MetricCard label="Prev Close" value={formatCurrency(details.previousClose)} />
          <MetricCard label="Beta" value={details.beta?.toFixed(2) || 'N/A'} explanation={mode === 'beginner' ? 'How volatile the stock is versus the market' : ''} icon={Gauge} />

          <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">52 Week Range</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">Low</span>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">{formatCurrency(details.fiftyTwoWeekLow)}</span>
            </div>
            {details.fiftyTwoWeekHigh && details.fiftyTwoWeekLow && details.price && (
              <div className="py-2">
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${weekRangeWidth}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-500">High</span>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">{formatCurrency(details.fiftyTwoWeekHigh)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <LineChart size={18} className="text-indigo-500" />
            Fundamentals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard label="P/E Ratio" value={details.peRatio?.toFixed(2) || 'N/A'} />
            <MetricCard label="EPS" value={details.eps?.toFixed(2) || 'N/A'} />
            <MetricCard label="Dividend Yield" value={formatPercent(details.dividendYield)} />
            <MetricCard label="Volume / Avg" value={`${formatCompact(details.volume)} / ${formatCompact(details.avgVolume)}`} />
            <MetricCard label="Day Low" value={formatCurrency(details.dayLow)} />
            <MetricCard label="Day High" value={formatCurrency(details.dayHigh)} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <Newspaper size={18} className="text-indigo-500" />
            Market Context
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Session read</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {details.changePercent >= 0
                  ? `${details.symbol} is trading higher today with buyers supporting the move.`
                  : `${details.symbol} is trading lower today, so watch support near the day low.`}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Watch next</div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Compare price action against volume, the 52 week range, valuation, and upcoming earnings before making a decision.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {loadingInsight ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain size={24} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Generating AI Analysis...</p>
        </div>
      ) : insight?.insight ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
            AI Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary Card */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Brain size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Executive Summary</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{insight.insight.summary}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Driver</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">{insight.insight.reason}</p>
              </div>
            </div>

            {/* Risk & Sentiment */}
            <div className="space-y-4">
              <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 border-l-4 ${
                insight.insight.risk === 'Low' ? 'border-l-emerald-500' :
                insight.insight.risk === 'High' ? 'border-l-red-500' : 'border-l-amber-500'
              }`}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Risk Level</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{insight.insight.risk}</div>
              </div>

              <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 border-l-4 ${
                insight.insight.sentiment === 'Bullish' ? 'border-l-emerald-500' :
                insight.insight.sentiment === 'Bearish' ? 'border-l-red-500' : 'border-l-amber-500'
              }`}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Market Sentiment</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{insight.insight.sentiment}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
