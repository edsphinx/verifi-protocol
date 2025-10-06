/**
 * @file Portfolio Hook
 * @description Custom hook for accessing user portfolio data
 */

import { useEffect } from "react";
import { usePortfolioStore } from "@/lib/stores";

export function usePortfolio(userAddress?: string) {
  const portfolio = usePortfolioStore((state) => state.portfolio);
  const isLoading = usePortfolioStore((state) => state.isLoading);
  const error = usePortfolioStore((state) => state.error);
  const lastUpdated = usePortfolioStore((state) => state.lastUpdated);
  const fetchPortfolio = usePortfolioStore((state) => state.fetchPortfolio);
  const refreshPortfolio = usePortfolioStore((state) => state.refreshPortfolio);

  // Computed selectors
  const totalValue = usePortfolioStore((state) => state.getTotalValue());
  const totalPnL = usePortfolioStore((state) => state.getTotalPnL());
  const totalPnLPct = usePortfolioStore((state) => state.getTotalPnLPct());
  const openPositionsCount = usePortfolioStore((state) =>
    state.getOpenPositionsCount(),
  );
  const bestPosition = usePortfolioStore((state) => state.getBestPosition());
  const worstPosition = usePortfolioStore((state) => state.getWorstPosition());
  const roi = usePortfolioStore((state) => state.getROI());
  const isDiversified = usePortfolioStore((state) => state.isDiversified());

  // Auto-fetch when user address is provided
  useEffect(() => {
    if (userAddress) {
      fetchPortfolio(userAddress);
    }
  }, [userAddress, fetchPortfolio]);

  return {
    portfolio,
    isLoading,
    error,
    lastUpdated,
    totalValue,
    totalPnL,
    totalPnLPct,
    openPositionsCount,
    bestPosition,
    worstPosition,
    roi,
    isDiversified,
    refetch: refreshPortfolio,
  };
}
