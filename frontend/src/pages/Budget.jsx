import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, CircleDollarSign, Minus, Plus, ReceiptText, Trash2, Wallet } from 'lucide-react'
import { FINANCE_KEYS, formatCurrency, formatDate, monthKey, readStorage, userStorageKey, writeStorage } from '../utils/financeStorage'

const defaultState = { monthlyBudget: 100000, transactions: [] }
const categories = ['Housing', 'Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Learning', 'Leisure', 'Other']

export default function Budget() {
  const { user } = useUser()
  const storageKey = user?.id ? userStorageKey(FINANCE_KEYS.budget, user.id) : null
  const [state, setState] = useState(defaultState)
  const [hydratedStorageKey, setHydratedStorageKey] = useState(null)
  const [form, setForm] = useState({ type: 'expense', amount: '', category: 'Food', note: '', date: new Date().toISOString().slice(0, 10) })

  useEffect(() => {
    if (!storageKey) return
    const stored = readStorage(storageKey, defaultState)
    setState({ monthlyBudget: Number(stored.monthlyBudget) || defaultState.monthlyBudget, transactions: Array.isArray(stored.transactions) ? stored.transactions : [] })
    setHydratedStorageKey(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (storageKey && storageKey === hydratedStorageKey) writeStorage(storageKey, state)
  }, [state, storageKey, hydratedStorageKey])

  const currentMonth = monthKey()
  const transactions = state.transactions.filter(transaction => monthKey(transaction.date) === currentMonth)
  const spent = transactions.filter(transaction => transaction.type === 'expense').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  const income = transactions.filter(transaction => transaction.type === 'income').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
  const remaining = state.monthlyBudget - spent
  const spendPercent = (spent / Math.max(state.monthlyBudget, 1)) * 100
  const spendBarPercent = Math.min(100, Math.max(0, spendPercent))
  const categoryTotals = useMemo(() => categories.map(category => ({ category, amount: transactions.filter(transaction => transaction.type === 'expense' && transaction.category === category).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0) })).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount), [transactions])

  const addTransaction = (event) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount.')
      return
    }
    setState(previous => ({ ...previous, transactions: [{ ...form, amount, id: `${Date.now()}`, createdAt: new Date().toISOString() }, ...previous.transactions].slice(0, 250) }))
    setForm(previous => ({ ...previous, amount: '', note: '' }))
    toast.success(form.type === 'expense' ? 'Expense logged' : 'Income logged')
  }

  const removeTransaction = (id) => setState(previous => ({ ...previous, transactions: previous.transactions.filter(transaction => transaction.id !== id) }))

  return (
    <div className="animate-fade-in space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-mint-700 dark:text-mint-300"><ReceiptText size={15} /> Budget control</div><h1 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">Give every rupee a job.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">A clear monthly view of cash flow, category pressure, and the spending decisions shaping your next month.</p></div><div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"><CalendarDays size={16} className="text-mint-600" /><span className="text-xs font-semibold text-slate-500">{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date())}</span></div></section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="card p-5"><div className="flex items-center justify-between text-sm font-semibold text-slate-500">Monthly budget<Wallet size={17} className="text-mint-600" /></div><input className="mt-4 w-full border-0 bg-transparent p-0 font-mono text-2xl font-bold text-slate-950 outline-none dark:text-white" type="number" min="0" value={state.monthlyBudget} onChange={event => setState(previous => ({ ...previous, monthlyBudget: Math.max(0, Number(event.target.value) || 0) }))} /><span className="mt-1 block text-xs text-slate-500">INR base plan</span></div><div className="card p-5"><div className="flex items-center justify-between text-sm font-semibold text-slate-500">Spent this month<ArrowDownLeft size={17} className="text-rose-500" /></div><div className="mt-5 font-mono text-2xl font-bold text-slate-950 dark:text-white">{formatCurrency(spent)}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${spendPercent >= 90 ? 'bg-rose-500' : 'bg-mint-500'}`} style={{ width: `${spendBarPercent}%` }} /></div><span className={`mt-2 block text-xs ${spendPercent > 100 ? 'font-bold text-rose-600' : 'text-slate-500'}`}>{spendPercent.toFixed(0)}% of monthly budget</span></div><div className="card p-5"><div className="flex items-center justify-between text-sm font-semibold text-slate-500">Remaining<CircleDollarSign size={17} className={remaining >= 0 ? 'text-mint-600' : 'text-rose-500'} /></div><div className={`mt-5 font-mono text-2xl font-bold ${remaining >= 0 ? 'text-slate-950 dark:text-white' : 'text-rose-600'}`}>{formatCurrency(remaining)}</div><span className="mt-2 block text-xs text-slate-500">Available against plan</span></div><div className="card p-5"><div className="flex items-center justify-between text-sm font-semibold text-slate-500">Income logged<ArrowUpRight size={17} className="text-mint-600" /></div><div className="mt-5 font-mono text-2xl font-bold text-slate-950 dark:text-white">{formatCurrency(income)}</div><span className="mt-2 block text-xs text-slate-500">{income - spent >= 0 ? 'Positive monthly cash flow' : 'Cash flow under pressure'}</span></div></section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]"><form onSubmit={addTransaction} className="card h-fit p-5"><div className="mb-5"><h2 className="font-bold text-slate-950 dark:text-white">Log a transaction</h2><p className="mt-1 text-xs text-slate-500">Keep the ledger current as money moves.</p></div><div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-950"><button type="button" onClick={() => setForm({ ...form, type: 'expense' })} className={`rounded-lg px-3 py-2 text-sm font-bold ${form.type === 'expense' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}><Minus size={14} className="mr-1 inline" />Expense</button><button type="button" onClick={() => setForm({ ...form, type: 'income' })} className={`rounded-lg px-3 py-2 text-sm font-bold ${form.type === 'income' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}><Plus size={14} className="mr-1 inline" />Income</button></div><label className="label">Amount<input className="input mt-1" type="number" min="0" step="1" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} placeholder="2500" /></label><label className="label mt-4">Category<select className="input mt-1" value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label className="label mt-4">Description<input className="input mt-1" value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} placeholder="Rent, groceries, salary..." /></label><label className="label mt-4">Date<input className="input mt-1" type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label><button className="btn-primary mt-5 w-full" type="submit">{form.type === 'expense' ? 'Log expense' : 'Log income'} <Check size={16} /></button></form>

        <div className="space-y-6"><div className="card p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-slate-950 dark:text-white">Category pressure</h2><p className="mt-1 text-xs text-slate-500">Where this month&apos;s spend is concentrating.</p></div><span className="text-xs font-semibold text-slate-500">{categoryTotals.length} categories</span></div>{categoryTotals.length === 0 ? <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-950">Your category picture will appear after the first expense.</div> : <div className="space-y-4">{categoryTotals.map(item => <div key={item.category}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-slate-700 dark:text-slate-300">{item.category}</span><span className="font-mono text-xs text-slate-500">{formatCurrency(item.amount)}</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-mint-500" style={{ width: `${Math.min(100, (item.amount / Math.max(spent, 1)) * 100)}%` }} /></div></div>)}</div>}</div><div className="card overflow-hidden"><div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><h2 className="font-bold text-slate-950 dark:text-white">Recent ledger</h2><p className="mt-1 text-xs text-slate-500">Latest transactions for the selected month.</p></div>{transactions.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No transactions logged for this month.</div> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{transactions.slice(0, 8).map(transaction => <div key={transaction.id} className="flex items-center gap-3 px-5 py-4"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${transaction.type === 'expense' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300' : 'bg-mint-50 text-mint-700 dark:bg-mint-950/30 dark:text-mint-300'}`}>{transaction.type === 'expense' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{transaction.note || transaction.category}</div><div className="mt-1 text-xs text-slate-500">{transaction.category} · {formatDate(transaction.date)}</div></div><div className={`font-mono text-sm font-bold ${transaction.type === 'expense' ? 'text-slate-950 dark:text-white' : 'text-mint-600 dark:text-mint-300'}`}>{transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}</div><button type="button" onClick={() => removeTransaction(transaction.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" aria-label="Delete transaction"><Trash2 size={15} /></button></div>)}</div>}</div></div>
      </section>
    </div>
  )
}
