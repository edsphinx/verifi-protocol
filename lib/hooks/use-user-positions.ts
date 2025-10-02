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
}

async function fetchUserPositions(userAddress: string): Promise<Position[]> {
  const client = aptosClient();

  try {
    // Get all markets from registry
    const result = await client.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_all_market_addresses` as `${string}::${string}::${string}`,
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
            function: `${MODULE_ADDRESS}::verifi_protocol::get_balances` as `${string}::${string}::${string}`,
            typeArguments: [],
            functionArguments: [marketAddress, userAddress],
          },
        });

        const yesBalance = Number(balances[0] || 0);
        const noBalance = Number(balances[1] || 0);

        // Only include if user has position
        if (yesBalance > 0 || noBalance > 0) {
          // Get market details from database
          const marketResponse = await fetch(`/api/markets/${marketAddress}`);
          const marketData = await marketResponse.json();

          positions.push({
            marketAddress,
            marketTitle: marketData.description || "Unknown Market",
            yesBalance: yesBalance / 1e6, // Convert from micro units
            noBalance: noBalance / 1e6,
            totalValue: (yesBalance + noBalance) / 1e8, // Approximate value in APT
          });
        }
      } catch (error) {
        console.error(`Error fetching position for market ${marketAddress}:`, error);
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
    refetchInterval: 30000, // Refetch every 30s
  });
}
