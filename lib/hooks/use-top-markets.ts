/**
 * @file Top Markets Hook
 * @description Custom hook for accessing top-performing markets
 */

import { useEffect } from "react";
import { useAnalyticsStore } from "@/lib/stores";

export function useTopMarkets(limit = 10) {
  const topMarkets = useAnalyticsStore((state) => state.topMarkets);
  const isLoading = useAnalyticsStore((state) => state.isLoadingMarkets);
  const error = useAnalyticsStore((state) => state.error);
  const fetchTopMarkets = useAnalyticsStore((state) => state.fetchTopMarkets);
  const getTopMarket = useAnalyticsStore((state) => state.getTopMarket);

  // Auto-fetch on mount or when limit changes
  useEffect(() => {
    if (topMarkets.length === 0 && !isLoading) {
      fetchTopMarkets(limit);
    }
  }, [limit, topMarkets.length, isLoading, fetchTopMarkets]);

  return {
    topMarkets,
    topMarket: getTopMarket(),
    isLoading,
    error,
    refetch: () => fetchTopMarkets(limit),
  };
}
