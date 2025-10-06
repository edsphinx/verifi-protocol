/**
 * @file Volume History Hook
 * @description Custom hook for historical volume data
 */

import { useQuery } from "@tanstack/react-query";

interface VolumeDataPoint {
  date: string;
  volume: number;
  trades: number;
}

interface VolumeHistoryResponse {
  data: VolumeDataPoint[];
  total: number;
  average: number;
}

export function useVolumeHistory(days = 7) {
  return useQuery<VolumeHistoryResponse>({
    queryKey: ["volume-history", days],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/volume-history?days=${days}`);

      if (!response.ok) {
        throw new Error("Failed to fetch volume history");
      }

      return response.json();
    },
    staleTime: 60000, // 1 minute
  });
}
