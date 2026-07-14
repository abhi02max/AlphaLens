import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { BarChart3 } from 'lucide-react';

export default function StockChart({ data, loading, chartType = 'line' }) {
  const chartContainerRef = useRef(null);
  const { theme } = useTheme();
  const { settings } = useAccessibility();
  const latestPoint = data?.[data.length - 1];
  const isEstimated = latestPoint?.freshness === 'estimated-from-live-quote';

  useEffect(() => {
    if (loading || !data || data.length === 0 || !chartContainerRef.current) return;

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

    if (chartType === 'candles') {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
      candlestickSeries.setData(uniqueData);
    } else {
      const lineSeries = chart.addSeries(AreaSeries, {
        lineColor: '#00a172',
        topColor: isDark ? 'rgba(0, 161, 114, 0.28)' : 'rgba(0, 161, 114, 0.22)',
        bottomColor: isDark ? 'rgba(0, 161, 114, 0.02)' : 'rgba(0, 161, 114, 0.04)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      lineSeries.setData(uniqueData.map(item => ({
        time: item.time,
        value: item.value,
      })));
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
  }, [data, loading, theme, chartType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[320px]">
        <div className="text-center">
          <div className="w-10 h-10 rounded bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <BarChart3 size={20} className="text-emerald-600 dark:text-emerald-400" />
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

  const tableRows = [...data]
    .filter(item => item.date && (item.close != null || item.price != null))
    .slice(-12)
    .reverse();

  return (
    <div>
      {isEstimated && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200">
          Historical candles were unavailable for this instrument, so WalletStack is showing a derived intraday chart from the latest live quote.
        </div>
      )}
      <div
        ref={chartContainerRef}
        className="w-full h-[320px]"
        role="img"
        aria-label={`Price chart with ${data.length} data points. Enable chart data table for tabular values.`}
      />
      {settings.showChartTable && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-emerald-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <caption className="sr-only">Recent chart data</caption>
            <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">Date</th>
                <th scope="col" className="px-3 py-2 text-right">Open</th>
                <th scope="col" className="px-3 py-2 text-right">High</th>
                <th scope="col" className="px-3 py-2 text-right">Low</th>
                <th scope="col" className="px-3 py-2 text-right">Close</th>
                <th scope="col" className="px-3 py-2 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr key={`${row.date}-${index}`} className="border-t border-emerald-100 dark:border-slate-800">
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCell(row.open)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCell(row.high)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCell(row.low)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCell(row.close || row.price)}</td>
                  <td className="px-3 py-2 text-right font-mono">{row.volume?.toLocaleString() || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatCell(value) {
  if (value == null || Number.isNaN(Number(value))) return 'N/A';
  return Number(value).toFixed(2);
}
