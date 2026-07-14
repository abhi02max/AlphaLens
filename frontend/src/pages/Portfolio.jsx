import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  CircleDollarSign,
  Landmark,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  WalletCards,
} from 'lucide-react'
import { stockApi } from '../services/api'
import { FINANCE_KEYS, formatCurrency, readStorage, userStorageKey, writeStorage } from '../utils/financeStorage'

const defaultState = { positions: [] }

const readSimulatorState = (userId) => readStorage(`alphalens-simulator-v1:${userId}`, { cash: 100000, holdings: {} })

export default function Portfolio() {
  const { user } = useUser()
  const storageKey = user?.id ? userStorageKey(FINANCE_KEYS.portfolio, user.id) : null
  const [state, setState] = useState(defaultState)
  const [hydratedStorageKey, setHydratedStorageKey] = useState(null)
  const [simulatorState, setSimulatorState] = useState({ cash: 100000, holdings: {} })
  const [form, setForm] = useState({ symbol: '', shares: '', averageCost: '', quoteCurrency: 'USD' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!storageKey) return
    const stored = readStorage(storageKey, defaultState)
    setState({ positions: Array.isArray(stored.positions) ? stored.positions : [] })
    setSimulatorState(readSimulatorState(user.id))
    setHydratedStorageKey(storageKey)
  }, [storageKey, user?.id])

  useEffect(() => {
    if (storageKey && storageKey === hydratedStorageKey) writeStorage(storageKey, state)
  }, [state, storageKey, hydratedStorageKey])

  const simulatorPositions = Object.values(simulatorState.holdings || {}).map(position => ({
    ...position,
    source: 'Simulator',
  }))
  const manualPositions = state.positions.map(position => ({ ...position, source: 'Tracked' }))
  const positionMap = new Map()

  ;[...manualPositions, ...simulatorPositions].forEach(position => {
    // Virtual cash and real holdings are separate books. Never average their
    // cost bases together, even when they contain the same ticker.
    const bookKey = `${position.symbol}:${position.currency === 'V$' ? 'virtual' : 'tracked'}`
    const existing = positionMap.get(bookKey)
    if (!existing) {
      positionMap.set(bookKey, { ...position })
      return
    }
    const shares = Number(existing.shares || 0) + Number(position.shares || 0)
    const averageCost = ((Number(existing.shares || 0) * Number(existing.averageCost || existing.avgCost || 0)) + (Number(position.shares || 0) * Number(position.averageCost || position.avgCost || 0))) / shares
    positionMap.set(bookKey, { ...existing, shares, averageCost, source: 'Tracked + Simulator' })
  })

  const positions = [...positionMap.values()]
  const quoteQueries = useQueries({
    queries: positions.map(position => ({
      queryKey: ['portfolio-quote', position.symbol],
      queryFn: () => stockApi.getDetails(position.symbol).then(response => response.data.data),
      staleTime: 0,
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    })),
  })

  const rows = positions.map((position, index) => {
    const quote = quoteQueries[index]?.data
    const shares = Number(position.shares || 0)
    const averageCost = Number(position.averageCost || position.avgCost || 0)
    const currentPrice = Number(quote?.price || averageCost)
    const invested = shares * averageCost
    const marketValue = shares * currentPrice
    const pnl = marketValue - invested
    return {
      ...position,
      name: quote?.name || position.name || position.symbol,
      quoteCurrency: quote?.currency || position.quoteCurrency || 'USD',
      currency: position.currency === 'V$' ? 'V$' : (quote?.currency || position.quoteCurrency || 'USD'),
      shares,
      averageCost,
      currentPrice,
      invested,
      marketValue,
      pnl,
      pnlPercent: invested ? (pnl / invested) * 100 : 0,
      loading: quoteQueries[index]?.isLoading,
    }
  })

  const currencyTotals = useMemo(() => rows.reduce((result, row) => {
    const current = result[row.currency] || { invested: 0, marketValue: 0, pnl: 0 }
    result[row.currency] = {
      invested: current.invested + row.invested,
      marketValue: current.marketValue + row.marketValue,
      pnl: current.pnl + row.pnl,
    }
    return result
  }, {}), [rows])
  const currencies = Object.keys(currencyTotals)
  const isMixedCurrency = currencies.length > 1
  const formatPortfolioTotal = (field, includeSign = false) => currencies.map(currency => {
    const amount = currencyTotals[currency][field]
    return `${includeSign && amount >= 0 ? '+' : ''}${formatCurrency(amount, currency)}`
  }).join(' · ') || formatCurrency(0, 'USD')
  const portfolioPnlPercent = !isMixedCurrency && currencies[0] && currencyTotals[currencies[0]].invested
    ? (currencyTotals[currencies[0]].pnl / currencyTotals[currencies[0]].invested) * 100
    : null
  const refreshPending = quoteQueries.some(query => query.isFetching)
  const allocationCurrency = currencies[0]
  const allocationRows = allocationCurrency ? rows.filter(row => row.currency === allocationCurrency) : []
  const allocationTotal = currencyTotals[allocationCurrency]?.marketValue || 0
  const allocationGradient = allocationRows.length ? `conic-gradient(#00b981 0deg ${Math.min(360, allocationRows[0].marketValue / Math.max(allocationTotal, 1) * 360)}deg, #a7f3d0 ${Math.min(360, allocationRows[0].marketValue / Math.max(allocationTotal, 1) * 360)}deg 220deg, #111827 220deg 290deg, #d1fae5 290deg 360deg)` : 'conic-gradient(#e5e7eb 0deg 360deg)'

  const addPosition = (event) => {
    event.preventDefault()
    const symbol = form.symbol.trim().toUpperCase()
    const shares = Number(form.shares)
    const averageCost = Number(form.averageCost)
    if (!symbol || !Number.isFinite(shares) || shares <= 0 || !Number.isFinite(averageCost) || averageCost <= 0) {
      toast.error('Enter a symbol, share count, and average cost.')
      return
    }
    setState(previous => ({
      positions: [
        ...previous.positions.filter(position => position.symbol !== symbol),
        { symbol, shares, averageCost, quoteCurrency: form.quoteCurrency || 'USD', createdAt: new Date().toISOString() },
      ],
    }))
    setForm({ symbol: '', shares: '', averageCost: '', quoteCurrency: 'USD' })
    setShowForm(false)
    toast.success(`${symbol} added to your portfolio`)
  }

  const removePosition = (symbol) => {
    setState(previous => ({ positions: previous.positions.filter(position => position.symbol !== symbol) }))
    toast.success(`${symbol} removed from tracked positions`)
  }

  const pnlPositive = currencies.length === 1 ? currencyTotals[currencies[0]].pnl >= 0 : rows.some(row => row.pnl >= 0)

  return (
    <div className="animate-fade-in space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-premium sm:px-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-mint-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-mint-300"><Briefcase size={15} /> Portfolio tracker</div>
            <h1 className="max-w-2xl text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Your money, mapped across every position.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Track live market value, simulated holdings, allocation, and position-level performance in one operating view.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/simulator" className="btn-secondary border-slate-700 bg-white/10 text-white hover:bg-white/15"><WalletCards size={16} /> Open simulator</Link>
            <button type="button" onClick={() => setShowForm(value => !value)} className="btn-primary"><Plus size={16} /> Add position</button>
          </div>
        </div>
      </section>

      {showForm && (
        <form onSubmit={addPosition} className="card grid grid-cols-1 gap-3 p-5 md:grid-cols-[1fr_1fr_1fr_120px_auto] md:items-end">
          <label className="label">Ticker<input className="input mt-1" value={form.symbol} onChange={event => setForm({ ...form, symbol: event.target.value })} placeholder="AAPL or RELIANCE.NS" /></label>
          <label className="label">Shares<input className="input mt-1" type="number" min="0" step="any" value={form.shares} onChange={event => setForm({ ...form, shares: event.target.value })} placeholder="10" /></label>
          <label className="label">Average cost<input className="input mt-1" type="number" min="0" step="any" value={form.averageCost} onChange={event => setForm({ ...form, averageCost: event.target.value })} placeholder="150.00" /></label>
          <label className="label">Currency<select className="input mt-1" value={form.quoteCurrency || 'USD'} onChange={event => setForm({ ...form, quoteCurrency: event.target.value })}><option>USD</option><option>INR</option><option>EUR</option><option>GBP</option></select></label>
          <button className="btn-primary" type="submit">Save position</button>
        </form>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Market value', formatPortfolioTotal('marketValue'), CircleDollarSign, isMixedCurrency ? 'Grouped by currency' : 'Live position marks'],
          ['Invested capital', formatPortfolioTotal('invested'), Landmark, `${rows.length} tracked positions`],
          ['Unrealized P&L', formatPortfolioTotal('pnl', true), pnlPositive ? ArrowUpRight : ArrowDownRight, portfolioPnlPercent == null ? 'Mixed currencies' : `${pnlPositive ? '+' : ''}${portfolioPnlPercent.toFixed(2)}%`],
          ['Virtual cash', `V$${Number(simulatorState.cash || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, ShieldCheck, 'Simulator liquidity'],
        ].map(([label, value, Icon, note]) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between"><span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span><span className="rounded-xl bg-mint-50 p-2 text-mint-700 dark:bg-mint-950/50 dark:text-mint-300"><Icon size={17} /></span></div>
            <div className="mt-5 font-mono text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</div>
            <div className="mt-2 text-xs font-medium text-slate-500">{note}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div><h2 className="font-bold text-slate-950 dark:text-white">Position ledger</h2><p className="mt-1 text-xs text-slate-500">Quotes refresh every 15 seconds while this view is open.</p></div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><RefreshCw size={14} className={refreshPending ? 'animate-spin text-mint-500' : ''} />{refreshPending ? 'Updating' : 'Live marks'}</div>
          </div>
          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-50 text-mint-700 dark:bg-mint-950/40 dark:text-mint-300"><Briefcase size={24} /></div><h3 className="font-bold text-slate-950 dark:text-white">No positions tracked yet</h3><p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Add a holding or place a virtual trade in the simulator to see it here.</p></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-950/50"><tr><th className="px-5 py-3">Security</th><th className="px-5 py-3">Qty</th><th className="px-5 py-3">Avg cost</th><th className="px-5 py-3">Last</th><th className="px-5 py-3">Market value</th><th className="px-5 py-3">P&L</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(row => (<tr key={`${row.symbol}-${row.currency}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60"><td className="px-5 py-4"><Link to={`/stock/${row.symbol}`} className="font-bold text-slate-950 hover:text-mint-600 dark:text-white dark:hover:text-mint-300">{row.symbol}</Link><span className="mt-1 block max-w-[190px] truncate text-xs text-slate-500">{row.name} · {row.source}</span></td><td className="px-5 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">{row.shares}</td><td className="px-5 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">{formatCurrency(row.averageCost, row.currency)}</td><td className="px-5 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">{row.loading ? '...' : row.currentPrice.toFixed(2)} <span className="text-[10px] text-slate-400">{row.quoteCurrency}</span></td><td className="px-5 py-4 font-mono text-sm font-semibold text-slate-950 dark:text-white">{formatCurrency(row.marketValue, row.currency)}</td><td className={`px-5 py-4 font-mono text-sm font-semibold ${row.pnl >= 0 ? 'text-mint-600 dark:text-mint-300' : 'text-red-600 dark:text-red-300'}`}>{row.pnl >= 0 ? '+' : ''}{formatCurrency(row.pnl, row.currency)}<span className="mt-1 block text-xs">{row.pnlPercent.toFixed(2)}%</span></td><td className="px-5 py-4 text-right">{row.source === 'Tracked' ? <button type="button" onClick={() => removePosition(row.symbol)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" aria-label={`Remove ${row.symbol}`}><Trash2 size={16} /></button> : <span className="text-xs text-slate-400">Live</span>}</td></tr>))}</tbody></table></div>
          )}
        </div>

        <aside className="card p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-950 dark:text-white">Allocation lens</h2><p className="mt-1 text-xs text-slate-500">Current position mix</p></div><span className="text-xs font-bold text-mint-700 dark:text-mint-300">{rows.length} assets</span></div>{isMixedCurrency ? <div className="my-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">Allocation is shown per currency. WalletStack does not invent an FX rate when your books contain both real holdings and virtual cash.</div> : <><div className="mx-auto my-8 flex h-44 w-44 items-center justify-center rounded-full" style={{ background: allocationGradient }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900"><span className="font-mono text-xl font-bold text-slate-950 dark:text-white">{allocationRows.length ? Math.round((allocationRows[0].marketValue / Math.max(allocationTotal, 1)) * 100) : 0}%</span><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">top weight</span></div></div><div className="space-y-3 text-sm">{allocationRows.slice(0, 3).map((row, index) => <div key={`${row.symbol}-${row.currency}`} className="flex items-center justify-between"><span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300"><span className={`h-2.5 w-2.5 rounded-full ${['bg-mint-500', 'bg-mint-300', 'bg-slate-800'][index]}`} />{row.symbol}</span><span className="font-mono text-xs text-slate-500">{Math.round((row.marketValue / Math.max(allocationTotal, 1)) * 100)}%</span></div>)}</div></>}</aside>
      </section>
    </div>
  )
}
