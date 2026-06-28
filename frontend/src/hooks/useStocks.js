import { useQuery } from '@tanstack/react-query';
import { stockService } from '../services/stock.service';

export const useSearchStocks = (query) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => stockService.searchStocks(query),
    // Only fire the query if the search string is at least 2 characters
    enabled: !!query && query.length >= 2,
    // Keep search results fresh in cache for 5 minutes
    staleTime: 5 * 60 * 1000, 
  });
};

export const useStockQuote = (symbol) => {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => stockService.getStockQuote(symbol),
    enabled: !!symbol,
    // Refetch every 3 seconds for live trading platform feel
    refetchInterval: 3000,
    staleTime: 3000,
  });
};

export const useStockChart = (symbol, range) => {
  return useQuery({
    queryKey: ['chart', symbol, range],
    queryFn: () => stockService.getStockChart(symbol, range),
    enabled: !!symbol && !!range,
    // Refetch chart every 10 seconds 
    refetchInterval: 10000,
    staleTime: 10000,
  });
};

export const useAiInsights = (symbol) => {
  return useQuery({
    queryKey: ['insights', symbol],
    queryFn: () => stockService.getAiInsights(symbol),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000, // AI insights are expensive, cache them longer (10 mins)
    retry: 0, // Fail fast if OpenAI is struggling
  });
};
