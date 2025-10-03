"use client";

/**
 * PoolSection Component
 * Displays Tapp AMM pool information for a market
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePoolButton } from "./CreatePoolButton";
import { PoolOverview } from "@/components/views/market/TappAMM/PoolOverview";

interface PoolSectionProps {
  marketAddress: string;
  yesTokenAddress?: string;
  noTokenAddress?: string;
}

export function PoolSection({
  marketAddress,
  yesTokenAddress,
  noTokenAddress,
}: PoolSectionProps) {
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [isCheckingPool, setIsCheckingPool] = useState(true);

  const checkPoolExists = async () => {
    setIsCheckingPool(true);
    try {
      const response = await fetch(
        `/api/tapp/pools/by-market/${marketAddress}`
      );
      setPoolExists(response.ok);
      console.log('[PoolSection] Pool exists check:', response.ok, 'for market:', marketAddress);
    } catch (error) {
      console.error("[PoolSection] Failed to check pool existence:", error);
      setPoolExists(false);
    } finally {
      setIsCheckingPool(false);
    }
  };

  useEffect(() => {
    checkPoolExists();
  }, [marketAddress]);

  const isLoading = isCheckingPool;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AMM Liquidity Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (poolExists === false) {
    // Only show create button if token addresses are available
    if (yesTokenAddress && noTokenAddress) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>AMM Liquidity Pool</CardTitle>
            <CreatePoolButton
              marketAddress={marketAddress}
              yesTokenAddress={yesTokenAddress}
              noTokenAddress={noTokenAddress}
              onPoolCreated={() => {
                // Refetch pool after creation with delay for indexing
                setTimeout(() => {
                  checkPoolExists();
                }, 3000);
              }}
            />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No AMM pool exists for this market yet. Create one to enable
              automated trading and liquidity provision.
            </p>
          </CardContent>
        </Card>
      );
    }

    // If no pool and no token addresses, don't show anything
    return null;
  }

  // Pool exists, show live data using PoolOverview component
  // PoolOverview handles its own data fetching internally
  console.log('[PoolSection] Rendering PoolOverview for market:', marketAddress);

  return (
    <PoolOverview marketId={marketAddress} />
  );
}
