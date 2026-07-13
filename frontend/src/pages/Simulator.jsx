import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Briefcase,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { aiApi, stockApi } from '../services/api'

const STORAGE_KEY = 'alphalens-simulator-v1'
const STARTING_CASH = 100000

const createDefaultState = () => ({
  cash: STARTING_CASH,
  holdings: {},
  trades: [],
})

const loadSimulatorState = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return createDefaultState()
    const parsed = JSON.parse(stored)
    return {
      cash: Number.isFinite(parsed.cash) ? parsed.cash : STARTING_CASH,
      holdings: parsed.holdings && typeof parsed.holdings === 'object' ? parsed.holdings : {},
      trades: Array.isArray(parsed.trades) ? parsed.trades : [],
    }
  } catch {
    return createDefaultState()
  }
}

export default function Simulator() {
  const [searchParams] = useSearchParams()
  const initialSymbol = searchParams.get('symbol') || ''
  const [state, setState] = useState(loadSimulatorState)
  const [query, setQuery] = useState(initialSymbol)
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol.toUpperCase())
  const [quantity, setQuantity] = useState('1')
  const [side, setSide] = useState('buy')
  const [analysisResult, setAnalysisResult] = useState(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const { data: suggestions = [], isFetching: searching } = useQuery({
    queryKey: ['simulator-search', query],
    queryFn: () => stockApi.search(query).then(r => r.data.data || []),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  })

  const { data: selectedQuote, isFetching: loadingQuote } = useQuery({
    queryKey: ['simulator-quote', selectedSymbol],
    queryFn: () => stockApi.getDetails(selectedSymbol).then(r => r.data.data),
    enabled: !!selectedSymbol,
    staleTime: 30 * 1000,
  })

  const analysisMutation = useMutation({
    mutationFn: (payload) => aiApi.analyzeSimulation(payload).then(r => r.data.data),
    onSuccess: (data) => {
      setAnalysisResult(data)
      toast.success('AI simulator analysis ready')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to analyze simulation')
    },
  })

  const holdingSymbols = Object.keys(state.holdings)
  const holdingQuoteQueries = useQueries({
    queries: holdingSymbols.map(symbol => ({
      queryKey: ['simulator-holding-quote', symbol],
      queryFn: () => stockApi.getDetails(symbol).then(r => r.data.data),
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    })),
  })

  const quotesBySymbol = useMemo(() => {
    return holdingSymbols.reduce((acc, symbol, index) => {
      acc[symbol] = holdingQuoteQueries[index]?.data
      return acc
    }, {})
  }, [holdingQuoteQueries, holdingSymbols])

  const portfolioRows = holdingSymbols.map(symbol => {
    const holding = state.holdings[symbol]
    const quote = quotesBySymbol[symbol]
    const currentPrice = quote?.price ?? holding.avgCost
    const invested = holding.shares * holding.avgCost
    const currentValue = holding.shares * currentPrice
    const pnl = currentValue - invested
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0

    return {
      symbol,
      name: quote?.name || holding.name || symbol,
      currency: quote?.currency || holding.currency || 'V$',
      shares: holding.shares,
      avgCost: holding.avgCost,
      currentPrice,
      invested,
      currentValue,
      pnl,
      pnlPercent,
    }
  })

  const investedValue = portfolioRows.reduce((sum, row) => sum + row.invested, 0)
  const currentValue = portfolioRows.reduce((sum, row) => sum + row.currentValue, 0)
  const unrealizedPnl = currentValue - investedValue
  const totalEquity = state.cash + currentValue
  const totalReturnPercent = STARTING_CASH > 0 ? ((totalEquity - STARTING_CASH) / STARTING_CASH) * 100 : 0

  const formatMoney = (value, currency = 'V$') => {
    if (value == null || Number.isNaN(value)) return 'N/A'
    if (currency === 'V$') return `V$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const executeTrade = () => {
    if (!selectedQuote?.price || !selectedSymbol) {
      toast.error('Search and select a valid stock first.')
      return
    }

    const shares = Number(quantity)
    if (!Number.isFinite(shares) || shares <= 0) {
      toast.error('Enter a valid quantity.')
      return
    }

    const symbol = selectedQuote.symbol || selectedSymbol
    const price = selectedQuote.price
    const orderValue = shares * price
    const currentHolding = state.holdings[symbol]

    if (side === 'buy' && orderValue > state.cash) {
      toast.error('Not enough virtual cash for this trade.')
      return
    }

    if (side === 'sell' && (!currentHolding || currentHolding.shares < shares)) {
      toast.error('You do not own enough shares to sell.')
      return
    }

    setState(prev => {
      const holdings = { ...prev.holdings }
      let cash = prev.cash

      if (side === 'buy') {
        const existing = holdings[symbol]
        const oldShares = existing?.shares || 0
        const oldValue = oldShares * (existing?.avgCost || 0)
        const newShares = oldShares + shares

        holdings[symbol] = {
          symbol,
          name: selectedQuote.name || symbol,
          currency: selectedQuote.currency || 'V$',
          shares: newShares,
          avgCost: (oldValue + orderValue) / newShares,
        }
        cash -= orderValue
      } else {
        const remainingShares = currentHolding.shares - shares
        cash += orderValue
        if (remainingShares <= 0.000001) {
          delete holdings[symbol]
        } else {
          holdings[symbol] = {
            ...currentHolding,
            shares: remainingShares,
          }
        }
      }

      return {
        cash,
        holdings,
        trades: [
          {
            id: `${Date.now()}-${symbol}`,
            side,
            symbol,
            name: selectedQuote.name || symbol,
            shares,
            price,
            value: orderValue,
            currency: selectedQuote.currency || 'V$',
            createdAt: new Date().toISOString(),
          },
          ...prev.trades,
        ].slice(0, 100),
      }
    })

    toast.success(`${side === 'buy' ? 'Bought' : 'Sold'} ${shares} ${symbol} in simulator`)
  }

  const resetSimulator = () => {
    setState(createDefaultState())
    toast.success('Simulator reset to starting cash')
  }

  const analyzeVirtualTrade = () => {
    if (!selectedQuote?.price || !selectedSymbol) {
      toast.error('Search and select a valid stock first.')
      return
    }

    const shares = Number(quantity)
    if (!Number.isFinite(shares) || shares <= 0) {
      toast.error('Enter a valid quantity.')
      return
    }

    analysisMutation.mutate({
      symbol: selectedQuote.symbol || selectedSymbol,
      side,
      quantity: shares,
      orderValue: shares * selectedQuote.price,
      learningMode: 'beginner',
    })
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-3">
              <ShieldCheck size={14} />
              Virtual market simulator
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              Practice investing without real money.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 max-w-3xl">
              Search any supported global ticker, place simulated buy or sell orders, track profit and loss, and learn how price movement affects a portfolio.
            </p>
          </div>
          <button
            onClick={resetSimulator}
            className="btn-secondary self-start"
          >
            <RotateCcw size={16} />
            Reset simulator
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Virtual Cash</div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">{formatMoney(state.cash)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Holdings Value</div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">{formatMoney(currentValue)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Total Equity</div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">{formatMoney(totalEquity)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Total Return</div>
          <div className={`text-2xl font-bold ${totalReturnPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[390px_minmax(0,1fr)] gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-lg text-slate-950 dark:text-white flex items-center gap-2 mb-5">
            <WalletCards size={18} className="text-emerald-500" />
            Place virtual order
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Search global instrument</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="input pl-9"
                  placeholder="AAPL, RELIANCE.NS, TSLA, VOD.L..."
                />
              </div>
              {query.trim().length >= 2 && (
                <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  {searching ? (
                    <div className="p-3 text-sm text-slate-500">Searching markets...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.slice(0, 8).map(stock => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setSelectedSymbol(stock.symbol)
                          setQuery(stock.symbol)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {stock.symbol?.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{stock.symbol}</div>
                          <div className="text-xs text-slate-500 truncate">{stock.name}</div>
                        </div>
                        <span className="text-xs text-slate-400">{stock.exchange || stock.type}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-slate-500">No matches yet. Try the exact ticker symbol.</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSide('buy')}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                Buy
              </button>
              <button
                onClick={() => setSide('sell')}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                Sell
              </button>
            </div>

            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="input"
              />
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">Selected</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedQuote?.symbol || selectedSymbol || 'None'}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">Last price</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {loadingQuote ? 'Loading...' : selectedQuote ? formatMoney(selectedQuote.price, selectedQuote.currency) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Est. order value</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedQuote ? formatMoney(Number(quantity || 0) * selectedQuote.price, selectedQuote.currency) : 'N/A'}
                </span>
              </div>
            </div>

            <button
              onClick={executeTrade}
              disabled={!selectedQuote || loadingQuote}
              className="btn-primary w-full disabled:opacity-50"
            >
              {side === 'buy' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {side === 'buy' ? 'Buy with virtual cash' : 'Sell holding'}
            </button>

            <button
              onClick={analyzeVirtualTrade}
              disabled={!selectedQuote || loadingQuote || analysisMutation.isPending}
              className="btn-secondary w-full disabled:opacity-50"
            >
              <Brain size={16} />
              {analysisMutation.isPending ? 'Analyzing setup...' : 'AI analyze before real money'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="font-semibold text-lg text-slate-950 dark:text-white flex items-center gap-2">
              <Briefcase size={18} className="text-emerald-500" />
              Portfolio
            </h2>
            <div className={`text-sm font-semibold ${unrealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              Unrealized P/L: {unrealizedPnl >= 0 ? '+' : ''}{formatMoney(unrealizedPnl)}
            </div>
          </div>

          {portfolioRows.length === 0 ? (
            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center">
              <BarChart3 size={30} className="text-slate-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No simulated holdings yet</h3>
              <p className="text-sm text-slate-500">Search a stock, buy it with virtual cash, then watch your simulator P/L move with market prices.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 pr-4">Instrument</th>
                    <th className="py-3 pr-4 text-right">Qty</th>
                    <th className="py-3 pr-4 text-right">Avg</th>
                    <th className="py-3 pr-4 text-right">Last</th>
                    <th className="py-3 pr-4 text-right">Value</th>
                    <th className="py-3 text-right">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioRows.map(row => (
                    <tr key={row.symbol} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-4 pr-4">
                        <Link to={`/stock/${row.symbol}`} className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600">
                          {row.symbol}
                        </Link>
                        <div className="text-xs text-slate-500 truncate max-w-56">{row.name}</div>
                      </td>
                      <td className="py-4 pr-4 text-right font-mono">{row.shares.toFixed(2)}</td>
                      <td className="py-4 pr-4 text-right font-mono">{formatMoney(row.avgCost, row.currency)}</td>
                      <td className="py-4 pr-4 text-right font-mono">{formatMoney(row.currentPrice, row.currency)}</td>
                      <td className="py-4 pr-4 text-right font-mono">{formatMoney(row.currentValue, row.currency)}</td>
                      <td className={`py-4 text-right font-mono font-semibold ${row.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {row.pnl >= 0 ? '+' : ''}{formatMoney(row.pnl, row.currency)}
                        <div className="text-xs">{row.pnl >= 0 ? '+' : ''}{row.pnlPercent.toFixed(2)}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {analysisResult?.analysis && (
        <section className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="font-semibold text-xl text-slate-950 dark:text-white flex items-center gap-2">
                <Sparkles size={20} className="text-emerald-500" />
                AI simulator decision lab
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Educational analysis for {analysisResult.symbol}. This helps you learn before using a real broker.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge-success">{analysisResult.analysis.educationalVerdict}</span>
              <span className="badge-neutral">{analysisResult.analysis.likelyDirection}</span>
              <span className="badge-neutral">Confidence: {analysisResult.analysis.confidence}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl bg-emerald-50/60 dark:bg-slate-950 border border-emerald-100 dark:border-slate-800 p-5">
              <h3 className="font-semibold text-slate-950 dark:text-white mb-2">Plain-English read</h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {analysisResult.analysis.plainEnglishSummary}
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Why it moved recently</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">{analysisResult.analysis.whatMovedItRecently}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-100 dark:border-slate-800 p-5">
              <h3 className="font-semibold text-slate-950 dark:text-white mb-3">Virtual impact</h3>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>{analysisResult.analysis.simulationImpact?.virtualAmount}</p>
                <p>{analysisResult.analysis.simulationImpact?.positionSizeComment}</p>
                <p className="text-red-600 dark:text-red-400">{analysisResult.analysis.simulationImpact?.riskIfFalls5Percent}</p>
                <p className="text-emerald-600 dark:text-emerald-400">{analysisResult.analysis.simulationImpact?.gainIfRises5Percent}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <AnalysisList title="Why it may rise" items={analysisResult.analysis.whyItMayRise} tone="green" />
            <AnalysisList title="Why it may fall" items={analysisResult.analysis.whyItMayFall} tone="red" />
            <AnalysisList title="Missing data to check" items={analysisResult.analysis.missingDataToCheck} />
            <AnalysisList title="Before real money" items={analysisResult.analysis.beforeRealMoneyChecklist} />
          </div>

          <p className="text-xs text-slate-500 mt-5">{analysisResult.analysis.notFinancialAdvice}</p>
        </section>
      )}

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-lg text-slate-950 dark:text-white flex items-center gap-2 mb-5">
          <History size={18} className="text-emerald-500" />
          Trade history
        </h2>
        {state.trades.length === 0 ? (
          <p className="text-sm text-slate-500">Your simulated trades will appear here.</p>
        ) : (
          <div className="grid gap-3">
            {state.trades.slice(0, 12).map(trade => (
              <div key={trade.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${trade.side === 'buy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {trade.side}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{trade.symbol}</span>
                    <span className="text-sm text-slate-500">{trade.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(trade.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm font-mono text-slate-700 dark:text-slate-300">
                  {trade.shares} x {formatMoney(trade.price, trade.currency)} = {formatMoney(trade.value, trade.currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AnalysisList({ title, items = [], tone = 'neutral' }) {
  const markerClass = tone === 'green'
    ? 'bg-emerald-500'
    : tone === 'red'
      ? 'bg-red-500'
      : 'bg-slate-400'

  return (
    <div className="rounded-2xl border border-emerald-100 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
      <h3 className="font-semibold text-slate-950 dark:text-white mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${markerClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
