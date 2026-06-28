import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { watchlistApi } from '../services/api'
import toast from 'react-hot-toast'

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
    onSuccess: (_, sym) => { toast.success(`${sym} added`); queryClient.invalidateQueries(['watchlist']); setSymbol('') },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add'),
  })

  const removeMutation = useMutation({
    mutationFn: (sym) => watchlistApi.remove(sym),
    onSuccess: (_, sym) => { toast.success(`${sym} removed`); queryClient.invalidateQueries(['watchlist']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove'),
  })

  const handleAdd = (e) => { e.preventDefault(); if (symbol.trim()) addMutation.mutate(symbol.trim().toUpperCase()) }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Watchlist</h1>
        <span className="badge-info text-sm px-3 py-1">{data?.length || 0} stocks</span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input max-w-xs" placeholder="Add symbol (e.g. AAPL)" />
        <button type="submit" disabled={addMutation.isLoading || !symbol.trim()} className="btn-primary">+ Add</button>
      </form>

      {isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>}

      {error && <div className="card p-6 text-center text-red-500">Failed to load watchlist</div>}

      {!isLoading && data?.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
          <p className="text-dark-500 mb-4">Add stocks to track them here</p>
          <Link to="/search" className="btn-primary">Search Stocks</Link>
        </div>
      )}

      <div className="grid gap-2">
        {data?.map((sym) => (
          <div key={sym} className="card flex items-center justify-between p-4">
            <button onClick={() => navigate(`/stock/${sym}`)} className="flex items-center gap-3 hover:text-primary-600 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center font-bold text-sm">{sym.slice(0, 2)}</div>
              <span className="font-semibold text-lg">{sym}</span>
            </button>
            <button onClick={() => removeMutation.mutate(sym)} disabled={removeMutation.isLoading} className="btn-ghost text-red-500 hover:text-red-600 p-2">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}