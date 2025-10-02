import { useQuery } from "@tanstack/react-query";
import type { TappPool } from "@prisma/client";

/**
 * @notice Hook to fetch all active Tapp AMM pools
 * @returns React Query result with pools array, loading and error states
 */
export function usePools() {
  return useQuery<TappPool[]>({
    queryKey: ["pools"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/tapp/pools");

        if (!response.ok) {
          console.error("[usePools] API response not OK:", response.status);
          return [];
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.error("[usePools] API response is not an array:", data);
          return [];
        }

        return data;
      } catch (error) {
        console.error("[usePools] Error fetching pools:", error);
        return [];
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds to show new pools
  });
}
