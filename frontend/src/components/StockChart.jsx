import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';
import { BarChart3 } from 'lucide-react';

export default function StockChart({ data, loading }) {
  const chartContainerRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (loading || !data || data.length === 0 || !chartContainerRef.current) return;

    // Filter and format data
    const isCandlestick = data.some(d => d.open != null && d.high != null && d.low != null && d.close != null && d.open !== d.close);
    
    // Convert dates to timestamps (lightweight-charts uses seconds or YYYY-MM-DD string)
    // Yahoo Finance can send intraday or daily data. We'll format to standard timestamps.
    const formattedData = data.map(d => ({
      time: new Date(d.date).getTime() / 1000,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      value: d.close || d.price,
      volume: d.volume,
    })).sort((a, b) => a.time - b.time);

    // Remove duplicate timestamps
    const uniqueData = [];
    const seen = new Set();
    for (const item of formattedData) {
      if (!seen.has(item.time) && !isNaN(item.time)) {
        seen.add(item.time);
        uniqueData.push(item);
      }
    }

    if (uniqueData.length === 0) return;

    const isDark = theme === 'dark';
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      handleScroll: true,
      handleScale: true,
      width: chartContainerRef.current.clientWidth,
      height: 320,
    });

    if (isCandlestick) {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
      candlestickSeries.setData(uniqueData);
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#4f46e5',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      lineSeries.setData(uniqueData);
    }

    const volumeData = uniqueData
      .filter(item => item.volume != null)
      .map(item => ({
        time: item.time,
        value: item.volume,
        color: item.close >= item.open ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)',
      }));

    if (volumeData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volumeSeries.setData(volumeData);
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, loading, theme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[320px]">
        <div className="text-center">
          <div className="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-slate-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <BarChart3 size={24} className="text-slate-400" />
          </div>
          <p className="text-sm">No chart data available</p>
        </div>
      </div>
    );
  }

  return <div ref={chartContainerRef} className="w-full h-[320px]" />;
}
