"use client";

/**
 * Portfolio View - Enhanced with Nivo Charts
 * Shows user's portfolio with advanced visualizations
 */

import React, { useMemo } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/lib/hooks";
import { ActivityFeed } from "@/components/portfolio/ActivityFeed";
import { UserPositions } from "@/components/portfolio/UserPositions";
import { PerformanceMetrics } from "@/components/portfolio/PerformanceMetrics";
import { PositionAllocation } from "@/components/portfolio/PositionAllocation";
import { PortfolioBreakdown } from "@/components/portfolio/PortfolioBreakdown";
import { TradingActivity } from "@/components/portfolio/TradingActivity";
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

  // Calculate trading activity calendar data - ALWAYS call hooks
  const tradingActivityData = useMemo(() => {
    if (!activitiesData?.activities) return [];

    const activityByDay = activitiesData.activities.reduce(
      (acc, activity) => {
        const day = new Date(activity.timestamp).toISOString().split("T")[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(activityByDay).map(([day, value]) => ({
      day,
      value,
    }));
  }, [activitiesData]);

  // Calculate date range (last year)
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const winRate = portfolio?.stats?.winRate || 0;

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

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceMetrics
            roi={roi}
            winRate={winRate}
            totalPnL={totalPnLPct}
          />
        </div>
        <PortfolioBreakdown
          positions={portfolio?.openPositions || []}
          totalValue={totalValue}
        />
      </div>

      {/* Position Allocation */}
      <PositionAllocation positions={portfolio?.openPositions || []} />

      {/* Trading Activity Calendar */}
      <TradingActivity
        data={tradingActivityData}
        from={oneYearAgo.toISOString().split("T")[0]}
        to={today.toISOString().split("T")[0]}
      />

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
