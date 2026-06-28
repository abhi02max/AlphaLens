import React from 'react';
import { useWatchlistStatus, useToggleWatchlist } from '../../hooks/useWatchlist';
import { useAuthStore } from '../../store';
import { BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WatchlistButton = ({ symbol }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading } = useWatchlistStatus(symbol);
  const { addMutation, removeMutation } = useToggleWatchlist();

  const isWatched = data?.inWatchlist;
  const isPending = addMutation.isPending || removeMutation.isPending || isLoading;

  const handleClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (isWatched) {
      removeMutation.mutate(symbol);
    } else {
      addMutation.mutate(symbol);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 flex-1 md:flex-none justify-center rounded-lg font-medium transition-all ${
        isWatched 
          ? 'bg-fintech-blue/10 text-fintech-blue border border-fintech-blue/20 hover:bg-fintech-blue/20' 
          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {isPending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isWatched ? (
        <BookmarkCheck size={18} />
      ) : (
        <BookmarkPlus size={18} />
      )}
      <span>{isWatched ? 'Saved' : 'Watch'}</span>
    </button>
  );
};
