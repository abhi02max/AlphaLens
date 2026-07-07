import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { watchlistApi } from '../services/api'
import toast from 'react-hot-toast'
import { Star, Plus, X, Search, ArrowRight, TrendingUp } from 'lucide-react'

export default function Watchlist() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [symbol, setSymbol] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.get().then(r => r.data.data),
  })

  const addMutation = useMutation({
    mutationFn: (sym) => watchlistApi.add(sym),
    onSuccess: (_, sym) => { toast.success(`${sym} added`); queryClient.invalidateQueries({ queryKey: ['watchlist'] }); setSymbol('') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add'),
  })

  const removeMutation = useMutation({
    mutationFn: (sym) => watchlistApi.remove(sym),
    onSuccess: (_, sym) => { toast.success(`${sym} removed`); queryClient.invalidateQueries({ queryKey: ['watchlist'] }) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove'),
  })

  const handleAdd = (e) => { e.preventDefault(); if (symbol.trim()) addMutation.mutate(symbol.trim().toUpperCase()) }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-1">
            <Star size={26} className="text-indigo-500" />
            My Watchlist
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Track your favorite stocks in one place</p>
        </div>
        <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold text-sm px-4 py-1.5 rounded-full self-start">
          {data?.length || 0} stocks
        </span>
      </div>

      {/* Add Stock Form */}
      <form onSubmit={handleAdd} className="flex gap-3 mb-10">
        <div className="relative flex-1 max-w-md flex items-center shadow-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <Plus size={20} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            placeholder="Add symbol (e.g. AAPL)"
          />
        </div>
        <button
          type="submit"
          disabled={addMutation.isPending || !symbol.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Add
        </button>
      </form>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4 animate-pulse">
            <Star size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading watchlist...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 dark:text-red-400 font-semibold">Failed to load watchlist</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data?.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <Star size={28} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your watchlist is empty</h3>
          <p className="text-slate-500 mb-8 text-sm max-w-sm mx-auto">Add stocks to track them here. Start by searching for your favorites.</p>
          <Link to="/search" className="btn-primary">
            <Search size={18} className="mr-2" />
            Explore Markets
          </Link>
        </div>
      )}

      {/* Watchlist Items */}
      <div className="grid gap-3">
        {data?.map((sym) => (
          <div
            key={sym}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md rounded-xl p-4 flex items-center justify-between group transition-all duration-200"
          >
            <button
              onClick={() => navigate(`/stock/${sym}`)}
              className="flex items-center gap-4 text-left flex-1"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                {sym.slice(0, 2)}
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{sym}</span>
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                  <TrendingUp size={12} />
                  View analytics
                </div>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <ArrowRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200 hidden sm:block" />
              <button
                onClick={() => removeMutation.mutate(sym)}
                disabled={removeMutation.isPending}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                title="Remove from watchlist"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
