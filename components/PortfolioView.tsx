"use client";

/**
 * Portfolio View - Lightweight Performance Edition
 * Shows user's portfolio with fast, responsive UI
 */

import React, { useMemo } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, RefreshCw, TrendingUp, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/lib/hooks";
import { ActivityFeed } from "@/components/portfolio/ActivityFeed";
import { UserPositions } from "@/components/portfolio/UserPositions";
import { StatCard } from "@/components/ui/stat-card";
import { CSSDonut } from "@/components/ui/css-donut";
import { useUserActivities } from "@/lib/hooks/use-user-activities";
import { Skeleton } from "@/components/ui/skeleton";

export function PortfolioView() {
  const { account } = useWallet();

  const {
    portfolio,
    isLoading: isLoadingPortfolio,
    totalValue,
    totalPnL,
    totalPnLPct,
    roi,
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

  // Adapt PortfolioPosition to Position type for UserPositions component - ALWAYS call hooks
  const adaptedPositions = useMemo(() => {
    if (!portfolio?.openPositions) return [];

    return portfolio.openPositions.map((pos) => ({
      marketAddress: pos.marketAddress,
      marketTitle: pos.marketDescription,
      yesBalance: pos.outcome === 'YES' ? pos.sharesOwned : 0,
      noBalance: pos.outcome === 'NO' ? pos.sharesOwned : 0,
      totalValue: pos.currentValue,
      marketStatus: pos.status === 'OPEN' ? 0 : 1,
    }));
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

  if (isLoadingPortfolio) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight">Portfolio</h1>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] lg:col-span-2" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[450px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          label="Return on Investment"
          value={`${roi.toFixed(2)}%`}
          trend={roi > 0 ? "up" : roi < 0 ? "down" : "neutral"}
          color={roi > 0 ? "green" : roi < 0 ? "red" : "gray"}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle="Total portfolio performance"
        />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          trend={winRate > 50 ? "up" : "down"}
          color={winRate > 50 ? "green" : "red"}
          icon={<Target className="w-5 h-5" />}
          subtitle="Winning positions ratio"
        />
        <StatCard
          label="Unrealized P&L"
          value={`${totalPnLPct > 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`}
          trend={totalPnLPct > 0 ? "up" : totalPnLPct < 0 ? "down" : "neutral"}
          color={totalPnLPct > 0 ? "green" : totalPnLPct < 0 ? "red" : "gray"}
          icon={<Trophy className="w-5 h-5" />}
          subtitle={`$${totalPnL.toFixed(2)} total`}
        />
      </div>

      {/* Portfolio Breakdown - Lightweight CSS Donut */}
      {donutData.length > 0 && donutData.some((d) => d.value > 0) && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Position Distribution</h3>
          <CSSDonut segments={donutData} size={200} thickness={50} />
        </div>
      )}

      {/* Active Positions Table */}
      <UserPositions
        positions={adaptedPositions}
        isLoading={isLoadingPortfolio}
      />

      {/* Trading History */}
      <ActivityFeed
        activities={activitiesData?.activities || []}
        isLoading={isLoadingActivities}
      />
    </div>
  );
}
