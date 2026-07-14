import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { CalendarClock, CheckCircle2, Flag, Plus, Target, Trash2, TrendingUp } from 'lucide-react'
import { FINANCE_KEYS, formatCurrency, formatDate, readStorage, userStorageKey, writeStorage } from '../utils/financeStorage'

const defaultState = { goals: [] }

export default function Goals() {
  const { user } = useUser()
  const storageKey = user?.id ? userStorageKey(FINANCE_KEYS.goals, user.id) : null
  const [state, setState] = useState(defaultState)
  const [hydratedStorageKey, setHydratedStorageKey] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [contributeId, setContributeId] = useState(null)
  const [contribution, setContribution] = useState('')
  const [form, setForm] = useState({ name: '', target: '', saved: '', deadline: '', color: 'mint' })

  useEffect(() => {
    if (!storageKey) return
    const stored = readStorage(storageKey, defaultState)
    setState({ goals: Array.isArray(stored.goals) ? stored.goals : [] })
    setHydratedStorageKey(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (storageKey && storageKey === hydratedStorageKey) writeStorage(storageKey, state)
  }, [state, storageKey, hydratedStorageKey])

  const addGoal = (event) => {
    event.preventDefault()
    const target = Number(form.target)
    const saved = Number(form.saved || 0)
    if (!form.name.trim() || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0) {
      toast.error('Add a goal name and a valid target.')
      return
    }
    setState(previous => ({ goals: [{ ...form, name: form.name.trim(), target, saved, id: `${Date.now()}` }, ...previous.goals] }))
    setForm({ name: '', target: '', saved: '', deadline: '', color: 'mint' })
    setShowForm(false)
    toast.success('Goal added to your plan')
  }

  const addContribution = (id) => {
    const amount = Number(contribution)
    if (!Number.isFinite(amount) || amount <= 0) return
    setState(previous => ({ goals: previous.goals.map(goal => goal.id === id ? { ...goal, saved: Number(goal.saved || 0) + amount } : goal) }))
    setContribution('')
    setContributeId(null)
    toast.success('Progress updated')
  }

  const removeGoal = (id) => setState(previous => ({ goals: previous.goals.filter(goal => goal.id !== id) }))
  const totalTarget = state.goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0)
  const totalSaved = state.goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0)

  return (
    <div className="animate-fade-in space-y-6">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-mint-700 dark:text-mint-300"><Target size={15} /> Financial planning</div><h1 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">Turn intent into funded milestones.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Set clear targets, watch the funding curve, and keep long-term decisions visible next to today&apos;s money.</p></div><button type="button" onClick={() => setShowForm(value => !value)} className="btn-primary self-start"><Plus size={16} /> New goal</button></section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="card p-5"><span className="text-sm font-semibold text-slate-500">Active goals</span><div className="mt-5 font-mono text-3xl font-bold text-slate-950 dark:text-white">{state.goals.length}</div><span className="mt-2 block text-xs text-slate-500">Across your plan</span></div><div className="card p-5"><span className="text-sm font-semibold text-slate-500">Total target</span><div className="mt-5 font-mono text-3xl font-bold text-slate-950 dark:text-white">{formatCurrency(totalTarget)}</div><span className="mt-2 block text-xs text-slate-500">Capital required</span></div><div className="card p-5"><span className="text-sm font-semibold text-slate-500">Funded</span><div className="mt-5 font-mono text-3xl font-bold text-mint-600 dark:text-mint-300">{formatCurrency(totalSaved)}</div><span className="mt-2 block text-xs text-slate-500">{totalTarget ? `${Math.round((totalSaved / totalTarget) * 100)}% of plan funded` : 'Start with a first goal'}</span></div></section>

      {showForm && <form onSubmit={addGoal} className="card grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto] xl:items-end"><label className="label">Goal name<input className="input mt-1" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Emergency reserve" /></label><label className="label">Target<input className="input mt-1" type="number" min="0" value={form.target} onChange={event => setForm({ ...form, target: event.target.value })} placeholder="250000" /></label><label className="label">Already saved<input className="input mt-1" type="number" min="0" value={form.saved} onChange={event => setForm({ ...form, saved: event.target.value })} placeholder="50000" /></label><label className="label">Target date<input className="input mt-1" type="date" value={form.deadline} onChange={event => setForm({ ...form, deadline: event.target.value })} /></label><button className="btn-primary" type="submit">Create</button></form>}

      {state.goals.length === 0 ? <div className="card px-6 py-20 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-50 text-mint-700 dark:bg-mint-950/40 dark:text-mint-300"><Flag size={28} /></div><h2 className="text-xl font-bold text-slate-950 dark:text-white">No goals on the board</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Create a target for your next reserve, trip, purchase, or long-term milestone.</p><button type="button" onClick={() => setShowForm(true)} className="btn-secondary mt-6"><Plus size={16} /> Create first goal</button></div> : <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">{state.goals.map(goal => { const progress = Math.min(100, (Number(goal.saved || 0) / Math.max(Number(goal.target || 0), 1)) * 100); return <article key={goal.id} className="card p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-50 text-mint-700 dark:bg-mint-950/40 dark:text-mint-300"><Target size={20} /></div><div><h2 className="font-bold text-slate-950 dark:text-white">{goal.name}</h2><div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><CalendarClock size={13} />{goal.deadline ? formatDate(goal.deadline) : 'No deadline set'}</div></div></div><button type="button" onClick={() => removeGoal(goal.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" aria-label={`Remove ${goal.name}`}><Trash2 size={16} /></button></div><div className="mt-7 flex items-end justify-between"><div><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saved</span><div className="mt-1 font-mono text-2xl font-bold text-slate-950 dark:text-white">{formatCurrency(goal.saved)}</div></div><div className="text-right"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target</span><div className="mt-1 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(goal.target)}</div></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-mint-500 transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500"><span>{progress.toFixed(0)}% funded</span><span>{formatCurrency(Math.max(0, Number(goal.target) - Number(goal.saved)))} remaining</span></div>{contributeId === goal.id ? <div className="mt-5 flex gap-2"><input className="input" type="number" min="0" value={contribution} onChange={event => setContribution(event.target.value)} placeholder="Add amount" autoFocus /><button type="button" onClick={() => addContribution(goal.id)} className="btn-primary">Add</button><button type="button" onClick={() => setContributeId(null)} className="btn-ghost">Cancel</button></div> : <button type="button" onClick={() => setContributeId(goal.id)} className="btn-secondary mt-5 w-full"><TrendingUp size={16} /> Add progress</button>}{progress >= 100 && <div className="mt-4 flex items-center gap-2 text-sm font-bold text-mint-700 dark:text-mint-300"><CheckCircle2 size={16} /> Goal fully funded</div>}</article> })}</section>}
    </div>
  )
}
