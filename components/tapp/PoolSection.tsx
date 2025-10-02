"use client";

/**
 * PoolSection Component
 * Displays Tapp AMM pool information for a market
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePoolButton } from "./CreatePoolButton";
import { PoolStats } from "./PoolStats";
import type { TappPool } from "@/lib/interfaces";

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
  const [pool, setPool] = useState<TappPool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPool = async () => {
      try {
        const response = await fetch(
          `/api/tapp/pools/by-market/${marketAddress}`
        );
        if (response.ok) {
          const data = await response.json();
          setPool(data);
        }
      } catch (error) {
        console.error("Failed to fetch pool:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPool();
  }, [marketAddress]);

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

  if (!pool) {
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
                // Refetch pool after creation
                setIsLoading(true);
                setTimeout(() => {
                  setIsLoading(false);
                }, 2000);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AMM Liquidity Pool</h2>
      </div>
      <PoolStats pool={pool} />
    </div>
  );
}
