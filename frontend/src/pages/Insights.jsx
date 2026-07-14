import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { BrainCircuit, CheckCircle2, AlertCircle, Lightbulb, RefreshCw, ShieldCheck, Sparkles, Target, TrendingUp } from 'lucide-react'
import { FINANCE_KEYS, formatCurrency, monthKey, readStorage, userStorageKey } from '../utils/financeStorage'
import { aiApi } from '../services/api'

const simulatorKey = userId => `alphalens-simulator-v1:${userId}`

export default function Insights() {
  const { user } = useUser()
  const [budget, setBudget] = useState({ monthlyBudget: 100000, transactions: [] })
  const [goals, setGoals] = useState({ goals: [] })
  const [simulator, setSimulator] = useState({ cash: 100000, holdings: {} })
  const [aiBrief, setAiBrief] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const currentMonth = monthKey()

  useEffect(() => {
    if (!user?.id) return
    setBudget(readStorage(userStorageKey(FINANCE_KEYS.budget, user.id), { monthlyBudget: 100000, transactions: [] }))
    setGoals(readStorage(userStorageKey(FINANCE_KEYS.goals, user.id), { goals: [] }))
    setSimulator(readStorage(simulatorKey(user.id), { cash: 100000, holdings: {} }))
  }, [user?.id, refreshKey])

  const transactions = (budget.transactions || []).filter(transaction => monthKey(transaction.date) === currentMonth)
  const spent = transactions.filter(transaction => transaction.type === 'expense').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  const income = transactions.filter(transaction => transaction.type === 'income').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  const savingsRate = income > 0 ? ((income - spent) / income) * 100 : null
  const totalGoalTarget = (goals.goals || []).reduce((sum, goal) => sum + Number(goal.target || 0), 0)
  const totalGoalSaved = (goals.goals || []).reduce((sum, goal) => sum + Number(goal.saved || 0), 0)
  const holdingCount = Object.keys(simulator.holdings || {}).length
  const spendingPressure = spent / Math.max(Number(budget.monthlyBudget || 0), 1)

  const signals = useMemo(() => {
    const items = []
    if (!transactions.length) items.push({ tone: 'neutral', icon: Lightbulb, title: 'Build the baseline', text: 'Log a few income and expense events so WalletStack can identify your real spending rhythm.' })
    else if (spendingPressure > 0.9) items.push({ tone: 'risk', icon: AlertCircle, title: 'Budget pressure is elevated', text: `You have used ${(spendingPressure * 100).toFixed(0)}% of the monthly plan. Review the largest category before adding discretionary spend.` })
    else items.push({ tone: 'good', icon: CheckCircle2, title: 'Spending is inside the plan', text: `Current expenses are at ${(spendingPressure * 100).toFixed(0)}% of your monthly budget. Keep the remaining room visible as the month closes.` })
    if (savingsRate != null) items.push({ tone: savingsRate >= 20 ? 'good' : 'risk', icon: TrendingUp, title: `${savingsRate.toFixed(0)}% savings rate`, text: savingsRate >= 20 ? 'Your logged cash flow is creating useful forward capacity for goals.' : 'The current savings rate leaves less room for goals and shocks; review recurring categories first.' })
    if (holdingCount > 0) items.push({ tone: 'neutral', icon: ShieldCheck, title: `${holdingCount} simulated position${holdingCount > 1 ? 's' : ''}`, text: 'Review concentration and downside before treating virtual performance as a repeatable plan.' })
    if (totalGoalTarget > 0 && totalGoalSaved / totalGoalTarget < 0.25) items.push({ tone: 'neutral', icon: Target, title: 'Goals need an early funding cadence', text: 'A small recurring contribution is easier to sustain than a large end-of-year catch-up.' })
    return items
  }, [holdingCount, savingsRate, spendingPressure, totalGoalSaved, totalGoalTarget, transactions.length])

  const overview = savingsRate == null ? 'Your personal finance model is ready for its first data points.' : savingsRate >= 20 ? 'Cash flow is generating forward capacity. Keep the system consistent and direct the surplus deliberately.' : 'The current cash-flow picture is workable, but the margin for goals and unexpected costs is thin.'

  const aiMutation = useMutation({
    mutationFn: payload => aiApi.getPersonalFinanceInsights(payload).then(response => response.data.data),
    onSuccess: setAiBrief,
    onError: error => toast.error(error.response?.data?.message || 'Personal finance brief unavailable'),
  })

  const generateBrief = () => aiMutation.mutate({
    cashFlow: income - spent,
    budgetUsage: spendingPressure * 100,
    savingsRate,
    goalProgress: totalGoalTarget ? (totalGoalSaved / totalGoalTarget) * 100 : 0,
    goalCount: goals.goals?.length || 0,
    simulatedPositionCount: holdingCount,
    topSpendingCategory: transactions.filter(transaction => transaction.type === 'expense').sort((a, b) => Number(b.amount) - Number(a.amount))[0]?.category || null,
  })

  return (
    <div className="animate-fade-in space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-premium sm:px-8"><div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-mint-500/20 blur-3xl" /><div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-mint-300"><BrainCircuit size={15} /> AI personal finance</div><h1 className="max-w-2xl text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">A sharper read on the choices behind your money.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">WalletStack turns your budget, goals, and simulated investing activity into a focused decision brief.</p></div><button type="button" onClick={() => setRefreshKey(value => value + 1)} className="btn-secondary border-slate-700 bg-white/10 text-white hover:bg-white/15"><RefreshCw size={16} /> Refresh brief</button></div></section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="card p-5"><span className="text-sm font-semibold text-slate-500">Monthly cash flow</span><div className={`mt-4 font-mono text-2xl font-bold ${income - spent >= 0 ? 'text-mint-600 dark:text-mint-300' : 'text-rose-600'}`}>{formatCurrency(income - spent)}</div><span className="mt-2 block text-xs text-slate-500">Income less logged expenses</span></div><div className="card p-5"><span className="text-sm font-semibold text-slate-500">Goal progress</span><div className="mt-4 font-mono text-2xl font-bold text-slate-950 dark:text-white">{totalGoalTarget ? `${Math.round((totalGoalSaved / totalGoalTarget) * 100)}%` : '—'}</div><span className="mt-2 block text-xs text-slate-500">Across {goals.goals?.length || 0} active goals</span></div><div className="card p-5"><span className="text-sm font-semibold text-slate-500">Model status</span><div className="mt-4 flex items-center gap-2 text-lg font-bold text-mint-600 dark:text-mint-300"><span className="h-2.5 w-2.5 rounded-full bg-mint-500" />Live local model</div><span className="mt-2 block text-xs text-slate-500">Updated from your latest saved data</span></div></section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-6"><div className="card p-5 sm:p-6"><div className="mb-6 flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-700 dark:bg-mint-950/40 dark:text-mint-300"><Sparkles size={20} /></div><div><h2 className="font-bold text-slate-950 dark:text-white">Executive brief</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{overview}</p></div></div><div className="grid gap-3">{signals.map(signal => { const Icon = signal.icon; return <div key={signal.title} className="flex gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800"><Icon size={18} className={signal.tone === 'risk' ? 'mt-0.5 shrink-0 text-rose-500' : signal.tone === 'good' ? 'mt-0.5 shrink-0 text-mint-600' : 'mt-0.5 shrink-0 text-slate-500'} /><div><h3 className="text-sm font-bold text-slate-950 dark:text-white">{signal.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{signal.text}</p></div></div> })}</div></div><div className="card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><h2 className="font-bold text-slate-950 dark:text-white">AI personal finance brief</h2><p className="mt-1 text-xs text-slate-500">Generated from your structured WalletStack snapshot.</p></div><BrainCircuit size={18} className="text-mint-600" /></div>{aiBrief ? <div className="space-y-5 p-5"><div><div className="text-xs font-bold uppercase tracking-wider text-mint-700 dark:text-mint-300">{aiBrief.headline}</div><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{aiBrief.summary}</p></div><div className="grid gap-3 md:grid-cols-2">{[['Priority actions', aiBrief.priorityActions], ['Risks', aiBrief.risks], ['Opportunities', aiBrief.opportunities]].map(([title, items]) => <div key={title} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"><div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</div><ul className="space-y-2 text-sm leading-5 text-slate-700 dark:text-slate-300">{(items || []).map(item => <li key={item} className="flex gap-2"><span className="text-mint-600">•</span>{item}</li>)}</ul></div>)}</div><div className="rounded-2xl border border-mint-100 bg-mint-50/60 p-4 text-xs leading-5 text-slate-600 dark:border-mint-900/40 dark:bg-mint-950/20 dark:text-slate-300"><span className="font-bold">Next review:</span> {aiBrief.nextReview}<br /><span className="font-bold">Boundary:</span> {aiBrief.disclaimer}</div></div> : <div className="p-5"><p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Generate a market-desk style read of your cash flow, goal funding, and simulated exposure. Your private entries are summarized into metrics before they reach the AI layer.</p><button type="button" onClick={generateBrief} disabled={aiMutation.isPending} className="btn-primary mt-5"><BrainCircuit size={16} />{aiMutation.isPending ? 'Generating brief...' : 'Generate AI brief'}</button></div>}</div></div><aside className="card p-5"><h2 className="font-bold text-slate-950 dark:text-white">Decision frame</h2><p className="mt-1 text-xs leading-5 text-slate-500">Use this as a planning layer, not a directive.</p><div className="mt-6 space-y-4"><div><div className="mb-2 flex justify-between text-xs font-semibold text-slate-500"><span>Budget used</span><span>{Math.min(100, spendingPressure * 100).toFixed(0)}%</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${spendingPressure > 0.9 ? 'bg-rose-500' : 'bg-mint-500'}`} style={{ width: `${Math.min(100, spendingPressure * 100)}%` }} /></div></div><div><div className="mb-2 flex justify-between text-xs font-semibold text-slate-500"><span>Goals funded</span><span>{totalGoalTarget ? `${Math.min(100, (totalGoalSaved / totalGoalTarget) * 100).toFixed(0)}%` : '0%'}</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-slate-900 dark:bg-white" style={{ width: `${totalGoalTarget ? Math.min(100, (totalGoalSaved / totalGoalTarget) * 100) : 0}%` }} /></div></div></div><div className="mt-7 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><ShieldCheck size={14} /> Data boundary</div><p className="mt-2 text-xs leading-5 text-slate-500">Your finance entries stay in your signed-in browser profile. Market research continues to use WalletStack&apos;s live data layer.</p></div></aside></section>
    </div>
  )
}
