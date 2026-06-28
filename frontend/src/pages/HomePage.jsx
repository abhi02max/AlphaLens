import React from 'react';
import SearchBar from '../components/SearchBar';
import { DashboardCard } from '../components/ui/DashboardCard';
import { useStockQuote } from '../hooks/useStocks';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, LayoutDashboard, Globe, Activity } from 'lucide-react';

const MarketPreviewCard = ({ symbol, name }) => {
  const { data: quote, isLoading } = useStockQuote(symbol);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 animate-pulse h-28"></div>
    );
  }

  if (!quote) return null;

  const isPositive = (quote.change || quote.regularMarketChange) >= 0;

  return (
    <Link to={`/stock/${symbol}`} className="block focus:outline-none">
      <DashboardCard className="hover:shadow-md transition-shadow cursor-pointer h-full border-slate-200">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-800">{symbol}</h3>
            <p className="text-xs text-slate-500 truncate max-w-[120px]">{name}</p>
          </div>
          <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xl font-bold font-mono text-slate-900">
            ${(quote.price || quote.regularMarketPrice)?.toFixed(2)}
          </div>
          <div className={`text-sm font-semibold ${(quote.changePercent || quote.regularMarketChangePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{(quote.changePercent || quote.regularMarketChangePercent)?.toFixed(2)}%
          </div>
        </div>
      </DashboardCard>
    </Link>
  );
};

const HomePage = () => {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center my-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 md:p-16 text-white shadow-xl relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center tracking-tight relative z-10">
          Your Intelligent Market Dashboard.
        </h1>
        <p className="text-lg text-slate-300 mb-8 max-w-2xl text-center relative z-10">
          AlphaLens gives you a professional, macro view of the markets, powered by AI explanations.
        </p>

        <div className="w-full relative z-20">
          <SearchBar />
        </div>
      </div>

      {/* Market Overview Section (Like TradingView / Groww) */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="text-fintech-blue" size={24} />
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Market Overview</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MarketPreviewCard symbol="^GSPC" name="S&P 500" />
          <MarketPreviewCard symbol="^IXIC" name="NASDAQ" />
          <MarketPreviewCard symbol="BTC-USD" name="Bitcoin" />
          <MarketPreviewCard symbol="GC=F" name="Gold" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Popular Tech / Trending */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-fintech-blue" size={24} />
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Trending Tech</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MarketPreviewCard symbol="NVDA" name="NVIDIA Corp" />
            <MarketPreviewCard symbol="TSLA" name="Tesla Inc" />
            <MarketPreviewCard symbol="AAPL" name="Apple Inc" />
            <MarketPreviewCard symbol="MSFT" name="Microsoft" />
          </div>
        </div>

        {/* High Dividends / Financials */}
         <div>
          <div className="flex items-center gap-2 mb-6">
            <LayoutDashboard className="text-fintech-blue" size={24} />
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Financials & Retail</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MarketPreviewCard symbol="AMZN" name="Amazon" />
            <MarketPreviewCard symbol="JPM" name="JPMorgan Chase" />
            <MarketPreviewCard symbol="V" name="Visa" />
            <MarketPreviewCard symbol="WMT" name="Walmart" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
