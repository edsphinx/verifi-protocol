/**
 * @file Dashboard Header
 * @description Header section for analytics dashboard with refresh capability
 */

"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalyticsStore } from "@/lib/stores";
import { useState } from "react";

export function DashboardHeader() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastUpdated = useAnalyticsStore((state) => state.lastUpdated);
  const refreshAll = useAnalyticsStore((state) => state.refreshAll);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time metrics and insights for VeriFi Protocol
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Updated {formatLastUpdated()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
