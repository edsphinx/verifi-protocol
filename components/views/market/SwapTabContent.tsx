"use client";

import { AlertCircle, ArrowLeftRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePoolData } from "@/lib/tapp/hooks/use-pool-data";
import { SwapInterface } from "./TappAMM/SwapInterface";

interface SwapTabContentProps {
  marketId: string;
  onNavigateToLiquidity?: () => void;
}

export function SwapTabContent({
  marketId,
  onNavigateToLiquidity,
}: SwapTabContentProps) {
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [isCheckingPool, setIsCheckingPool] = useState(true);

  // Use the pool data hook to get live data from blockchain
  const { data: poolData, isLoading: isLoadingPoolData } = usePoolData(
    marketId,
    undefined,
  );

  // Check if pool exists in database
  useEffect(() => {
    const checkPoolExists = async () => {
      setIsCheckingPool(true);
      try {
        const response = await fetch(`/api/tapp/pools/by-market/${marketId}`);
        setPoolExists(response.ok);
      } catch (error) {
        console.error("Error checking pool existence:", error);
        setPoolExists(false);
      } finally {
        setIsCheckingPool(false);
      }
    };

    checkPoolExists();
  }, [marketId]);

  const isLoading = isCheckingPool || isLoadingPoolData;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If pool doesn't exist in database, show create pool message
  if (poolExists === false) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-lg">AMM Pool Required</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            An AMM pool must be created before you can swap tokens
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Pool Not Found</p>
                  <p className="text-xs text-muted-foreground">
                    Go to the "Add Liquidity" tab to create an AMM pool for this
                    market
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={onNavigateToLiquidity}>
            Go to Add Liquidity
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if pool has liquidity (use live blockchain data)
  // poolData comes from usePoolData which fetches reserves from blockchain
  const yesReserve = poolData?.yesReserve ?? 0;
  const noReserve = poolData?.noReserve ?? 0;
  const hasLiquidity = yesReserve > 0 && noReserve > 0;

  console.log("[SwapTabContent] Pool data:", {
    yesReserve,
    noReserve,
    hasLiquidity,
    poolData,
  });

  if (!hasLiquidity) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ArrowLeftRight className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-lg">No Liquidity Available</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            The pool exists but has no liquidity. Add liquidity to enable swaps.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Liquidity Required</p>
                  <p className="text-xs text-muted-foreground">
                    Be the first to add liquidity and earn trading fees
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={onNavigateToLiquidity}>Add Liquidity</Button>
        </CardContent>
      </Card>
    );
  }

  // Pool exists and has liquidity, show swap interface
  return <SwapInterface marketId={marketId} />;
}
