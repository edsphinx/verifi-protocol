"use client";

/**
 * Hook to fetch user's trading activities
 */

import { useQuery } from "@tanstack/react-query";
import type { Activity } from "@prisma/client";

interface ActivitiesResponse {
  activities: Activity[];
}

export function useUserActivities(userAddress?: string, limit = 50) {
  return useQuery({
    queryKey: ["activities", userAddress, limit],
    queryFn: async () => {
      if (!userAddress) return { activities: [] };

      const response = await fetch(
        `/api/activities/user/${userAddress}?limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      return response.json() as Promise<ActivitiesResponse>;
    },
    enabled: !!userAddress,
    staleTime: 30000, // Consider data fresh for 30s
    // Removed refetchInterval
  });
}
