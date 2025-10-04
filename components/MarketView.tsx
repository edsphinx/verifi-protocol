"use client";

import { useState, useEffect } from "react";
import { useMarketDetails } from "@/aptos/queries/use-market-details";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ActionPanel } from "@/components/views/market/ActionPanel";
import { PoolSection } from "@/components/tapp/PoolSection";
import { SwapTabContent } from "@/components/views/market/SwapTabContent";
import { PoolTabContent } from "@/components/views/market/PoolTabContent";
import { TappPoolStats } from "@/components/TappPoolStats";
import { TrendingUp, Users, BarChart3 } from "lucide-react";

// This component is now a Client Component and can use hooks.
export function MarketView({ marketId }: { marketId: string }) {
  const [activeTab, setActiveTab] = useState("primary");
  const [cachedData, setCachedData] = useState<any>(null);

  const {
    data: marketDetails,
    isLoading,
    isError,
  } = useMarketDetails(marketId);

  // Load from localStorage on mount for instant display
  useEffect(() => {
    const cacheKey = `market_${marketId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setCachedData(JSON.parse(cached));
      } catch (e) {
        console.error("Error parsing cached market data:", e);
      }
    }
  }, [marketId]);

  // Save to localStorage when data loads
  useEffect(() => {
    if (marketDetails) {
      const cacheKey = `market_${marketId}`;
      localStorage.setItem(cacheKey, JSON.stringify(marketDetails));
      setCachedData(marketDetails);
    }
  }, [marketDetails, marketId]);

  // Use cached data while loading, then switch to fresh data
  const displayData = marketDetails || cachedData;

  // This is a placeholder. In a real app, you'd fetch this from your database.
  const staticMarketData = {
    title: "Will AMNIS Finance TVL be above $10M on Oct 31, 2025?",
    category: "DeFi",
  };

  if (isLoading && !cachedData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header Skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-6 w-24 mx-auto" />
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <div className="flex items-center justify-center gap-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-[480px] w-full" />
        </div>
      </div>
    );
  }

  if (isError || !displayData) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load market data.
      </div>
    );
  }

  const details = displayData;
  const totalVolume = (details.totalSupplyYes + details.totalSupplyNo) / 2 / 10 ** 6; // YES/NO tokens have 6 decimals

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Centered Professional Header */}
      <div className="text-center space-y-4 max-w-4xl mx-auto">
        <Badge className="text-xs font-semibold px-3 py-1">
          {staticMarketData.category}
        </Badge>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
          {staticMarketData.title}
        </h1>

        {/* Centered Stats Row */}
        <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-mono font-semibold">{totalVolume.toFixed(2)} APT</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">YES:</span>
            <span className="font-mono font-semibold">{(details.totalSupplyYes / 10 ** 6).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">NO:</span>
            <span className="font-mono font-semibold">{(details.totalSupplyNo / 10 ** 6).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Trading Interface - Centered and Prominent */}
      <div className="max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="primary">Trade</TabsTrigger>
            <TabsTrigger value="swap">AMM Swap</TabsTrigger>
            <TabsTrigger value="liquidity">Add Liquidity</TabsTrigger>
          </TabsList>

          {/* Fixed min-height container to prevent layout shift */}
          <div className="min-h-[480px] transition-all duration-300">
            <TabsContent value="primary" className="mt-0">
              <ActionPanel marketId={marketId} dynamicData={details} />
            </TabsContent>

            <TabsContent value="swap" className="mt-0">
              <SwapTabContent marketId={marketId} onNavigateToLiquidity={() => setActiveTab("liquidity")} />
            </TabsContent>

            <TabsContent value="liquidity" className="mt-0">
              <PoolTabContent
                marketId={marketId}
                yesTokenAddress={details.yesTokenAddress}
                noTokenAddress={details.noTokenAddress}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Market Details Section - Collapsed Below */}
      <div className="pt-8 border-t border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Market Details</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tapp Pool Stats */}
          <TappPoolStats marketAddress={marketId} />

          {/* Pool Section */}
          <PoolSection
            marketAddress={marketId}
            yesTokenAddress={details.yesTokenAddress}
            noTokenAddress={details.noTokenAddress}
          />
        </div>
      </div>
    </div>
  );
}
