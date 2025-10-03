"use client";

import { useQuery } from "@tanstack/react-query";
import { useTappMode } from "../context/TappModeContext";
import { generateMockPoolData, type PoolData } from "../mock/pool-data";
import { aptosClient } from "@/aptos/client";
import { TAPP_HOOK_MODULE, TAPP_FUNCTIONS } from "../constants";

/**
 * Fetches live pool data from the blockchain
 */
async function fetchLivePoolData(marketId: string): Promise<PoolData> {

  // Get market details to find YES/NO tokens
  const market = await aptosClient().getAccountResource({
    accountAddress: marketId,
    resourceType: `${process.env.NEXT_PUBLIC_MODULE_ADDRESS}::verifi_protocol::Market`,
  });

  const marketData = market.data as any;
  const yesTokenAddr = marketData.yes_token_metadata.inner;
  const noTokenAddr = marketData.no_token_metadata.inner;

  // Calculate deterministic pool address using pool_seed
  // In Tapp, pool address is derived from seed
  // For now, we'll try to get it from a registry or use a known pattern
  // TODO: Implement proper pool address derivation
  const poolAddress = marketId; // Placeholder - needs proper implementation

  try {
    // Fetch pool reserves
    const reserves = await aptosClient().view({
      payload: {
        function: `${TAPP_HOOK_MODULE}::${TAPP_FUNCTIONS.GET_RESERVES}` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [poolAddress],
      },
    });

    const [reserveYes, reserveNo] = reserves as [string, string];

    // Fetch pool stats
    const stats = await aptosClient().view({
      payload: {
        function: `${TAPP_HOOK_MODULE}::${TAPP_FUNCTIONS.GET_POOL_STATS}` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [poolAddress],
      },
    });

    const [, , feeYes, feeNo, positionCount, isTrading] = stats as [
      string,
      string,
      string,
      string,
      string,
      boolean,
    ];

    // Fetch current fee
    const currentFeeResult = await aptosClient().view({
      payload: {
        function: `${TAPP_HOOK_MODULE}::${TAPP_FUNCTIONS.GET_CURRENT_FEE}` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [poolAddress],
      },
    });

    const currentFee = Number(currentFeeResult[0]);

    return {
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
      positions: [], // TODO: Fetch actual positions
      priceHistory: [], // TODO: Fetch from indexer
    };
  } catch (error) {
    console.error("Error fetching live pool data:", error);
    throw new Error(
      `Pool not found for market ${marketId}. Make sure a pool has been created for this market.`,
    );
  }
}

/**
 * Hook to get pool data (mock or live based on mode)
 */
export function usePoolData(marketId: string) {
  const { isDemo } = useTappMode();

  return useQuery({
    queryKey: ["pool-data", marketId, isDemo ? "demo" : "live"],
    queryFn: async () => {
      if (isDemo) {
        // Return mock data in DEMO mode
        return generateMockPoolData(marketId);
      } else {
        // Fetch live data in LIVE mode
        return await fetchLivePoolData(marketId);
      }
    },
    // NO auto-refetch - rely on manual invalidation after transactions
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
