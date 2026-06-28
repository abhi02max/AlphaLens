import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStockQuote, useStockChart } from '../hooks/useStocks';
import { SummarySkeleton, ChartSkeleton } from '../components/SkeletonLoader';
import { StockChart } from '../components/StockChart';
import AiInsightCard from '../components/AiInsightCard';
import { DashboardCard } from '../components/ui/DashboardCard';
import { MetricCard } from '../components/ui/MetricCard';
import { WatchlistButton } from '../components/ui/WatchlistButton';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { useAppStore } from '../store';

const StockDetailPage = () => {
  const { symbol } = useParams();
  const [timeframe, setTimeframe] = useState('1mo');
  const [chartType, setChartType] = useState('area');
  
  // Zustand state for conditional UI complexity
  const { learningMode } = useAppStore();
  const isBeginner = learningMode === 'beginner';

  const { data: quote, isLoading: quoteLoading, isError: quoteError } = useStockQuote(symbol);
  const { data: chartData, isLoading: chartLoading } = useStockChart(symbol, timeframe);

  if (quoteError) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Symbol Not Found</h2>
        <p className="text-slate-600 mb-6">We couldn't locate data for "{symbol}".</p>
        <Link to="/" className="text-fintech-blue hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Back to Search
        </Link>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (val) => val ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val) : 'N/A';
  const formatNumber = (val) => val ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val) : 'N/A';

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-medium">Back to search</span>
        </Link>
        <WatchlistButton symbol={symbol.toUpperCase()} />
      </div>

      {/* 1. Header & Quote Summary */}
      {quoteLoading ? <SummarySkeleton /> : !quote ? null : (
        <DashboardCard className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{quote?.shortName || symbol}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded text-sm">{symbol}</span>
                <span className="text-slate-400 text-sm">• {quote?.exchange}</span>
              </div>
            </div>
            <div className="mt-6 md:mt-0 text-left md:text-right">
              <div className="text-4xl font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(quote?.price || quote?.regularMarketPrice)}</div>
              <div className={`flex items-center gap-1 font-semibold mt-2 px-3 py-1 rounded-full inline-flex ${(quote?.change || quote?.regularMarketChange) >= 0 ? 'bg-green-50 text-fintech-green' : 'bg-red-50 text-fintech-red'}`}>
                {(quote?.change || quote?.regularMarketChange) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{(quote?.change || quote?.regularMarketChange) > 0 ? '+' : ''}{(quote?.change || quote?.regularMarketChange)?.toFixed(2)}</span>
                <span className="opacity-80">({(quote?.changePercent || quote?.regularMarketChangePercent)?.toFixed(2)}%)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
            <MetricCard 
              label="Market Cap" 
              value={formatNumber(quote?.marketCap)} 
              explanation="Total dollar value of all the company's shares. Indicates size."
            />
            <MetricCard 
              label="Volume" 
              value={formatNumber(quote?.volume || quote?.regularMarketVolume)} 
              explanation="How many shares traded today. Higher volume means more liquidity."
            />
            
            {/* Conditional Data based on Pro mode */}
            {isBeginner ? (
              <>
                <MetricCard 
                  label="P/E Ratio" 
                  value={quote?.peRatio?.toFixed(2) || quote?.trailingPE?.toFixed(2) || 'N/A'} 
                  explanation="Price to Earnings. A high P/E implies markets expect high growth."
                />
                <MetricCard 
                  label="52-Wk Focus" 
                  value={`$${quote?.fiftyTwoWeekHigh?.toFixed(0)} High`} 
                  explanation="The highest price this stock has hit in the last year."
                />
              </>
            ) : (
               <>
                <MetricCard label="P/E Trailing" value={quote?.peRatio?.toFixed(2) || quote?.trailingPE?.toFixed(2) || 'N/A'} />
                <MetricCard label="Forward P/E" value={quote?.forwardPE?.toFixed(2) || 'N/A'} />
                <MetricCard label="Beta (5Y)" value={quote?.beta?.toFixed(2) || 'N/A'} />
                <MetricCard label="52W Range" value={`${quote?.fiftyTwoWeekLow?.toFixed(0)} - ${quote?.fiftyTwoWeekHigh?.toFixed(0)}`} />
               </>
            )}
          </div>
        </DashboardCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Interactive Financial Chart */}
        <div className="lg:col-span-2">
          <DashboardCard noPadding className="overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <div className="flex bg-slate-200/50 p-1 rounded-lg">
                {['1d', '5d', '1mo', '6mo', '1y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${timeframe === tf ? 'bg-white shadow text-fintech-blue' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-200/50 p-1 rounded-lg">
                <button onClick={() => setChartType('area')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${chartType === 'area' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                  <TrendingUp size={14} /> Line
                </button>
                <button onClick={() => setChartType('candlestick')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${chartType === 'candlestick' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                  <BarChart2 size={14} /> Candles
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 min-h-[400px]">
              {chartLoading ? <ChartSkeleton /> : (
                <div className="h-full w-full">
                  {chartData && chartData.length > 0 ? (
                    <StockChart data={chartData} type={chartType} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">No chart data available.</div>
                  )}
                </div>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* 3. AI Insight Engine Card - Moves to sidebar on desktop */}
        <div className="lg:col-span-1">
          <AiInsightCard symbol={symbol} />
        </div>
      </div>
    </div>
  );
};

export default StockDetailPage;
