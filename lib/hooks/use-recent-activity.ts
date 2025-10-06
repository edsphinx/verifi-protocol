/**
 * @file Recent Activity Hook
 * @description Custom hook for fetching recent platform activities
 */

import { useQuery } from "@tanstack/react-query";
import type { Activity } from "@/lib/types/database.types";

interface RecentActivityResponse {
  activities: Activity[];
  total: number;
}

export function useRecentActivity(limit = 20) {
  return useQuery<RecentActivityResponse>({
    queryKey: ["recent-activity", limit],
    queryFn: async () => {
      const response = await fetch(`/api/activities/recent?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch recent activities");
      }

      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
}
