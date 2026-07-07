import React from 'react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';
import { Eye, ArrowRight, Loader2 } from 'lucide-react';
import { DashboardCard } from '../components/ui/DashboardCard';
import { EmptyState } from '../components/ui/EmptyState';

const WatchlistPage = () => {
  const { data: watchlist, isLoading, isError } = useWatchlist();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-fintech-blue" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState 
        icon={Eye}
        title="Unable to load watchlist"
        description="There was an error connecting to our servers. Please try again later."
      />
    );
  }

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">My Watchlist</h1>
        <EmptyState 
          icon={Eye}
          title="Your watchlist is empty"
          description="Start tracking your favorite stocks to build your portfolio perspective."
          actionText="Search Stocks"
          actionLink="/"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">My Watchlist</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {watchlist.map((stock) => (
          <Link key={stock.symbol} to={`/stock/${stock.symbol}`}>
            <DashboardCard className="hover:-translate-y-1 transition-transform cursor-pointer h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{stock.symbol}</h3>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-fintech-blue transition-colors" />
              </div>
              
              <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded">Tracked</span>
              </div>
            </DashboardCard>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WatchlistPage;
