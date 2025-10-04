"use client";

import { useState, useEffect, useMemo } from "react";
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
import { calculateMarketPsychology } from "@/lib/services/market-psychology.service";
import { cn } from "@/lib/utils";

// This component is now a Client Component and can use hooks.
export function MarketView({ marketId }: { marketId: string }) {
  const [activeTab, setActiveTab] = useState("primary");
  const [cachedData, setCachedData] = useState<any>(null);
  const [marketInfo, setMarketInfo] = useState<any>(null);

  const {
    data: marketDetails,
    isLoading,
    isError,
  } = useMarketDetails(marketId);

  // Use cached data while loading, then switch to fresh data
  const displayData = marketDetails || cachedData;

  // Calculate market psychology for header display (must be before conditional returns)
  const psychology = useMemo(
    () => displayData ? calculateMarketPsychology(displayData) : null,
    [displayData]
  );

  // Fetch market info from database
  useEffect(() => {
    fetch(`/api/markets/${marketId}`)
      .then((res) => res.json())
      .then((data) => setMarketInfo(data))
      .catch((err) => console.error("Error fetching market info:", err));
  }, [marketId]);

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

  if (!displayData) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading market data...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load market data.
      </div>
    );
  }

  const details = displayData;
  const totalVolume =
    (details.totalSupplyYes + details.totalSupplyNo) / 2 / 10 ** 6; // YES/NO tokens have 6 decimals

  // Psychology was calculated earlier with useMemo
  if (!psychology) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className="text-xs font-semibold px-3 py-1">
            On-Chain Oracle
          </Badge>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg md:text-xl text-muted-foreground">
            {marketInfo?.description || "Loading market details..."}
          </h1>

          {/* YES/NO Outcomes with Dynamic Hierarchy */}
          <div className="flex flex-col gap-1">
            {/* Primary Outcome (Winning) */}
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "font-mono tracking-tight transition-all",
                  psychology.primaryOutcome.color === "green" ? "text-green-400" : "text-red-400",
                  psychology.primaryOutcome.weight === "extrabold" && "font-extrabold text-3xl md:text-4xl lg:text-5xl",
                  psychology.primaryOutcome.weight === "bold" && "font-bold text-2xl md:text-3xl lg:text-4xl",
                  psychology.primaryOutcome.weight === "semibold" && "font-semibold text-xl md:text-2xl lg:text-3xl"
                )}
              >
                {psychology.primaryOutcome.name}:
              </span>
              <span className="text-base md:text-lg lg:text-xl text-muted-foreground">
                {marketInfo?.description || "Loading..."}
              </span>
              <span
                className={cn(
                  "ml-auto font-mono font-bold text-lg md:text-xl",
                  psychology.primaryOutcome.color === "green" ? "text-green-400" : "text-red-400"
                )}
              >
                {psychology.primaryOutcome.percentage.toFixed(1)}%
              </span>
            </div>

            {/* Secondary Outcome (Underdog) */}
            <div className="flex items-center gap-3 opacity-70">
              <span
                className={cn(
                  "font-mono tracking-tight transition-all",
                  psychology.secondaryOutcome.color === "green" ? "text-green-400/70" : "text-red-400/70",
                  psychology.secondaryOutcome.weight === "semibold" && "font-semibold text-base md:text-lg lg:text-xl",
                  psychology.secondaryOutcome.weight === "medium" && "font-medium text-sm md:text-base lg:text-lg",
                  psychology.secondaryOutcome.weight === "normal" && "font-normal text-sm md:text-base"
                )}
              >
                {psychology.secondaryOutcome.name}:
              </span>
              <span className="text-sm md:text-base text-muted-foreground/70">
                {marketInfo?.description || "Loading..."}
              </span>
              <span
                className={cn(
                  "ml-auto font-mono font-semibold text-base md:text-lg",
                  psychology.secondaryOutcome.color === "green" ? "text-green-400/70" : "text-red-400/70"
                )}
              >
                {psychology.secondaryOutcome.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 text-sm flex-wrap pt-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-mono font-semibold">
              {totalVolume.toFixed(2)} APT
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">YES Supply:</span>
            <span className="font-mono font-semibold text-green-500">
              {(details.totalSupplyYes / 10 ** 6).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">NO Supply:</span>
            <span className="font-mono font-semibold text-red-500">
              {(details.totalSupplyNo / 10 ** 6).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Trading Interface */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="primary">Trade</TabsTrigger>
              <TabsTrigger value="swap">AMM Swap</TabsTrigger>
              <TabsTrigger value="liquidity">Add Liquidity</TabsTrigger>
            </TabsList>

            <div className="transition-all duration-300">
              <TabsContent value="primary" className="mt-0">
                <ActionPanel marketId={marketId} dynamicData={details} />
              </TabsContent>

              <TabsContent value="swap" className="mt-0">
                <SwapTabContent
                  marketId={marketId}
                  yesTokenAddress={details.yesTokenAddress}
                  noTokenAddress={details.noTokenAddress}
                  onNavigateToLiquidity={() => setActiveTab("liquidity")}
                />
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

        {/* Right Column - Market Details */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Market Stats</h2>
            </div>
            <div className="space-y-4">
              <TappPoolStats marketAddress={marketId} />
              <PoolSection
                marketAddress={marketId}
                yesTokenAddress={details.yesTokenAddress}
                noTokenAddress={details.noTokenAddress}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
