import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { stockApi, aiApi, watchlistApi } from '../services/api'
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
  WalletCards,
} from 'lucide-react'

const LIVE_QUOTE_REFRESH_MS = 5000
const LIVE_CHART_REFRESH_MS = 15000

export default function StockDetail() {
  const { symbol } = useParams()
  const { isSignedIn } = useUser()
  const [range, setRange] = useState('1d')
  const [chartType, setChartType] = useState('line')

  const { data: details, isLoading: loadingDetails, isFetching: refreshingDetails } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => stockApi.getDetails(symbol).then(r => r.data.data),
    enabled: !!symbol,
    retry: false,
    refetchInterval: LIVE_QUOTE_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })

  const { data: chartData, isLoading: loadingChart, isFetching: refreshingChart } = useQuery({
    queryKey: ['chart', symbol, range],
    queryFn: () => stockApi.getChart(symbol, range).then(r => r.data.data),
    enabled: !!symbol,
    refetchInterval: range === '1d' || range === '5d' ? LIVE_CHART_REFRESH_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })

  const { data: connectedNews = [], isLoading: loadingNews } = useQuery({
    queryKey: ['stock-news', symbol],
    queryFn: () => stockApi.getNews(symbol).then(r => r.data.data || []),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: professionalReport } = useQuery({
    queryKey: ['professional-report', symbol],
    queryFn: () => aiApi.getProfessionalReport(symbol).then(r => r.data.data),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  })

  const liveChartData = useMemo(() => {
    if (!details?.price || !chartData?.length) return chartData
    if (range !== '1d' && range !== '5d') return chartData

    const latestPoint = {
      date: details.lastUpdated || new Date().toISOString(),
      open: details.open ?? details.price,
      high: Math.max(details.dayHigh ?? details.price, details.price),
      low: Math.min(details.dayLow ?? details.price, details.price),
      close: details.price,
      volume: details.volume,
      provider: details.provider,
      freshness: details.freshness,
      liveQuotePoint: true,
    }

    const withoutLivePoint = chartData.filter(point => !point.liveQuotePoint)
    return [...withoutLivePoint, latestPoint]
  }, [chartData, details, range])

  const technicalSnapshot = useMemo(() => buildTechnicalSnapshot(liveChartData), [liveChartData])

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
            <BarChart3 size={24} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading market data...</p>
        </div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center max-w-lg mx-auto shadow-sm">
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
    if (v == null) return 'Not reported'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: details.currency || 'USD' }).format(v)
  }
  const formatCompact = (v) => {
    if (v == null) return 'Not reported'
    if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T'
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
    return v.toLocaleString()
  }
  const formatPercent = (v) => v == null ? 'Not reported' : `${(v * 100).toFixed(2)}%`
  
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
  const localReport = buildLocalMarketReport(details, {
    formatCurrency,
    formatCompact,
    valuationLabel,
    momentumLabel,
  })
  const marketReport = professionalReport?.report || localReport
  const newsAnalysis = (marketReport.newsCatalystSummary || []).filter(item =>
    item?.headline && !/no verified|enrichment pending|market item unavailable/i.test(item.headline)
  )
  const sourceNews = connectedNews.length ? connectedNews : (professionalReport?.news || [])
  const financialNews = sourceNews.length
    ? sourceNews.map((item, index) => ({
        ...item,
        headline: item.title,
        whyItMatters: newsAnalysis[index]?.whyItMatters || 'Review the headline alongside price, volume, and sector-relative follow-through.',
        likelyImpact: newsAnalysis[index]?.likelyImpact || 'Monitor sentiment, valuation sensitivity, and continuation risk.',
      }))
    : newsAnalysis

  const lastUpdatedText = details.lastUpdated
    ? new Date(details.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xl text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
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
                <Link
                  to={`/simulator?symbol=${encodeURIComponent(details.symbol)}`}
                  className="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
                  title="Simulate trade"
                >
                  <WalletCards size={18} />
                </Link>
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
                {details.provider && (
                  <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {details.provider}{details.freshness ? ` · ${details.freshness}` : ''}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 text-white">
                  <span className={`h-1.5 w-1.5 rounded-full bg-white ${refreshingDetails ? 'animate-ping' : ''}`} />
                  Live refresh {lastUpdatedText ? ` · ${lastUpdatedText}` : ''}
                </span>
                {details.dataCompleteness && (
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                    Data {details.dataCompleteness.percent}%
                  </span>
                )}
              </div>
              
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Legendary Pro Workspace
                </span>
                <span className="text-xs text-slate-400 font-medium">Institutional market view</span>
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Market Cap</div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">{formatCompact(details.marketCap)}</div>
          <div className="text-xs text-slate-500 mt-1">Company market value</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Day Range</div>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
            <span>{formatCurrency(details.dayLow)}</span>
            <span>{formatCurrency(details.dayHigh)}</span>
          </div>
          <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dayRangeWidth}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Momentum</div>
          <div className={`text-2xl font-bold ${changeColor}`}>{momentumLabel}</div>
          <div className="text-xs text-slate-500 mt-1">Based on today&apos;s move</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Valuation</div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">{valuationLabel}</div>
          <div className="text-xs text-slate-500 mt-1">Using trailing P/E</div>
        </div>
      </div>

      {/* Chart + Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              Price Action
              {(refreshingDetails || refreshingChart) && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">updating</span>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {[
                  { value: 'line', label: 'Line' },
                  { value: 'candles', label: 'Candles' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setChartType(option.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      chartType === option.value
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
          </div>
          <StockChart data={liveChartData} loading={loadingChart} chartType={chartType} />
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white pb-1">Key Statistics</h2>
          {details.providersUsed?.length > 1 && (
            <div className="text-xs leading-relaxed text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
              WalletStack merged live data from {details.providersUsed.join(', ')} to reduce missing metrics.
            </div>
          )}
          <MetricCard label="Market Cap" value={formatCompact(details.marketCap)} icon={BarChart3} />
          <MetricCard
            label="P/E Ratio"
            value={details.peRatio?.toFixed(2) || 'Not reported'}
            icon={TrendingUp}
          />
          <MetricCard label="EPS" value={details.eps?.toFixed(2) || 'Not reported'} />
          <MetricCard label="Volume" value={formatCompact(details.volume)} />
          <MetricCard label="Avg Volume" value={formatCompact(details.avgVolume)} icon={Activity} />
          <MetricCard label="Open" value={formatCurrency(details.open)} />
          <MetricCard label="Prev Close" value={formatCurrency(details.previousClose)} />
          <MetricCard label="Beta" value={details.beta?.toFixed(2) || 'Not reported'} icon={Gauge} />

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
                    className="h-full bg-emerald-500 rounded-full"
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

      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              Market Desk Signals
            </h2>
            <p className="text-xs text-slate-500 mt-1">Calculated from the active price and volume stream</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live technicals
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <SignalMetric label="Trend regime" value={technicalSnapshot.trend} tone={technicalSnapshot.trendTone} />
          <SignalMetric label="RSI (14)" value={technicalSnapshot.rsi} tone={technicalSnapshot.rsiTone} />
          <SignalMetric label="EMA (20)" value={technicalSnapshot.ema20 == null ? 'Not reported' : formatCurrency(technicalSnapshot.ema20)} />
          <SignalMetric label="Relative volume" value={technicalSnapshot.relativeVolume} tone={technicalSnapshot.volumeTone} />
          <SignalMetric label="Realized vol" value={technicalSnapshot.realizedVol} />
          <SignalMetric label="VWAP" value={technicalSnapshot.vwap == null ? 'Not reported' : formatCurrency(technicalSnapshot.vwap)} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <LineChart size={18} className="text-emerald-500" />
            Fundamentals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard label="P/E Ratio" value={details.peRatio?.toFixed(2) || 'Not reported'} />
            <MetricCard label="EPS" value={details.eps?.toFixed(2) || 'Not reported'} />
            <MetricCard label="Dividend Yield" value={formatPercent(details.dividendYield)} />
            <MetricCard label="Volume / Avg" value={`${formatCompact(details.volume)} / ${formatCompact(details.avgVolume)}`} />
            <MetricCard label="Day Low" value={formatCurrency(details.dayLow)} />
            <MetricCard label="Day High" value={formatCurrency(details.dayHigh)} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <Newspaper size={18} className="text-emerald-500" />
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Brain size={18} className="text-emerald-500" />
              Research Toolkit
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Move from market evidence to a simulated decision without leaving the instrument workspace.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            <ToolkitLink href="#financial-news" title="Catalyst feed" body={`${financialNews.length || 0} connected market headlines`} />
            <ToolkitLink href="#ai-analysis" title="Contextual reasoning" body={`${marketReport.aiRecommendation?.confidence || 'Low'}-confidence model view`} />
            <Link to={`/simulator?symbol=${encodeURIComponent(details.symbol)}`} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 hover:border-emerald-400 transition-colors group">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Strategy lab</div>
                <ArrowUpRight size={15} className="text-slate-400 group-hover:text-emerald-500" />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Test size, entry, exit, and simulated P/L</p>
            </Link>
            <Link to={`/simulator?symbol=${encodeURIComponent(details.symbol)}`} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 hover:border-emerald-400 transition-colors group">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Risk monitor</div>
                <ArrowUpRight size={15} className="text-slate-400 group-hover:text-emerald-500" />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Review exposure, downside, and exit triggers</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Professional AI Report */}
      <div className="space-y-4" id="professional-report">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
                Market Intelligence
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Trader-grade view across live metrics, price action, valuation, and connected financial news.
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              marketReport.aiRecommendation?.view === 'RELEASE'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
            }`}>
              AI Recommendation: {marketReport.aiRecommendation?.view}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Brain size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Executive Snapshot</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {marketReport.executiveSnapshot}
              </p>

              <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Stock Summary</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {marketReport.stockSummary}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {marketReport.keyMetrics?.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{item.label}</div>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-950 dark:text-white">{item.value}</div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.read}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">AI Analysis and Recommendation</div>
              <div className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold mb-3 ${
                marketReport.aiRecommendation?.view === 'RELEASE'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              }`}>
                {marketReport.aiRecommendation?.view}
              </div>
              <div className="text-2xl font-bold text-slate-950 dark:text-white">
                {marketReport.aiRecommendation?.confidence}
              </div>
              <div className="text-sm text-slate-500 mt-1">{marketReport.aiRecommendation?.timeHorizon}</div>
              <div className="mt-5 space-y-2">
                {marketReport.aiRecommendation?.rationale?.map((item, index) => (
                  <div key={`rationale-${index}`} className="text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportPanel id="technical-read" title="Technical / Momentum Read" items={[
              marketReport.technicalMomentumRead?.trend,
              marketReport.technicalMomentumRead?.momentum,
              marketReport.technicalMomentumRead?.volatility,
              ...(marketReport.technicalMomentumRead?.keyLevels || []),
            ]} />
          <ReportPanel id="fundamental-read" title="Fundamental Read" items={[
              marketReport.fundamentalRead?.valuation,
              marketReport.fundamentalRead?.quality,
              marketReport.fundamentalRead?.earningsPower,
              ...(marketReport.fundamentalRead?.dataGaps || []).map(item => `Data gap: ${item}`),
            ]} />
          </div>

          <ReportPanel id="ai-analysis" title="AI Analysis" items={[
            marketReport.aiAnalysis?.pastPerformance,
            marketReport.aiAnalysis?.currentMarketConditions,
            marketReport.aiAnalysis?.fundamentalStrength,
            marketReport.aiAnalysis?.valuationRisk,
            marketReport.aiAnalysis?.momentumVolatility,
            marketReport.aiAnalysis?.sectorSentiment,
            marketReport.aiAnalysis?.forwardOutlook,
          ]} />

          <div id="financial-news" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-slate-950 dark:text-white">Financial News</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-1">News catalyst summary</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {loadingNews && financialNews.length === 0 ? 'Updating feed' : `${financialNews.length} headline${financialNews.length === 1 ? '' : 's'}`}
              </span>
            </div>
            <div className="space-y-4">
              {loadingNews && financialNews.length === 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 text-sm text-slate-500">
                  Loading connected market headlines...
                </div>
              )}
              {!loadingNews && financialNews.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-5 text-sm text-slate-500">
                  No market-moving company, sector, or macro headlines are connected for this symbol yet.
                </div>
              )}
              {financialNews.map((item, index) => (
                <div key={`${item.headline}-${index}`} className="border-t first:border-t-0 border-slate-100 dark:border-slate-800 pt-4 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{item.headline}</div>
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Open</a>}
                  </div>
                  {(item.publisher || item.publishedAt) && (
                    <div className="text-xs text-slate-500 mt-1">{item.publisher || 'Market source'}{item.publishedAt ? ` · ${formatNewsDate(item.publishedAt)}` : ''}</div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{item.whyItMatters}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-2">Likely impact: {item.likelyImpact}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ReportPanel id="invalidation-risks" title="Invalidation Risks" items={marketReport.aiRecommendation?.invalidationRisks} />
            <ReportPanel id="watchlist-triggers" title="Watchlist Triggers" items={marketReport.watchlistTriggers} />
            <ReportPanel id="risk-factors" title="Risk Factors" items={marketReport.riskFactors} />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {marketReport.disclaimer}
          </p>
        </div>
    </div>
  )
}

function ReportPanel({ id, title, items = [] }) {
  const cleanItems = items.filter(Boolean)

  return (
    <div id={id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 scroll-mt-6">
      <h3 className="font-semibold text-slate-950 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {cleanItems.map((item, index) => (
          <div key={`${title}-${index}`} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t first:border-t-0 border-slate-100 dark:border-slate-800 pt-3 first:pt-0">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function SignalMetric({ label, value, tone = 'neutral' }) {
  const toneClass = tone === 'positive'
    ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-950 dark:text-white'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 truncate">{label}</div>
      <div className={`mt-2 text-sm font-bold font-mono truncate ${toneClass}`}>{value}</div>
    </div>
  )
}

function buildTechnicalSnapshot(data = []) {
  const rows = (data || [])
    .filter(point => point?.close != null && Number.isFinite(Number(point.close)))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const closes = rows.map(point => Number(point.close))
  const last = closes.at(-1)

  if (!last) {
    return {
      trend: 'Not reported',
      rsi: 'Not reported',
      ema20: null,
      relativeVolume: 'Not reported',
      realizedVol: 'Not reported',
      vwap: null,
    }
  }

  const window = closes.slice(-20)
  const multiplier = 2 / (window.length + 1)
  const ema20 = window.reduce((ema, close, index) => index === 0 ? close : (close * multiplier) + (ema * (1 - multiplier)), window[0])
  const changes = closes.slice(-15).map((close, index, values) => index === 0 ? 0 : close - values[index - 1]).slice(1)
  const gains = changes.filter(change => change > 0)
  const losses = changes.filter(change => change < 0).map(change => Math.abs(change))
  const averageGain = gains.reduce((sum, value) => sum + value, 0) / Math.max(changes.length, 1)
  const averageLoss = losses.reduce((sum, value) => sum + value, 0) / Math.max(changes.length, 1)
  const rsi = averageLoss === 0 ? 100 : 100 - (100 / (1 + (averageGain / averageLoss)))
  const returns = closes.slice(1).map((close, index) => ((close - closes[index]) / closes[index]) * 100).filter(Number.isFinite)
  const meanReturn = returns.reduce((sum, value) => sum + value, 0) / Math.max(returns.length, 1)
  const variance = returns.reduce((sum, value) => sum + ((value - meanReturn) ** 2), 0) / Math.max(returns.length, 1)
  const realizedVol = Math.sqrt(variance)
  const volumeRows = rows.filter(point => Number.isFinite(Number(point.volume)) && Number(point.volume) > 0)
  const currentVolume = Number(volumeRows.at(-1)?.volume)
  const averageVolume = volumeRows.slice(-21, -1).reduce((sum, point) => sum + Number(point.volume), 0) / Math.max(volumeRows.slice(-21, -1).length, 1)
  const relativeVolume = currentVolume && averageVolume ? currentVolume / averageVolume : null
  const vwapVolume = volumeRows.reduce((sum, point) => sum + (Number(point.close) * Number(point.volume)), 0)
  const vwap = volumeRows.length ? vwapVolume / volumeRows.reduce((sum, point) => sum + Number(point.volume), 0) : null

  return {
    trend: last >= ema20 ? 'Bullish' : 'Bearish',
    trendTone: last >= ema20 ? 'positive' : 'negative',
    rsi: Number.isFinite(rsi) ? rsi.toFixed(1) : 'Not reported',
    rsiTone: rsi >= 70 ? 'negative' : rsi <= 30 ? 'positive' : 'neutral',
    ema20,
    relativeVolume: relativeVolume == null ? 'Not reported' : `${relativeVolume.toFixed(2)}x`,
    volumeTone: relativeVolume >= 1.2 ? 'positive' : relativeVolume <= 0.8 ? 'negative' : 'neutral',
    realizedVol: Number.isFinite(realizedVol) ? `${realizedVol.toFixed(2)}%` : 'Not reported',
    vwap,
  }
}

function ToolkitLink({ href, title, body }) {
  return (
    <a href={href} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 hover:border-emerald-400 transition-colors group">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{title}</div>
        <ArrowUpRight size={15} className="text-slate-400 group-hover:text-emerald-500" />
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{body}</p>
    </a>
  )
}

function formatNewsDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'recent' : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function buildLocalMarketReport(details, { formatCurrency, formatCompact, valuationLabel, momentumLabel }) {
  const recommendation = details.changePercent < -1 || details.peRatio > 45 ? 'RELEASE' : 'HOLD'
  const confidence = details.dataCompleteness?.percent >= 90 ? 'Medium' : 'Low'
  const changeText = details.changePercent == null ? 'not reported' : `${details.changePercent >= 0 ? '+' : ''}${details.changePercent.toFixed(2)}%`
  const volumeRead = `${formatCompact(details.volume)} traded versus ${formatCompact(details.avgVolume)} average volume`
  const support = formatCurrency(details.dayLow)
  const resistance = formatCurrency(details.dayHigh)
  const range52 = `${formatCurrency(details.fiftyTwoWeekLow)} - ${formatCurrency(details.fiftyTwoWeekHigh)}`

  return {
    stockSummary: `${details.symbol} is trading at ${formatCurrency(details.price)} with session performance of ${changeText}. Market cap is ${formatCompact(details.marketCap)}, P/E is ${details.peRatio?.toFixed(2) || 'not reported'}, EPS is ${details.eps?.toFixed(2) || 'not reported'}, and ${volumeRead}. The 52-week range is ${range52}; tactical references are support near ${support} and resistance near ${resistance}. Institutional read: ${valuationLabel.toLowerCase()} with ${momentumLabel.toLowerCase()} momentum.`,
    executiveSnapshot: `${details.symbol} shows ${momentumLabel.toLowerCase()} price action with valuation classified as ${valuationLabel.toLowerCase()}. The current setup is anchored to the latest quote, volume, valuation, 52-week range, and mapped intraday levels.`,
    keyMetrics: [
      { label: 'Price', value: formatCurrency(details.price), read: `${changeText} session move from the latest live quote.` },
      { label: 'Market Cap', value: formatCompact(details.marketCap), read: 'Liquidity and scale context for position sizing.' },
      { label: 'P/E', value: details.peRatio?.toFixed(2) || 'Not reported', read: valuationLabel },
      { label: 'EPS', value: details.eps?.toFixed(2) || 'Not reported', read: 'Earnings power input for valuation sensitivity.' },
      { label: 'Volume', value: formatCompact(details.volume), read: volumeRead },
      { label: '52W Range', value: range52, read: 'Major range reference for momentum and mean-reversion risk.' },
    ],
    technicalMomentumRead: {
      trend: `${momentumLabel} based on the latest session move of ${changeText}.`,
      momentum: details.changePercent >= 0 ? 'Buyers are supporting the current tape pending volume confirmation.' : 'Sellers are pressing the tape; support confirmation is required.',
      volatility: `Intraday range is ${support} to ${resistance}.`,
      keyLevels: [`Support: ${support}`, `Resistance: ${resistance}`, `52-week range: ${range52}`],
    },
    fundamentalRead: {
      valuation: `${valuationLabel}; P/E ${details.peRatio?.toFixed(2) || 'not reported'}, EPS ${details.eps?.toFixed(2) || 'not reported'}.`,
      quality: `Market cap ${formatCompact(details.marketCap)}; sector and margin depth depend on connected provider coverage.`,
      earningsPower: details.eps != null ? `EPS reported at ${details.eps.toFixed(2)}.` : 'EPS is not reported by the connected feed.',
      dataGaps: ['Revenue trend', 'margin trend', 'SEC filing extraction', 'earnings revisions'],
    },
    aiAnalysis: {
      pastPerformance: `The current view uses live quote movement and mapped range behavior across the selected instrument.`,
      currentMarketConditions: `${details.symbol} is showing ${momentumLabel.toLowerCase()} with ${volumeRead}.`,
      fundamentalStrength: `Fundamental read is anchored on market cap, P/E, EPS, dividend yield, and beta where reported.`,
      valuationRisk: details.peRatio > 40 ? 'Premium valuation increases multiple-compression risk if growth expectations weaken.' : 'Valuation risk is not the dominant signal on currently reported metrics.',
      momentumVolatility: `Monitor the ${support} to ${resistance} intraday band for continuation or rejection.`,
      sectorSentiment: details.sector ? `${details.sector} sentiment should be compared with sector peers and macro risk appetite.` : 'Sector context is not reported by the connected quote feed.',
      forwardOutlook: `Current setup favors ${recommendation === 'HOLD' ? 'continued monitoring in simulation' : 'simulated risk reduction'} until verified catalysts and volume confirmation improve confidence.`,
    },
    newsCatalystSummary: [],
    aiRecommendation: {
      view: recommendation,
      confidence,
      timeHorizon: 'Medium-term',
      rationale: [
        `Price action is ${momentumLabel.toLowerCase()} with a ${changeText} session move.`,
        `Valuation screen: ${valuationLabel}; P/E ${details.peRatio?.toFixed(2) || 'not reported'}.`,
        `Volume and range context: ${volumeRead}; key band ${support} to ${resistance}.`,
      ],
      invalidationRisks: [
        'Verified news or filings materially change revenue, margin, or regulatory outlook.',
        'Price breaks mapped support/resistance with expanding volume.',
        'Provider data gaps reduce confidence in valuation or catalyst attribution.',
      ],
      monitorNext: [`Hold or break near ${support}`, `Acceptance above ${resistance}`, 'Company-specific financial news, filings, earnings, and sector catalysts'],
    },
    riskFactors: [
      'Free provider feeds may be delayed, rate-limited, or incomplete for some exchanges.',
      'AI output is scenario analysis and can be affected by missing filings or news coverage.',
      'Backtest and risk metrics are simulation tools, not guarantees of live execution outcomes.',
    ],
    watchlistTriggers: [
      `Volume expansion with price holding above ${resistance}.`,
      `Breakdown below ${support} with sustained selling pressure.`,
      'New filing, earnings release, or sector headline that changes the valuation narrative.',
    ],
    disclaimer: 'This report is analytical and educational for simulation use only; it is not licensed financial advice or a directive to trade.',
  }
}
