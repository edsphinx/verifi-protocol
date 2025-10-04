"use client";

/**
 * Hook to fetch user's active positions in markets
 */

import { useQuery } from "@tanstack/react-query";
import { aptosClient } from "@/aptos/client";
import { MODULE_ADDRESS } from "@/aptos/constants";

interface Position {
  marketAddress: string;
  marketTitle: string;
  yesBalance: number;
  noBalance: number;
  totalValue: number; // In APT
  marketStatus: number; // 0: OPEN, 1: CLOSED, 2: RESOLVED_YES, 3: RESOLVED_NO
}

async function fetchUserPositions(userAddress: string): Promise<Position[]> {
  const client = aptosClient();

  try {
    // Get all markets from registry
    const result = await client.view({
      payload: {
        function:
          `${MODULE_ADDRESS}::verifi_protocol::get_all_market_addresses` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [],
      },
    });

    const marketAddresses = (result[0] as string[]) || [];

    // Fetch balances for each market
    const positions: Position[] = [];

    for (const marketAddress of marketAddresses) {
      try {
        // Get user balances for this market
        const balances = await client.view({
          payload: {
            function:
              `${MODULE_ADDRESS}::verifi_protocol::get_balances` as `${string}::${string}::${string}`,
            typeArguments: [],
            functionArguments: [userAddress, marketAddress],
          },
        });

        const yesBalance = Number(balances[0] || 0);
        const noBalance = Number(balances[1] || 0);

        // Only include if user has position
        if (yesBalance > 0 || noBalance > 0) {
          // Get market details from database
          const marketResponse = await fetch(`/api/markets/${marketAddress}`);
          const marketData = await marketResponse.json();

          // Get market status from chain
          const marketState = await client.view({
            payload: {
              function:
                `${MODULE_ADDRESS}::verifi_protocol::get_market_state` as `${string}::${string}::${string}`,
              typeArguments: [],
              functionArguments: [marketAddress],
            },
          });

          const status = Number(marketState[0] || 0);

          positions.push({
            marketAddress,
            marketTitle: marketData.description || "Unknown Market",
            yesBalance: yesBalance / 1e6, // Convert from micro units
            noBalance: noBalance / 1e6,
            totalValue: (yesBalance + noBalance) / 1e8, // Approximate value in APT
            marketStatus: status,
          });
        }
      } catch (error) {
        console.error(
          `Error fetching position for market ${marketAddress}:`,
          error,
        );
      }
    }

    return positions;
  } catch (error) {
    console.error("Error fetching user positions:", error);
    return [];
  }
}

export function useUserPositions(userAddress?: string) {
  return useQuery({
    queryKey: ["positions", userAddress],
    queryFn: () => {
      if (!userAddress) return [];
      return fetchUserPositions(userAddress);
    },
    enabled: !!userAddress,
    staleTime: 60000, // Consider data fresh for 60s
    // Removed refetchInterval - refetches on window focus or manual invalidation
  });
}
