"use client";

import { useQuery } from "@tanstack/react-query";
import { aptosClient } from "@/aptos/client";
import type { LpPositionOwnershipMap } from "@/lib/types";
import { TAPP_HOOK_MODULE, TAPP_FUNCTIONS, TAPP_EVENTS } from "../constants";

export interface UserPosition {
  positionIdx: number;
  yesAmount: number;
  noAmount: number;
  liquidityTokens: number;
  entryTimestamp: number;
  provider: string;
}

/**
 * Fetches all LP positions for a user in a specific pool by querying LiquidityAdded events
 */
async function fetchUserPositions(
  poolAddress: string,
  userAddress: string
): Promise<UserPosition[]> {
  try {
    console.log(`[fetchUserPositions] Querying events for pool: ${poolAddress}, user: ${userAddress}`);
    console.log(`[fetchUserPositions] Event type: ${TAPP_EVENTS.LIQUIDITY_ADDED}`);

    // Filter events for this user and extract position data
    const userPositions: UserPosition[] = [];

    // Note: Event querying via SDK is complex and may not work reliably
    // Skip event-based approach and go straight to fallback
    console.log("[fetchUserPositions] Skipping event query, using fallback method...");

    // Load position ownership from localStorage
    let ownedPositions: Set<number> = new Set();
    try {
      const storageKey = `lp_positions_${poolAddress}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const positions: LpPositionOwnershipMap = JSON.parse(stored);
        // Find positions owned by this user
        for (const [idx, owner] of Object.entries(positions)) {
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            ownedPositions.add(Number(idx));
          }
        }
        console.log(`[fetchUserPositions] Found ${ownedPositions.size} owned positions in localStorage:`, Array.from(ownedPositions));
      }
    } catch (error) {
      console.error("[fetchUserPositions] Failed to load position ownership:", error);
    }

    // If no positions found via events, try fallback: iterate all positions
    if (userPositions.length === 0) {
      console.log("[fetchUserPositions] No positions found via events, trying fallback method...");

      try {
        // Get total position count from pool stats
        const stats = await aptosClient().view({
          payload: {
            function:
              `${TAPP_HOOK_MODULE}::${TAPP_FUNCTIONS.GET_POOL_STATS}` as `${string}::${string}::${string}`,
            typeArguments: [],
            functionArguments: [poolAddress],
          },
        });

        const positionCount = Number(stats[4]); // positions_count is 5th element
        console.log(`[fetchUserPositions] Pool has ${positionCount} total positions`);

        // Iterate through positions
        for (let i = 0; i < positionCount; i++) {
          // If we have localStorage data, only fetch positions owned by this user
          if (ownedPositions.size > 0 && !ownedPositions.has(i)) {
            console.log(`[fetchUserPositions] Skipping position ${i} (not owned by user)`);
            continue;
          }

          try {
            const position = await aptosClient().view({
              payload: {
                function:
                  `${TAPP_HOOK_MODULE}::${TAPP_FUNCTIONS.GET_POSITION}` as `${string}::${string}::${string}`,
                typeArguments: [],
                functionArguments: [poolAddress, i.toString()],
              },
            });

            const [yesAmount, noAmount, liquidityTokens, entryTimestamp] = position as [
              string,
              string,
              string,
              string
            ];

            // Only include positions with liquidity
            if (Number(liquidityTokens) > 0) {
              userPositions.push({
                positionIdx: i,
                yesAmount: Number(yesAmount) / 1_000_000,
                noAmount: Number(noAmount) / 1_000_000,
                liquidityTokens: Number(liquidityTokens) / 1_000_000,
                entryTimestamp: Number(entryTimestamp),
                provider: ownedPositions.has(i) ? userAddress : "unknown",
              });
              console.log(`[fetchUserPositions] Found position ${i} with ${Number(liquidityTokens) / 1_000_000} LP tokens`);
            }
          } catch (err) {
            // Position might not exist or be withdrawn
            console.log(`[fetchUserPositions] Position ${i} not accessible`);
          }
        }
      } catch (fallbackError) {
        console.error("[fetchUserPositions] Fallback method also failed:", fallbackError);
      }
    }

    // Sort by position index
    userPositions.sort((a, b) => a.positionIdx - b.positionIdx);

    console.log(`[fetchUserPositions] Returning ${userPositions.length} positions`);
    return userPositions;
  } catch (error) {
    console.error("[fetchUserPositions] Error:", error);
    return [];
  }
}

/**
 * Hook to fetch user's LP positions in a pool
 */
export function useUserPositions(poolAddress: string, userAddress?: string) {
  return useQuery({
    queryKey: ["user-positions", poolAddress, userAddress],
    queryFn: () => {
      if (!userAddress || !poolAddress) {
        return [];
      }
      return fetchUserPositions(poolAddress, userAddress);
    },
    enabled: !!userAddress && !!poolAddress,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });
}
