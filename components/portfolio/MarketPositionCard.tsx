"use client";

/**
 * Market Position Card - Hierarchical Collapsible Display
 * Structure:
 * - Market (collapsible) - shows total summary
 *   - YES Group (collapsible) - shows YES positions summary
 *     - Individual YES pool positions
 *   - NO Group (collapsible) - shows NO positions summary
 *     - Individual NO pool positions
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Trophy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { PortfolioPosition } from "@/lib/types/database.types";

interface MarketPositionCardProps {
  marketAddress: string;
  marketTitle: string;
  positions: PortfolioPosition[];
  marketStatus?: number;
}

interface PositionGroupProps {
  outcome: "YES" | "NO";
  positions: PortfolioPosition[];
  isOpen: boolean;
  onToggle: () => void;
  marketStatus?: number;
}

const formatBalance = (balance: number) => {
  if (balance >= 1000) return `${(balance / 1000).toFixed(2)}k`;
  if (balance >= 1) return balance.toFixed(2);
  return balance.toFixed(4);
};

function PositionGroup({
  outcome,
  positions,
  isOpen,
  onToggle,
  marketStatus,
}: PositionGroupProps) {
  const totalShares = positions.reduce((sum, p) => sum + p.sharesOwned, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalInvested = positions.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalPnL = totalValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const isWinner =
    (outcome === "YES" && marketStatus === 2) ||
    (outcome === "NO" && marketStatus === 3);

  const bgColor =
    outcome === "YES"
      ? "bg-blue-500/10 border-blue-500/20"
      : "bg-amber-500/10 border-amber-500/20";

  return (
    <div className={`border rounded-lg overflow-hidden ${bgColor}`}>
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}

          <Badge
            variant={outcome === "YES" ? "default" : "secondary"}
            className={
              isWinner
                ? outcome === "YES"
                  ? "bg-green-500"
                  : "bg-red-500"
                : ""
            }
          >
            {outcome}
          </Badge>

          {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}

          <div className="text-sm">
            <span className="font-medium">{positions.length}</span>
            <span className="text-muted-foreground ml-1">
              {positions.length === 1 ? "position" : "positions"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Shares</p>
            <p className="font-medium">{formatBalance(totalShares)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Value</p>
            <p className="font-medium">{totalValue.toFixed(2)} APT</p>
          </div>
          {totalInvested > 0 && (
            <div className="text-right">
              <p className="text-muted-foreground text-xs">P&L</p>
              <p
                className={`font-medium ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {totalPnL >= 0 ? "+" : ""}
                {pnlPct.toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      </button>

      {/* Individual Pool Positions */}
      {isOpen && (
        <div className="border-t border-border/50">
          {positions.map((position, idx) => {
            const poolInfo =
              position.pools && position.pools.length > 0
                ? position.pools[0]
                : null;

            return (
              <div
                key={`${position.marketAddress}-${position.outcome}-${idx}`}
                className="p-3 border-b last:border-b-0 border-border/30 bg-card/50 hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {poolInfo && (
                      <Badge variant="outline" className="text-xs font-mono">
                        Pool: {poolInfo.poolAddress.substring(0, 8)}...
                      </Badge>
                    )}
                    {poolInfo && (
                      <Badge variant="outline" className="text-xs">
                        {poolInfo.fee / 100}% fee
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Shares</p>
                    <p className="font-medium">
                      {formatBalance(position.sharesOwned)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Avg Entry
                    </p>
                    <p className="font-medium">
                      ${position.avgEntryPrice.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Current
                    </p>
                    <p className="font-medium">
                      ${position.currentPrice.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Value</p>
                    <p className="font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      {position.currentValue.toFixed(4)} APT
                    </p>
                  </div>
                </div>

                {position.totalInvested > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/20">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Invested: {position.totalInvested.toFixed(4)} APT
                      </span>
                      <span
                        className={
                          position.unrealizedPnL >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        P&L: {position.unrealizedPnL >= 0 ? "+" : ""}
                        {position.unrealizedPnL.toFixed(4)} APT (
                        {position.unrealizedPnLPct.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MarketPositionCard({
  marketAddress,
  marketTitle,
  positions,
  marketStatus,
}: MarketPositionCardProps) {
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<{ yes: boolean; no: boolean }>({
    yes: false,
    no: false,
  });

  // Separate YES and NO positions
  const yesPositions = positions.filter((p) => p.outcome === "YES");
  const noPositions = positions.filter((p) => p.outcome === "NO");

  // Calculate totals
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalInvested = positions.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalPnL = totalValue - totalInvested;
  const totalShares = positions.reduce((sum, p) => sum + p.sharesOwned, 0);

  return (
    <div className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
      {/* Market Header */}
      <div className="p-4 bg-card">
        <div className="w-full flex items-start justify-between gap-4">
          <button
            onClick={() => setIsMarketOpen(!isMarketOpen)}
            className="flex items-start gap-3 flex-1 min-w-0 text-left"
          >
            {isMarketOpen ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1 line-clamp-2">
                {marketTitle}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {marketAddress.substring(0, 12)}...
              </p>

              {!isMarketOpen && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {positions.length} positions
                  </Badge>
                  {yesPositions.length > 0 && (
                    <Badge variant="default" className="text-xs">
                      {yesPositions.length} YES
                    </Badge>
                  )}
                  {noPositions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {noPositions.length} NO
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </button>

          <div className="flex items-center gap-3">
            {!isMarketOpen && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-lg font-bold">{totalValue.toFixed(2)} APT</p>
                {totalInvested > 0 && (
                  <p
                    className={`text-xs ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {totalPnL >= 0 ? "+" : ""}
                    {totalPnL.toFixed(2)} APT
                  </p>
                )}
              </div>
            )}

            <Link href={`/market/${marketAddress}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Market Details - YES/NO Groups */}
      {isMarketOpen && (
        <div className="border-t bg-accent/5">
          <div className="p-4 space-y-3">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-card rounded-lg border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Positions
                </p>
                <p className="text-lg font-bold">{positions.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Shares
                </p>
                <p className="text-lg font-bold">
                  {formatBalance(totalShares)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Value
                </p>
                <p className="text-lg font-bold">{totalValue.toFixed(2)} APT</p>
              </div>
            </div>

            {/* YES Positions Group */}
            {yesPositions.length > 0 && (
              <PositionGroup
                outcome="YES"
                positions={yesPositions}
                isOpen={openGroups.yes}
                onToggle={() =>
                  setOpenGroups((prev) => ({ ...prev, yes: !prev.yes }))
                }
                marketStatus={marketStatus}
              />
            )}

            {/* NO Positions Group */}
            {noPositions.length > 0 && (
              <PositionGroup
                outcome="NO"
                positions={noPositions}
                isOpen={openGroups.no}
                onToggle={() =>
                  setOpenGroups((prev) => ({ ...prev, no: !prev.no }))
                }
                marketStatus={marketStatus}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
