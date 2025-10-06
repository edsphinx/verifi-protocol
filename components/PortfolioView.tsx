"use client";

/**
 * Portfolio View - Lightweight Performance Edition
 * Shows user's portfolio with fast, responsive UI
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, RefreshCw, TrendingUp, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { usePortfolio } from "@/lib/hooks";
import { ActivityFeed } from "@/components/portfolio/ActivityFeed";
import { MarketPositionCard } from "@/components/portfolio/MarketPositionCard";
import { LiquidityPositions } from "@/components/portfolio/LiquidityPositions";
import { StatCard } from "@/components/ui/stat-card";
import { CSSDonut } from "@/components/ui/css-donut";
import { useUserActivities } from "@/lib/hooks/use-user-activities";

export function PortfolioView() {
  const { account } = useWallet();

  const {
    portfolio,
    isLoading: isLoadingPortfolio,
    totalValue,
    totalPnL,
    totalPnLPct,
    roi,
    openPositionsCount,
    refetch: refetchPortfolio,
  } = usePortfolio(account?.address?.toString());

  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    refetch: refetchActivities,
  } = useUserActivities(account?.address?.toString());

  const winRate = portfolio?.stats?.winRate || 0;

  // Prepare donut chart data for YES/NO distribution
  const donutData = useMemo(() => {
    if (!portfolio?.openPositions) return [];

    const yesShares = portfolio.openPositions
      .filter((p) => p.outcome === "YES")
      .reduce((sum, p) => sum + p.sharesOwned, 0);

    const noShares = portfolio.openPositions
      .filter((p) => p.outcome === "NO")
      .reduce((sum, p) => sum + p.sharesOwned, 0);

    return [
      { label: "YES Positions", value: yesShares, color: "#3b82f6" },
      { label: "NO Positions", value: noShares, color: "#f59e0b" },
    ];
  }, [portfolio?.openPositions]);

  // Group positions by market for MarketPositionCard component
  const groupedPositions = useMemo(() => {
    if (!portfolio?.openPositions) return [];

    const marketGroups = new Map<
      string,
      {
        marketAddress: string;
        marketTitle: string;
        positions: typeof portfolio.openPositions;
        marketStatus: number;
      }
    >();

    portfolio.openPositions.forEach((pos) => {
      if (!marketGroups.has(pos.marketAddress)) {
        marketGroups.set(pos.marketAddress, {
          marketAddress: pos.marketAddress,
          marketTitle: pos.marketDescription,
          positions: [],
          marketStatus: pos.status === "OPEN" ? 0 : 1,
        });
      }

      const group = marketGroups.get(pos.marketAddress)!;
      group.positions.push(pos);
    });

    return Array.from(marketGroups.values());
  }, [portfolio?.openPositions]);

  const handleRefresh = () => {
    refetchPortfolio();
    refetchActivities();
  };

  if (!account) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Portfolio</h1>
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Connect your wallet to view your portfolio
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Don't block rendering - show content with loading indicator instead
  // The UserPositions and ActivityFeed components handle their own loading states

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Portfolio</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Performance Metrics - Lightweight Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Portfolio Value"
          value={`${totalValue.toFixed(2)} APT`}
          trend={totalValue > 0 ? "up" : "neutral"}
          color={totalValue > 0 ? "green" : "gray"}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={`${openPositionsCount} active positions`}
        />
        <StatCard
          label="Total Markets"
          value={`${portfolio?.openPositions ? new Set(portfolio.openPositions.map((p) => p.marketAddress)).size : 0}`}
          trend="neutral"
          color="blue"
          icon={<Target className="w-5 h-5" />}
          subtitle="Markets with positions"
        />
        <StatCard
          label="Total Trades"
          value={`${portfolio?.stats?.totalTrades || 0}`}
          trend={
            portfolio?.stats?.totalTrades && portfolio.stats.totalTrades > 0
              ? "up"
              : "neutral"
          }
          color={
            portfolio?.stats?.totalTrades && portfolio.stats.totalTrades > 0
              ? "green"
              : "gray"
          }
          icon={<Trophy className="w-5 h-5" />}
          subtitle={`${portfolio?.stats?.totalVolume.toFixed(2) || "0.00"} APT volume`}
        />
      </div>

      {/* Portfolio Breakdown - Lightweight CSS Donut */}
      {donutData.length > 0 && donutData.some((d) => d.value > 0) && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Position Distribution</h3>
          <CSSDonut segments={donutData} size={200} thickness={50} />
        </div>
      )}

      {/* Pure Plays - VeriFi Trading Positions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">🎯 Pure Plays</h2>
        {isLoadingPortfolio ? (
          <Card className="min-h-[200px] flex items-center justify-center">
            <VeriFiLoader message="Loading positions..." />
          </Card>
        ) : groupedPositions.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              No pure plays yet. Browse markets to start betting!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {groupedPositions.map((group) => (
              <MarketPositionCard
                key={group.marketAddress}
                marketAddress={group.marketAddress}
                marketTitle={group.marketTitle}
                positions={group.positions}
                marketStatus={group.marketStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* LP Farms - AMM Liquidity Positions */}
      <LiquidityPositions
        positions={portfolio?.liquidityPositions || []}
        isLoading={isLoadingPortfolio}
      />

      {/* Trading History */}
      <ActivityFeed
        activities={activitiesData?.activities || []}
        isLoading={isLoadingActivities}
      />
    </motion.div>
  );
}
