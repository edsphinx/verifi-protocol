"use client";

import { useEffect, useState } from "react";
import { LiquidityPanel } from "./TappAMM/LiquidityPanel";
import { CreatePoolButton } from "@/components/tapp/CreatePoolButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Droplet } from "lucide-react";

interface PoolTabContentProps {
  marketId: string;
  yesTokenAddress: string;
  noTokenAddress: string;
  yesReserve: number;
  noReserve: number;
  tradingEnabled: boolean;
}

export function PoolTabContent({
  marketId,
  yesTokenAddress,
  noTokenAddress,
  yesReserve,
  noReserve,
  tradingEnabled,
}: PoolTabContentProps) {
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkPoolExists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tapp/pools/by-market/${marketId}`);
      setPoolExists(response.ok);
    } catch (error) {
      console.error("Error checking pool existence:", error);
      setPoolExists(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkPoolExists();
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

  // If pool doesn't exist, show create pool UI
  if (!poolExists) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Droplet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-lg">AMM Pool Not Created</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Create a liquidity pool to enable automated market making for this market
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool Type:</span>
                <span className="font-medium">Prediction Market</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trading Fee:</span>
                <span className="font-medium">0.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assets:</span>
                <span className="font-medium">YES / NO Tokens</span>
              </div>
            </div>
          </div>

          <CreatePoolButton
            marketAddress={marketId}
            yesTokenAddress={yesTokenAddress}
            noTokenAddress={noTokenAddress}
            onPoolCreated={() => {
              // Wait for indexing then recheck
              setTimeout(() => {
                checkPoolExists();
              }, 3000);
            }}
          />

          <p className="text-xs text-muted-foreground text-center max-w-md">
            Once created, you and others will be able to add liquidity and earn fees from trades
          </p>
        </CardContent>
      </Card>
    );
  }

  // Pool exists, show add liquidity interface
  return (
    <LiquidityPanel
      marketId={marketId}
      yesReserve={yesReserve}
      noReserve={noReserve}
      tradingEnabled={tradingEnabled}
    />
  );
}
