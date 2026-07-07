import { useQuery } from '@tanstack/react-query'
import { stockService } from '../services/stock.service'
import { API_CONFIG } from '../constants'

export const useSearchStocks = (query) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => stockService.searchStocks(query),
    // Only fire the query if the search string is at least 2 characters
    enabled: !!query && query.length >= 2,
    // Keep search results fresh in cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  })
}

export const useStockQuote = (symbol) => {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stockService.getStockQuote(symbol),
    enabled: !!symbol,
    // OPTIMIZED: Reduced from 3s to 60s (20x reduction)
    // Live market data doesn't change that fast, 60s is still responsive
    refetchInterval: API_CONFIG.POLLING_INTERVALS.QUOTE,
    staleTime: API_CONFIG.POLLING_INTERVALS.QUOTE,
  })
}

export const useStockChart = (symbol, range) => {
  return useQuery({
    queryKey: ['chart', symbol, range],
    queryFn: () => stockService.getStockChart(symbol, range),
    enabled: !!symbol && !!range,
    // OPTIMIZED: Reduced from 10s to 5min (30x reduction)
    // Chart data doesn't need to update that frequently
    refetchInterval: API_CONFIG.POLLING_INTERVALS.CHART,
    staleTime: API_CONFIG.POLLING_INTERVALS.CHART,
  })
}

export const useAiInsights = (symbol) => {
  return useQuery({
    queryKey: ['insights', symbol],
    queryFn: () => stockService.getAiInsights(symbol),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000, // AI insights are expensive, cache them longer (10 mins)
    retry: 0, // Fail fast if OpenAI is struggling
  })
}
