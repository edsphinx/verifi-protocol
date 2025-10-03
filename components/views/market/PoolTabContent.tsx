"use client";

import { useEffect, useState } from "react";
import { LiquidityPanel } from "./TappAMM/LiquidityPanel";
import { LiquidityPositions } from "./TappAMM/LiquidityPositions";
import { CreatePoolButton } from "@/components/tapp/CreatePoolButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Droplet } from "lucide-react";
import { usePoolData } from "@/lib/tapp/hooks/use-pool-data";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

interface PoolTabContentProps {
  marketId: string;
  yesTokenAddress: string;
  noTokenAddress: string;
}

export function PoolTabContent({
  marketId,
  yesTokenAddress,
  noTokenAddress,
}: PoolTabContentProps) {
  // ALL HOOKS MUST BE AT THE TOP - Rules of Hooks
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { account } = useWallet();
  const { data: poolData } = usePoolData(marketId);

  const checkPoolExists = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Add cache busting if forcing refresh
      const url = forceRefresh
        ? `/api/tapp/pools/by-market/${marketId}?t=${Date.now()}`
        : `/api/tapp/pools/by-market/${marketId}`;

      const response = await fetch(url, {
        cache: forceRefresh ? 'no-cache' : 'default',
      });
      setPoolExists(response.ok);
      console.log(`[PoolTabContent] Pool exists check: ${response.ok}, forceRefresh: ${forceRefresh}`);
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
              console.log('[PoolTabContent] Pool created callback triggered');
              // Force refresh immediately, then again after 2s for indexing
              checkPoolExists(true);
              setTimeout(() => {
                checkPoolExists(true);
              }, 2000);
            }}
          />

          <p className="text-xs text-muted-foreground text-center max-w-md">
            Once created, you and others will be able to add liquidity and earn fees from trades
          </p>
        </CardContent>
      </Card>
    );
  }

  // Pool exists, show add liquidity interface + user positions
  // Filter positions for current user
  const userPositions = poolData?.positions?.filter(
    (p) => account?.address && p.owner.toLowerCase() === account.address.toString().toLowerCase()
  ) || [];

  const totalLpSupply = Math.sqrt((poolData?.yesReserve || 0) * (poolData?.noReserve || 0));

  return (
    <div className="space-y-6">
      <LiquidityPanel marketId={marketId} />

      {account && (
        <LiquidityPositions
          positions={userPositions}
          totalLpSupply={totalLpSupply}
          yesReserve={poolData?.yesReserve || 0}
          noReserve={poolData?.noReserve || 0}
        />
      )}
    </div>
  );
}
