"use client";

/**
 * Activity Feed Component
 * Shows user's trading history with details
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, TrendingDown, Droplet, ArrowLeftRight } from "lucide-react";
import { NETWORK } from "@/aptos/constants";
import type { Activity } from "@prisma/client";
import Link from "next/link";

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "BUY":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "SELL":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "LIQUIDITY_ADD":
        return <Droplet className="h-4 w-4 text-blue-500" />;
      case "SWAP":
        return <ArrowLeftRight className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: string, outcome?: string | null) => {
    switch (action) {
      case "BUY":
        return `Bought ${outcome || ""}`;
      case "SELL":
        return `Sold ${outcome || ""}`;
      case "LIQUIDITY_ADD":
        return "Added Liquidity";
      case "SWAP":
        return `Swapped ${outcome || ""}`;
      default:
        return action;
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1) return amount.toFixed(2);
    return amount.toFixed(4);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No trading activity yet. Start by buying shares in a market!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {getActivityIcon(activity.action)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {getActionLabel(activity.action, activity.outcome)}
                    </p>
                    {activity.outcome && (
                      <Badge
                        variant={activity.outcome === "YES" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {activity.outcome}
                      </Badge>
                    )}
                  </div>
                  <Link
                    href={`/market/${activity.marketAddress}`}
                    className="text-xs text-muted-foreground hover:underline truncate block"
                  >
                    Market: {activity.marketAddress.substring(0, 8)}...
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {formatAmount(activity.amount)} APT
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
                <a
                  href={`https://explorer.aptoslabs.com/txn/${activity.txHash}?network=${NETWORK.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
