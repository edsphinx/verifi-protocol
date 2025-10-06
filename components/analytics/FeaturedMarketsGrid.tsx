"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MarketRankingEngine } from "@/lib/engine/market-ranking.engine";
import type { FeaturedMarket } from "@/lib/engine/market-ranking.engine";
import type { MarketMetrics } from "@/lib/types/database.types";

interface FeaturedMarketsGridProps {
  markets: MarketMetrics[];
  count?: number;
}

export function FeaturedMarketsGrid({
  markets,
  count = 3,
}: FeaturedMarketsGridProps) {
  const [featuredMarkets, setFeaturedMarkets] = useState<FeaturedMarket[]>([]);

  useEffect(() => {
    // Convert database MarketMetrics to ranking engine format
    const metricsForRanking = markets.map((m) => ({
      marketId: m.marketAddress,
      totalLiquidity: m.yesSupply + m.noSupply,
      liquidityGrowth24h: 0, // TODO: Calculate from historical data
      volume24h: m.volume24h,
      volume7d: m.volume24h * 7, // Estimate: TODO: Add volume7d to schema
      volumeGrowth24h: 0, // TODO: Calculate from historical data
      tradeCount24h: m.totalTrades, // Using total as proxy for 24h
      uniqueTraders24h: m.uniqueTraders,
      yesPrice: m.yesPrice,
      priceChange24h: 0, // TODO: Calculate from price history
      volatility24h: 0, // TODO: Calculate from price history
      arbitrageOpportunity: calculateArbitrageOpportunity(m),
      hoursUntilResolution: calculateHoursUntilResolution(
        new Date(m.resolutionTimestamp),
      ),
      commentCount: 0, // TODO: Add to schema
      shareCount: 0, // TODO: Add to schema
    }));

    const featured = MarketRankingEngine.getFeaturedMarkets(
      metricsForRanking,
      count,
    );
    setFeaturedMarkets(featured);
  }, [markets, count]);

  if (featuredMarkets.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
            <span className="text-2xl">⭐</span>
          </div>
          <h3 className="text-lg font-semibold text-white">
            No Featured Markets Yet
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Markets with high activity will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Featured Markets</h3>
        <div className="text-xs text-gray-400">
          Powered by AI ranking engine
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featuredMarkets.map((market, idx) => (
          <FeaturedMarketCard
            key={market.marketId}
            market={market}
            rank={idx + 1}
          />
        ))}
      </div>
    </div>
  );
}

function FeaturedMarketCard({
  market,
  rank,
}: {
  market: FeaturedMarket;
  rank: number;
}) {
  // Get original market data
  const originalMarket = useMarketData(market.marketId);

  if (!originalMarket) {
    return null;
  }

  return (
    <Link
      href={`/market/${market.marketId}`}
      className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-900/50 p-5 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20"
    >
      {/* Rank Badge */}
      <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400">
        #{rank}
      </div>

      {/* Featured Badge */}
      <div className="absolute top-3 right-3">
        <Badge text={market.badge} />
      </div>

      {/* Content */}
      <div className="mt-10 space-y-3">
        {/* Market Description */}
        <h4 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
          {originalMarket.description}
        </h4>

        {/* Featured Reason */}
        <p className="text-xs text-gray-400 line-clamp-2">
          {market.featuredReason}
        </p>

        {/* FOMO Triggers */}
        {market.fomoTriggers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {market.fomoTriggers.slice(0, 3).map((trigger, idx) => (
              <div
                key={idx}
                className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400 border border-cyan-500/20"
              >
                {trigger}
              </div>
            ))}
          </div>
        )}

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <ScorePill
            label="Activity"
            score={market.activityScore}
            color="cyan"
          />
          <ScorePill
            label="Volatility"
            score={market.volatilityScore}
            color="yellow"
          />
          <ScorePill
            label="Urgency"
            score={market.urgencyScore}
            color="red"
          />
        </div>

        {/* Total Score Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Overall Score</span>
            <span className="font-medium text-white">
              {market.totalScore.toFixed(0)}/100
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${market.totalScore}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Badge({ text }: { text: string }) {
  const getBgColor = (badge: string) => {
    if (badge.includes("HOT")) return "bg-orange-500/20 border-orange-500/30 text-orange-400";
    if (badge.includes("VOLATILE")) return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
    if (badge.includes("LIQUIDITY")) return "bg-green-500/20 border-green-500/30 text-green-400";
    if (badge.includes("CLOSING")) return "bg-red-500/20 border-red-500/30 text-red-400";
    if (badge.includes("TRENDING")) return "bg-purple-500/20 border-purple-500/30 text-purple-400";
    if (badge.includes("ARB")) return "bg-cyan-500/20 border-cyan-500/30 text-cyan-400";
    if (badge.includes("POPULAR")) return "bg-blue-500/20 border-blue-500/30 text-blue-400";
    return "bg-gray-500/20 border-gray-500/30 text-gray-400";
  };

  return (
    <div
      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getBgColor(text)}`}
    >
      {text}
    </div>
  );
}

function ScorePill({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: "cyan" | "yellow" | "red";
}) {
  const colorClasses = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div
      className={`rounded-lg border p-1.5 ${colorClasses[color]} text-center`}
    >
      <div className="text-xs font-bold">{score.toFixed(0)}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}

// Utility hooks

function useMarketData(marketId: string) {
  const [market, setMarket] = useState<any>(null);

  useEffect(() => {
    // Fetch market data from API
    fetch(`/api/markets/${marketId}`)
      .then((res) => res.json())
      .then((data) => setMarket(data))
      .catch(console.error);
  }, [marketId]);

  return market;
}

// Utility functions

function calculateArbitrageOpportunity(metrics: MarketMetrics): number {
  const totalSupply = metrics.yesSupply + metrics.noSupply;
  if (totalSupply === 0) return 0;

  const supplyRatio = metrics.yesSupply / totalSupply;
  const priceRatio = metrics.yesPrice;

  return Math.abs(supplyRatio - priceRatio) * 100;
}

function calculateHoursUntilResolution(timestamp: Date): number {
  const now = new Date();
  const resolution = new Date(timestamp);
  const diff = resolution.getTime() - now.getTime();
  return diff / (1000 * 60 * 60);
}
