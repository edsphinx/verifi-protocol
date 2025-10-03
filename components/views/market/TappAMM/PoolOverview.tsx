"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  TrendingUp,
  DollarSign,
  Percent,
  Lock,
  Unlock,
} from "lucide-react";
import {
  type PoolData,
  formatCurrency,
  formatNumber,
  formatPercentage,
  calculatePoolPrice,
  calculateAPY,
} from "@/lib/tapp/mock/pool-data";
import { usePoolData } from "@/lib/tapp/hooks/use-pool-data";

interface PoolOverviewProps {
  marketId: string;
  data?: PoolData;
  isLoading?: boolean;
}

export function PoolOverview({ marketId, data: initialData, isLoading: initialLoading = false }: PoolOverviewProps) {
  // Fetch live pool data - this will auto-update when refetchQueries is called
  const { data: poolData, isLoading: isLoadingLive } = usePoolData(marketId);

  // Use live data if available, fallback to initial props
  const data = poolData ?? initialData;
  const isLoading = isLoadingLive || initialLoading;

  if (isLoading || !data) {
    return <PoolOverviewSkeleton />;
  }

  const poolPrice = calculatePoolPrice(data.yesReserve, data.noReserve);
  const apy = calculateAPY(
    data.volume24h,
    data.totalLiquidity,
    data.currentFee / 10000,
  );
  const yesPercentage = (data.yesReserve / data.totalLiquidity) * 100;
  const noPercentage = (data.noReserve / data.totalLiquidity) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AMM Pool Overview
            </CardTitle>
            <CardDescription>
              Automated market maker for YES/NO tokens
            </CardDescription>
          </div>
          <Badge variant={data.tradingEnabled ? "default" : "destructive"}>
            {data.tradingEnabled ? (
              <>
                <Unlock className="h-3 w-3 mr-1" /> Active
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" /> Disabled
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pool Composition */}
        <div>
          <h3 className="text-sm font-medium mb-3">Pool Composition</h3>
          <div className="space-y-3">
            {/* YES Reserve */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">YES Reserve</span>
                <span className="font-medium">
                  {formatNumber(data.yesReserve, 0)} (
                  {formatPercentage(yesPercentage, 1)})
                </span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
            </div>

            {/* NO Reserve */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">NO Reserve</span>
                <span className="font-medium">
                  {formatNumber(data.noReserve, 0)} (
                  {formatPercentage(noPercentage, 1)})
                </span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full transition-all duration-500"
                  style={{ width: `${noPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Liquidity */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Total Liquidity</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(data.totalLiquidity)}
            </p>
          </div>

          {/* 24h Volume */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>24h Volume</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(data.volume24h)}
            </p>
          </div>

          {/* Pool Price */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Activity className="h-4 w-4" />
              <span>Pool Price</span>
            </div>
            <p className="text-lg font-semibold">
              1 YES = {formatNumber(poolPrice, 4)} NO
            </p>
          </div>

          {/* Current Fee */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Percent className="h-4 w-4" />
              <span>Trading Fee</span>
            </div>
            <p className="text-lg font-semibold">
              {formatPercentage(data.currentFee / 100, 2)}
            </p>
          </div>
        </div>

        <Separator />

        {/* APY Estimate */}
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimated APY</p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on 24h fees
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                {formatPercentage(apy, 1)}
              </p>
              <Badge variant="outline" className="mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>
        </div>

        {/* Pool Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Pool Address:</span>
            <span className="font-mono">
              {data.poolAddress.slice(0, 6)}...{data.poolAddress.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Positions:</span>
            <span>{data.positions.length} active</span>
          </div>
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span>{new Date(data.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PoolOverviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>

        <Separator />

        <div className="h-24 w-full bg-muted animate-pulse rounded-lg" />

        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-4 w-full bg-muted animate-pulse rounded"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
