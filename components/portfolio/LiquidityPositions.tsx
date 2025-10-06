"use client";

/**
 * Liquidity Positions Component - Degen DX Edition
 * Professional LP positions with bouncy animations
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { LiquidityPositionData } from "@/lib/types/database.types";

// Bouncy "degen" easing for professional animations
const bouncy = [0.34, 1.56, 0.64, 1] as const;

interface LiquidityPositionsProps {
  positions: LiquidityPositionData[];
  isLoading?: boolean;
}

interface GroupedLPPosition {
  marketAddress: string;
  marketDescription: string;
  positions: LiquidityPositionData[];
}

const formatValue = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}k`;
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(4);
};

function LPPositionCard({ lp }: { lp: LiquidityPositionData }) {
  const pnlPct =
    lp.liquidityProvided > 0
      ? (lp.unrealizedPnL / lp.liquidityProvided) * 100
      : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      transition={{ duration: 0.2, ease: bouncy }}
      className="p-4 border rounded-lg hover:bg-accent/20 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs font-mono">
              LP NFT: {lp.id.substring(0, 8)}...
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              Pool: {lp.poolAddress.substring(0, 8)}...
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Added {new Date(lp.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Liquidity</p>
          <p className="font-medium">{formatValue(lp.liquidityProvided)} APT</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Current Value</p>
          <p className="font-medium">{formatValue(lp.currentValue)} APT</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Fees Earned</p>
          <p className="font-medium text-green-500">
            +{formatValue(lp.feesEarned)} APT
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">APR</p>
          <p className="font-medium">{lp.apr.toFixed(2)}%</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">YES:</span>{" "}
            <span className="font-medium">{formatValue(lp.yesAmount)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">NO:</span>{" "}
            <span className="font-medium">{formatValue(lp.noAmount)}</span>
          </div>
        </div>

        {lp.liquidityProvided > 0 && (
          <div
            className={`text-sm font-medium ${
              lp.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {lp.unrealizedPnL >= 0 ? "+" : ""}
            {lp.unrealizedPnL.toFixed(4)} APT ({pnlPct >= 0 ? "+" : ""}
            {pnlPct.toFixed(2)}%)
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MarketLPGroup({ group }: { group: GroupedLPPosition }) {
  const [isOpen, setIsOpen] = useState(false);

  const totalValue = group.positions.reduce(
    (sum, lp) => sum + lp.currentValue,
    0,
  );
  const totalFees = group.positions.reduce((sum, lp) => sum + lp.feesEarned, 0);
  const totalPnL = group.positions.reduce(
    (sum, lp) => sum + lp.unrealizedPnL,
    0,
  );

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2, ease: bouncy }}
      className="border rounded-lg overflow-hidden"
    >
      <div className="p-4 bg-card">
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-start gap-3 flex-1 min-w-0 text-left"
          >
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1 line-clamp-2">
                {group.marketDescription}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                {group.marketAddress.substring(0, 12)}...
              </p>

              {!isOpen && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Droplets className="h-3 w-3 mr-1" />
                    {group.positions.length} LP{" "}
                    {group.positions.length === 1 ? "position" : "positions"}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-green-500">
                    +{totalFees.toFixed(2)} APT fees
                  </Badge>
                </div>
              )}
            </div>
          </button>

          <div className="flex items-center gap-3">
            {!isOpen && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-lg font-bold">{totalValue.toFixed(2)} APT</p>
                <p
                  className={`text-xs ${
                    totalPnL >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {totalPnL >= 0 ? "+" : ""}
                  {totalPnL.toFixed(2)} APT
                </p>
              </div>
            )}

            <Link href={`/market/${group.marketAddress}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: bouncy }}
            className="border-t bg-accent/5 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {group.positions.map((lp, index) => (
                <motion.div
                  key={lp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: bouncy }}
                >
                  <LPPositionCard lp={lp} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function LiquidityPositions({
  positions,
  isLoading,
}: LiquidityPositionsProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: bouncy }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🌾 LP Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading farms...</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: bouncy }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🌾 LP Farms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              No farms yet. Add liquidity to start farming fees! 🚜
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Group LP positions by market
  const groupedPositions = positions.reduce(
    (acc, lp) => {
      if (!acc[lp.marketAddress]) {
        acc[lp.marketAddress] = {
          marketAddress: lp.marketAddress,
          marketDescription: lp.marketDescription,
          positions: [],
        };
      }
      acc[lp.marketAddress].positions.push(lp);
      return acc;
    },
    {} as Record<string, GroupedLPPosition>,
  );

  const groups = Object.values(groupedPositions);

  const totalValue = positions.reduce((sum, lp) => sum + lp.currentValue, 0);
  const totalFees = positions.reduce((sum, lp) => sum + lp.feesEarned, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: bouncy }}
      className="space-y-4"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: bouncy }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
          🌾 LP Farms
        </h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: bouncy }}
          className="text-right"
        >
          <p className="text-sm text-muted-foreground">Total Farm Value</p>
          <p className="text-2xl font-bold">{totalValue.toFixed(2)} APT</p>
          <p className="text-xs text-green-500">
            <TrendingUp className="h-3 w-3 inline mr-1" />+
            {totalFees.toFixed(2)} APT farmed
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {groups.map((group, index) => (
          <motion.div
            key={group.marketAddress}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.3 + index * 0.08,
              ease: bouncy,
            }}
          >
            <MarketLPGroup group={group} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
