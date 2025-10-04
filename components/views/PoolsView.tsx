"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Droplets, Activity } from "lucide-react";
import Link from "next/link";
import { usePools } from "@/lib/hooks/usePools";
import { LiquidityFlow } from "@/components/pools/LiquidityFlow";
import { VolumeStream } from "@/components/pools/VolumeStream";

export function PoolsView() {
  const { data: pools, isLoading, isError } = usePools();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !pools) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-destructive">
            <p>Failed to load pools. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pools.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pools Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no active AMM pools yet. Create one from a market detail
              page.
            </p>
            <Link href="/" className="text-primary hover:underline">
              Browse Markets →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total TVL
  const totalTVL = pools.reduce((sum, pool) => sum + pool.totalLiquidity, 0);

  return (
    <div className="space-y-6">
      {/* Liquidity Flow Visualization */}
      <LiquidityFlow pools={pools} totalTVL={totalTVL} />

      {/* Volume Stream */}
      <VolumeStream data={[]} />

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pools.map((pool) => (
        <Link key={pool.id} href={`/market/${pool.marketAddress}`}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant="outline"
                  className="border-accent/40 text-accent"
                >
                  Active Pool
                </Badge>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg line-clamp-2">
                Pool #{pool.poolAddress.substring(0, 8)}...
              </CardTitle>
              <CardDescription className="line-clamp-1">
                Market: {pool.marketAddress.substring(0, 12)}...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Liquidity
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="font-semibold">
                      {pool.totalLiquidity.toFixed(2)} APT
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    24h Volume
                  </span>
                  <span className="font-semibold">
                    {pool.volume24h.toFixed(2)} APT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fee</span>
                  <span className="font-semibold">
                    {(pool.fee / 10000).toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      </div>
    </div>
  );
}
