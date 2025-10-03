"use client";

import { useEffect, useState } from "react";
import { SwapInterface } from "./TappAMM/SwapInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SwapTabContentProps {
  marketId: string;
}

export function SwapTabContent({ marketId }: SwapTabContentProps) {
  const [poolData, setPoolData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPoolData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tapp/pools/by-market/${marketId}`);
      if (response.ok) {
        const data = await response.json();
        setPoolData(data);
      } else {
        setPoolData(null);
      }
    } catch (error) {
      console.error("Error fetching pool data:", error);
      setPoolData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, [marketId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If pool doesn't exist, show create pool message
  if (!poolData) {
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
                    Go to the "Add Liquidity" tab to create an AMM pool for this market
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const liquidityTab = document.querySelector('[value="liquidity"]') as HTMLButtonElement;
              if (liquidityTab) {
                liquidityTab.click();
              }
            }}
          >
            Go to Add Liquidity
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if pool has liquidity
  const hasLiquidity = poolData.totalLiquidity > 0;

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

          <Button
            onClick={() => {
              const liquidityTab = document.querySelector('[value="liquidity"]') as HTMLButtonElement;
              if (liquidityTab) {
                liquidityTab.click();
              }
            }}
          >
            Add Liquidity
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pool exists and has liquidity, show swap interface
  return <SwapInterface marketId={marketId} />;
}
