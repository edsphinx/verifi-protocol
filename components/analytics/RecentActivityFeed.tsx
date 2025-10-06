/**
 * @file Recent Activity Feed
 * @description Live feed of recent platform activities
 */

"use client";

import { Card } from "@tremor/react";
import { Activity, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useRecentActivity } from "@/lib/hooks/use-recent-activity";
import { formatDistanceToNow } from "date-fns";

export function RecentActivityFeed() {
  const { data, isLoading } = useRecentActivity(15);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "BUY_YES":
      case "BUY_NO":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "SELL_YES":
      case "SELL_NO":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "BUY_YES":
      case "BUY_NO":
        return "text-green-600 dark:text-green-400";
      case "SELL_YES":
      case "SELL_NO":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  const formatAmount = (amount: number) => {
    // Data is already in APT format in database
    return amount.toFixed(4);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Activity className="h-12 w-12 mb-3 opacity-30" />
          <p>No recent activity</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {data.activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="mt-0.5">{getActivityIcon(activity.type)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    <span className={getActivityColor(activity.type)}>
                      {formatActivityType(activity.type)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {activity.marketDescription}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">
                    {formatAmount(activity.amount)} APT
                  </p>
                  {activity.price && (
                    <p className="text-xs text-muted-foreground">
                      @{(activity.price * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </span>
                <span className="font-mono">
                  {activity.user.slice(0, 6)}...{activity.user.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
