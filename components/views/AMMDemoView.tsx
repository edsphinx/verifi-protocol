"use client";

import { PoolOverview } from "@/components/views/market/TappAMM/PoolOverview";
import { SwapInterface } from "@/components/views/market/TappAMM/SwapInterface";
import { LiquidityPanel } from "@/components/views/market/TappAMM/LiquidityPanel";
import { TappModeToggle } from "@/components/TappModeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { usePoolData } from "@/lib/tapp/hooks/use-pool-data";
import { useTappMode } from "@/lib/tapp/context/TappModeContext";

export function AMMDemoView() {
  // Sample market ID for demo
  const mockMarketId = "0x1234567890abcdef";

  const { isDemo, isLive } = useTappMode();
  const {
    data: poolData,
    isLoading,
    isError,
    error,
  } = usePoolData(mockMarketId, undefined);

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <TappModeToggle />

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load pool data"}
          </AlertDescription>
        </Alert>
      )}

      {/* Pool Overview */}
      <PoolOverview
        marketId={mockMarketId}
        data={poolData}
        isLoading={isLoading}
      />

      {/* Swap and Liquidity Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SwapInterface
          marketId={mockMarketId}
          yesTokenAddress="0xdemo_yes_token"
          noTokenAddress="0xdemo_no_token"
        />
        <LiquidityPanel
          marketId={mockMarketId}
          yesTokenAddress="0xdemo_yes_token"
          noTokenAddress="0xdemo_no_token"
        />
      </div>

      {/* Data Inspector (only in demo mode) */}
      {isDemo && poolData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mock Data Inspector</CardTitle>
                <CardDescription>
                  View the generated mock data structure
                </CardDescription>
              </div>
              <Badge variant="outline">Demo Mode</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96 bg-muted p-4 rounded-lg">
              {JSON.stringify(poolData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Live Mode Info */}
      {isLive && !isLoading && poolData && (
        <Card>
          <CardHeader>
            <CardTitle>Live Pool Statistics</CardTitle>
            <CardDescription>
              Real-time data from deployed Tapp hook contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pool Address:</span>
              <span className="font-mono">{poolData.poolAddress}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Market Address:</span>
              <span className="font-mono">{poolData.marketAddress}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(poolData.lastUpdated).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
