import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { watchlistService } from '../services/watchlist.service';

export const useWatchlist = () => {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistService.getWatchlist(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useWatchlistStatus = (symbol) => {
  return useQuery({
    queryKey: ['watchlist', 'status', symbol],
    queryFn: () => watchlistService.checkWatchlist(symbol),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
};

export const useToggleWatchlist = () => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (symbol) => watchlistService.addToWatchlist(symbol),
    onSuccess: (_, symbol) => {
      queryClient.invalidateQueries(['watchlist']);
      queryClient.invalidateQueries(['watchlist', 'status', symbol]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (symbol) => watchlistService.removeFromWatchlist(symbol),
    onSuccess: (_, symbol) => {
      queryClient.invalidateQueries(['watchlist']);
      queryClient.invalidateQueries(['watchlist', 'status', symbol]);
    },
  });

  return { addMutation, removeMutation };
};
