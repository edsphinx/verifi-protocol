"use client";

/**
 * PoolStats Component
 * Displays key statistics for a Tapp AMM pool
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Droplet, Activity, Percent } from "lucide-react";
import type { TappPool } from "@/lib/interfaces";

interface PoolStatsProps {
  pool: TappPool;
  yesReserve?: number;
  noReserve?: number;
  currentYesPrice?: number;
  currentNoPrice?: number;
}

export function PoolStats({
  pool,
  yesReserve,
  noReserve,
  currentYesPrice,
  currentNoPrice,
}: PoolStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  const feePercent = (pool.fee / 10000).toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Liquidity</CardTitle>
          <Droplet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(pool.totalLiquidity)} APT
          </div>
          <p className="text-xs text-muted-foreground">
            Total value locked in pool
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(pool.volume24h)} APT
          </div>
          <p className="text-xs text-muted-foreground">
            Trading volume last 24h
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pool Fee</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{feePercent}%</div>
          <p className="text-xs text-muted-foreground">Charged per swap</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">YES/NO Ratio</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {yesReserve && noReserve
              ? (yesReserve / noReserve).toFixed(3)
              : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">Reserve ratio</p>
        </CardContent>
      </Card>

      {currentYesPrice !== undefined && currentNoPrice !== undefined && (
        <>
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">YES Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {currentYesPrice.toFixed(4)} APT
              </div>
              <p className="text-xs text-muted-foreground">
                Current market price
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">NO Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {currentNoPrice.toFixed(4)} APT
              </div>
              <p className="text-xs text-muted-foreground">
                Current market price
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
