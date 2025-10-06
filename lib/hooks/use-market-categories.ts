/**
 * @file Market Categories Hook
 * @description Custom hook for market distribution by category
 */

import { useQuery } from "@tanstack/react-query";

interface CategoryStats {
  category: string;
  count: number;
  volume: number;
  percentage: number;
}

interface MarketCategoriesResponse {
  categories: CategoryStats[];
  total: number;
}

export function useMarketCategories() {
  return useQuery<MarketCategoriesResponse>({
    queryKey: ["market-categories"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/market-categories");

      if (!response.ok) {
        throw new Error("Failed to fetch market categories");
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
  });
}
