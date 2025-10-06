/**
 * @file Protocol Overview
 * @description Key protocol metrics displayed as stat cards
 */

"use client";

import { StatCard } from "@/components/ui/stat-card";
import { useProtocolMetrics } from "@/lib/hooks";
import {
  TrendingUp,
  Lock,
  BarChart3,
  Users,
  Activity,
  Coins,
  Target,
  Zap,
} from "lucide-react";

export function ProtocolOverview() {
  const { protocol, isLoading, volumeChange24h, tvlChange24h } =
    useProtocolMetrics();

  if (isLoading || !protocol) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-muted/50 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  const formatAPT = (amount: number) => {
    // Data is already in APT format in database
    return amount.toFixed(2);
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Protocol Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Volume"
            value={`${formatAPT(protocol.totalVolume)} APT`}
            trend={volumeChange24h > 0 ? "up" : volumeChange24h < 0 ? "down" : "neutral"}
            subtitle={`${volumeChange24h >= 0 ? "+" : ""}${volumeChange24h.toFixed(2)}% 24h`}
            color="blue"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            label="Total Value Locked"
            value={`${formatAPT(protocol.totalValueLocked)} APT`}
            trend={tvlChange24h > 0 ? "up" : tvlChange24h < 0 ? "down" : "neutral"}
            subtitle={`${tvlChange24h >= 0 ? "+" : ""}${tvlChange24h.toFixed(2)}% 24h`}
            color="green"
            icon={<Lock className="h-5 w-5" />}
          />
          <StatCard
            label="Active Markets"
            value={protocol.activeMarkets}
            subtitle={`${protocol.totalMarkets} total markets`}
            color="orange"
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <StatCard
            label="Total Users"
            value={formatNumber(protocol.totalUsers)}
            subtitle={`${formatNumber(protocol.activeUsers24h)} active today`}
            color="blue"
            icon={<Users className="h-5 w-5" />}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Activity Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="24h Volume"
            value={`${formatAPT(protocol.volume24h)} APT`}
            subtitle="Last 24 hours"
            color="blue"
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            label="24h Trades"
            value={formatNumber(protocol.trades24h)}
            subtitle={`${formatNumber(protocol.totalTrades)} total`}
            color="green"
            icon={<Zap className="h-5 w-5" />}
          />
          <StatCard
            label="Total Liquidity"
            value={`${formatAPT(protocol.totalLiquidity)} APT`}
            subtitle={`${protocol.totalPools} AMM pools`}
            color="orange"
            icon={<Coins className="h-5 w-5" />}
          />
          <StatCard
            label="Resolved Markets"
            value={protocol.resolvedMarkets}
            subtitle={`${((protocol.resolvedMarkets / protocol.totalMarkets) * 100).toFixed(1)}% resolved`}
            color="gray"
            icon={<Target className="h-5 w-5" />}
          />
        </div>
      </div>
    </div>
  );
}
