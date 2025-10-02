"use client";

import { useMarketDetails } from "@/aptos/queries/use-market-details";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionPanel } from "@/components/views/market/ActionPanel";
import { MarketDetails } from "@/components/views/market/MarketDetails";
import { PoolSection } from "@/components/tapp/PoolSection";
import { SwapInterface } from "@/components/views/market/TappAMM/SwapInterface";
import { LiquidityPanel } from "@/components/views/market/TappAMM/LiquidityPanel";

// This component is now a Client Component and can use hooks.
export function MarketView({ marketId }: { marketId: string }) {
  const {
    data: marketDetails,
    isLoading,
    isError,
  } = useMarketDetails(marketId);

  // This is a placeholder. In a real app, you'd fetch this from your database.
  const staticMarketData = {
    title: "Will AMNIS Finance TVL be above $10M on Oct 31, 2025?",
    category: "DeFi",
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !marketDetails) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load market data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Market Header */}
      <MarketDetails
        staticData={staticMarketData}
        dynamicData={marketDetails}
      />

      {/* Trading Tabs */}
      <Tabs defaultValue="primary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="primary">Primary Market</TabsTrigger>
          <TabsTrigger value="swap">AMM Swap</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
        </TabsList>

        <TabsContent value="primary" className="mt-6">
          <ActionPanel marketId={marketId} dynamicData={marketDetails} />
        </TabsContent>

        <TabsContent value="swap" className="mt-6">
          <SwapInterface
            marketAddress={marketId}
            yesTokenAddress={marketDetails.yesTokenAddress}
            noTokenAddress={marketDetails.noTokenAddress}
          />
        </TabsContent>

        <TabsContent value="liquidity" className="mt-6">
          <LiquidityPanel
            marketAddress={marketId}
            yesTokenAddress={marketDetails.yesTokenAddress}
            noTokenAddress={marketDetails.noTokenAddress}
          />
        </TabsContent>
      </Tabs>

      {/* Pool Info Section */}
      <PoolSection
        marketAddress={marketId}
        yesTokenAddress={marketDetails.yesTokenAddress}
        noTokenAddress={marketDetails.noTokenAddress}
      />
    </div>
  );
}
