"use client";

/**
 * User Positions Component
 * Shows active positions in markets
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Position {
  marketAddress: string;
  marketTitle: string;
  yesBalance: number;
  noBalance: number;
  totalValue: number;
}

interface UserPositionsProps {
  positions: Position[];
  isLoading?: boolean;
}

export function UserPositions({ positions, isLoading }: UserPositionsProps) {
  const formatBalance = (balance: number) => {
    if (balance >= 1000) return `${(balance / 1000).toFixed(2)}k`;
    if (balance >= 1) return balance.toFixed(2);
    return balance.toFixed(4);
  };

  const totalPortfolioValue = positions.reduce((sum, pos) => sum + pos.totalValue, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading positions...</p>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active positions. Browse markets to start trading!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Positions</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">{totalPortfolioValue.toFixed(2)} APT</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map((position) => (
            <div
              key={position.marketAddress}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">
                    {position.marketTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {position.marketAddress.substring(0, 12)}...
                  </p>
                </div>
                <Link href={`/market/${position.marketAddress}`}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">YES Shares</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      {formatBalance(position.yesBalance)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">NO Shares</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatBalance(position.noBalance)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Value</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    {position.totalValue.toFixed(2)} APT
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
