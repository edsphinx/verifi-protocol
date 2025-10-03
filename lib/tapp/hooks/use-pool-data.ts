"use client";

import { useQuery } from "@tanstack/react-query";
import { useTappMode } from "../context/TappModeContext";
import { generateMockPoolData, type PoolData } from "../mock/pool-data";
import { aptosClient } from "@/aptos/client";
import { TAPP_HOOK_MODULE, TAPP_FUNCTIONS } from "../constants";

/**
 * Fetches user's liquidity positions for a specific pool
 * Uses localStorage for persistence until we implement blockchain fetching
 */
async function fetchUserPositions(
  poolAddress: string,
  userAddress: string,
  marketId: string
): Promise<any[]> {
  try {
    console.log(`[fetchUserPositions] Fetching positions for user: ${userAddress}, pool: ${poolAddress}`);

    // Load positions from localStorage
    try {
      const storageKey = `tapp_positions_${marketId}_${userAddress}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const positions = JSON.parse(stored);
        console.log(`[fetchUserPositions] Loaded ${positions.length} positions from localStorage`);
        return positions;
      }
    } catch (error) {
      console.error('[fetchUserPositions] Failed to load from localStorage:', error);
    }

    // TODO: Implement proper blockchain fetching
    // For now, return empty array if nothing in localStorage
    console.log(`[fetchUserPositions] No positions found in localStorage`);
    return [];

  } catch (error) {
    console.error("[fetchUserPositions] Error:", error);
    return [];
  }
}

/**
 * Fetches live pool data from the blockchain
 */
async function fetchLivePoolData(marketId: string, userAddress?: string): Promise<PoolData> {

  // First, get pool address from database
  const poolDbResponse = await fetch(`/api/tapp/pools/by-market/${marketId}`);

  if (!poolDbResponse.ok) {
    throw new Error(
      `Pool not found for market ${marketId}. Create a pool first.`,
    );
  }

  const poolDb = await poolDbResponse.json();
  const poolAddress = poolDb.poolAddress;

  if (!poolAddress || poolAddress === 'unknown') {
    throw new Error(
      `Invalid pool address for market ${marketId}. Pool may not be properly indexed.`,
    );
  }

  console.log(`[fetchLivePoolData] Using pool address: ${poolAddress} for market: ${marketId}`);

  try {
    // Fetch pool stats (includes reserves, fees, position count, trading status)
    console.log(`[fetchLivePoolData] Fetching pool stats for: ${poolAddress}`);
    const stats = await aptosClient().view({
      payload: {
        function: `${TAPP_HOOK_MODULE}::${TAPP_FUNCTIONS.GET_POOL_STATS}` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [poolAddress],
      },
    });

    console.log(`[fetchLivePoolData] Raw stats:`, stats);
    const [reserveYes, reserveNo, feeYes, feeNo, positionCount, isTrading] = stats as [
      string,
      string,
      string,
      string,
      string,
      boolean,
    ];

    console.log(`[fetchLivePoolData] Reserves: YES=${reserveYes}, NO=${reserveNo}`);
    console.log(`[fetchLivePoolData] Trading enabled: ${isTrading}`);

    // Fetch current fee
    const currentFeeResult = await aptosClient().view({
      payload: {
        function: `${TAPP_HOOK_MODULE}::${TAPP_FUNCTIONS.GET_CURRENT_FEE}` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [poolAddress],
      },
    });

    const currentFee = Number(currentFeeResult[0]);

    // Fetch user positions if user is connected
    let positions = [];
    if (userAddress) {
      positions = await fetchUserPositions(poolAddress, userAddress, marketId);
    }

    const poolData = {
      poolAddress,
      marketAddress: marketId,
      yesReserve: Number(reserveYes),
      noReserve: Number(reserveNo),
      totalLiquidity: Number(reserveYes) + Number(reserveNo),
      volume24h: 0, // TODO: Track via indexer events
      volume7d: 0, // TODO: Track via indexer events
      currentFee,
      tradingEnabled: isTrading,
      createdAt: 0, // TODO: From pool creation event
      lastUpdated: Date.now(),
      positions,
      priceHistory: [], // TODO: Fetch from indexer
    };

    console.log('[fetchLivePoolData] Final pool data:', poolData);
    return poolData;
  } catch (error: any) {
    console.error("[fetchLivePoolData] Error fetching live pool data:", error);
    console.error("[fetchLivePoolData] Error message:", error?.message);
    console.error("[fetchLivePoolData] Error details:", {
      poolAddress,
      marketId,
      hookModule: TAPP_HOOK_MODULE,
      error: error
    });
    throw new Error(
      `Pool not found for market ${marketId}. Error: ${error?.message || 'Unknown error'}`,
    );
  }
}

/**
 * Hook to get pool data (mock or live based on mode)
 */
export function usePoolData(marketId: string, userAddress?: string) {
  const { isDemo } = useTappMode();

  return useQuery({
    queryKey: ["pool-data", marketId, userAddress, isDemo ? "demo" : "live"],
    queryFn: async () => {
      if (isDemo) {
        // Return mock data in DEMO mode
        return generateMockPoolData(marketId);
      } else {
        // Fetch live data in LIVE mode
        return await fetchLivePoolData(marketId, userAddress);
      }
    },
    // In live mode, allow refetch on mount to catch recent pool creation
    // In demo mode, cache indefinitely
    refetchOnWindowFocus: false,
    refetchOnMount: !isDemo, // Refetch on mount in live mode
    staleTime: isDemo ? Infinity : 0,
  });
}

/**
 * Hook to check if a pool exists for a market
 */
export function usePoolExists(marketId: string) {
  const { isDemo } = useTappMode();

  return useQuery({
    queryKey: ["pool-exists", marketId, isDemo ? "demo" : "live"],
    queryFn: async () => {
      if (isDemo) {
        // In demo mode, pools always exist
        return true;
      } else {
        // TODO: Check if pool exists on-chain
        // const poolAddress = await getPoolAddress(marketId);
        // const exists = await checkResourceExists(poolAddress, "PredictionPoolState");
        // return exists;
        return false;
      }
    },
  });
}
