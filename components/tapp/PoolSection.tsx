"use client";

/**
 * PoolSection Component
 * Displays Tapp AMM pool information for a market
 */

import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { CreatePoolButton } from "./CreatePoolButton";
import { PoolOverview } from "@/components/views/market/TappAMM/PoolOverview";

interface PoolSectionProps {
  marketAddress: string;
  yesTokenAddress?: string;
  noTokenAddress?: string;
}

async function checkPoolExists(marketAddress: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/tapp/pools/by-market/${marketAddress}`);
    console.log(
      "[PoolSection] Pool exists check:",
      response.ok,
      "for market:",
      marketAddress,
    );
    return response.ok;
  } catch (error) {
    console.error("[PoolSection] Failed to check pool existence:", error);
    return false;
  }
}

export function PoolSection({
  marketAddress,
  yesTokenAddress,
  noTokenAddress,
}: PoolSectionProps) {
  const {
    data: poolExists,
    isLoading: isCheckingPool,
    isError,
  } = useQuery({
    queryKey: ["pool-exists", marketAddress],
    queryFn: () => checkPoolExists(marketAddress),
    refetchInterval: 3000, // Auto-refetch every 3 seconds
    staleTime: 1000,
    retry: 2, // Retry failed requests twice
    retryDelay: 1000,
  });

  const isLoading = isCheckingPool;

  if (isLoading) {
    return (
      <Card className="min-h-[280px] flex items-center justify-center">
        <VeriFiLoader message="Checking pool..." />
      </Card>
    );
  }

  // Defensive: handle errors gracefully
  if (isError) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-muted-foreground">
            AMM Liquidity Pool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to check pool status. Please refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (poolExists === false) {
    // Only show create button if token addresses are available
    if (yesTokenAddress && noTokenAddress) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AMM Liquidity Pool</CardTitle>
              <CreatePoolButton
                marketAddress={marketAddress}
                yesTokenAddress={yesTokenAddress}
                noTokenAddress={noTokenAddress}
              />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No AMM pool exists for this market yet. Create one to enable
                automated trading and liquidity provision.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    // If no pool and no token addresses, don't show anything
    return null;
  }

  // Pool exists, show live data using PoolOverview component
  // PoolOverview handles its own data fetching internally
  console.log(
    "[PoolSection] Rendering PoolOverview for market:",
    marketAddress,
  );

  return <PoolOverview marketId={marketAddress} />;
}
