"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Droplet, ArrowLeftRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TappPoolStatsProps {
  marketAddress: string;
}

interface PoolData {
  liquidity: number;
  volume24h: number;
  yesPrice: number;
  noPrice: number;
  poolExists: boolean;
}

async function fetchPoolData(marketAddress: string): Promise<PoolData> {
  try {
    const response = await fetch(`/api/tapp/pools/by-market/${marketAddress}`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          liquidity: 0,
          volume24h: 0,
          yesPrice: 0.5,
          noPrice: 0.5,
          poolExists: false
        };
      }
      throw new Error("Failed to fetch pool data");
    }

    const data = await response.json();

    // Defensive: validate data structure
    if (!data || typeof data !== 'object') {
      console.warn('[TappPoolStats] Invalid data structure received:', data);
      return {
        liquidity: 0,
        volume24h: 0,
        yesPrice: 0.5,
        noPrice: 0.5,
        poolExists: false
      };
    }

    return {
      liquidity: Number(data.totalLiquidity) || 0,
      volume24h: Number(data.volume24h) || 0,
      yesPrice: Number(data.yesPrice) || 0.5,
      noPrice: Number(data.noPrice) || 0.5,
      poolExists: true,
    };
  } catch (error) {
    console.error('[TappPoolStats] Error fetching pool data:', error);
    // Return safe defaults on error
    return {
      liquidity: 0,
      volume24h: 0,
      yesPrice: 0.5,
      noPrice: 0.5,
      poolExists: false
    };
  }
}

export function TappPoolStats({ marketAddress }: TappPoolStatsProps) {
  const { data: poolData, isLoading: loading, isError } = useQuery({
    queryKey: ["tapp-pool-stats", marketAddress],
    queryFn: () => fetchPoolData(marketAddress),
    refetchInterval: 5000, // Auto-refetch every 5 seconds
    staleTime: 2000,
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1s between retries
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            Tapp AMM Pool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Defensive: always show something, even on error
  if (isError || !poolData) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Droplet className="h-5 w-5" />
            Tapp AMM Pool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load pool data. Pool may not exist yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!poolData.poolExists) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Droplet className="h-5 w-5" />
            Tapp AMM Pool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No AMM pool exists for this market yet. Create one to enable automated trading.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Scroll to tabs and click "Add Liquidity" tab
              const tabs = document.querySelector('[role="tablist"]');
              const liquidityTab = document.querySelector('[value="liquidity"]') as HTMLButtonElement;
              if (tabs && liquidityTab) {
                tabs.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => liquidityTab.click(), 500);
              }
            }}
          >
            Create Pool
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-primary" />
          Tapp AMM Pool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Droplet className="h-3 w-3" />
              Total Liquidity
            </p>
            <p className="text-xl font-bold font-mono">
              {poolData.liquidity.toLocaleString(undefined, {
                maximumFractionDigits: 2
              })} APT
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              24h Volume
            </p>
            <p className="text-xl font-bold font-mono">
              {poolData.volume24h.toLocaleString(undefined, {
                maximumFractionDigits: 2
              })} APT
            </p>
          </div>
        </div>

        {/* Current Prices */}
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
            <ArrowLeftRight className="h-3 w-3" />
            Current Prices
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs text-green-400 mb-1">YES</p>
              <p className="text-xl font-bold font-mono text-green-400">
                {(poolData.yesPrice * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-red-400 mb-1">NO</p>
              <p className="text-xl font-bold font-mono text-red-400">
                {(poolData.noPrice * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Trade Button */}
        <Button className="w-full" asChild>
          <a
            href={`https://tapp.exchange/swap?market=${marketAddress}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Trade on Tapp Exchange
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
