"use client";

/**
 * Portfolio View
 * Shows user's active positions, trading history, and winnings
 */

import React from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserActivities } from "@/hooks/use-user-activities";
import { useUserPositions } from "@/hooks/use-user-positions";
import { ActivityFeed } from "@/components/portfolio/ActivityFeed";
import { UserPositions } from "@/components/portfolio/UserPositions";

export function PortfolioView() {
  const { account } = useWallet();

  const { data: activitiesData, isLoading: isLoadingActivities, refetch: refetchActivities } =
    useUserActivities(account?.address);

  const { data: positions, isLoading: isLoadingPositions, refetch: refetchPositions } =
    useUserPositions(account?.address);

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

  const handleRefresh = () => {
    refetchActivities();
    refetchPositions();
  };

  return (
    <div className="space-y-6">
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

      {/* Active Positions */}
      <UserPositions
        positions={positions || []}
        isLoading={isLoadingPositions}
      />

      {/* Trading History */}
      <ActivityFeed
        activities={activitiesData?.activities || []}
        isLoading={isLoadingActivities}
      />
    </div>
  );
}
