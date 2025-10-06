"use client";

import {
  ArrowRight,
  TrendingUp,
  CalendarDays,
  Clock,
  Flame,
  Users,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Countdown } from "@/components/ui/countdown";
import { usePoolData } from "@/lib/tapp/hooks/use-pool-data";
import { DataIntegrityEngine } from "@/lib/engine/data-integrity.engine";
import type { Market } from "./MarketCard";

interface FeaturedMarketCardProps {
  market: Market;
}

export function FeaturedMarketCard({ market }: FeaturedMarketCardProps) {
  // Fetch real pool data
  const { data: poolData, isError: isPoolError } = usePoolData(market.id);

  // Determine pool state
  const poolExists = !isPoolError && poolData !== undefined;
  const yesReserve = poolData?.yesReserve || 0;
  const noReserve = poolData?.noReserve || 0;
  const totalReserve = yesReserve + noReserve;
  const hasLiquidity = totalReserve > 0;

  // ✅ USE DATA INTEGRITY ENGINE for correct calculations
  const priceResult = DataIntegrityEngine.calculatePrices({
    yesReserve,
    noReserve,
  });

  const probabilityResult = DataIntegrityEngine.calculateProbabilities({
    yesReserve,
    noReserve,
  });

  // Extract values (with fallbacks)
  const yesPrice = priceResult.success ? priceResult.data.yes : 0.5;
  const noPrice = priceResult.success ? priceResult.data.no : 0.5;
  const yesProbability = probabilityResult.success
    ? probabilityResult.data.yes
    : 50;
  const noProbability = probabilityResult.success
    ? probabilityResult.data.no
    : 50;

  // Display units for liquidity
  const totalLiquidityDisplay =
    DataIntegrityEngine.toDisplayUnits(totalReserve);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Link href={`/market/${market.id}`}>
        <Card className="group relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative p-6 space-y-5">
            {/* Header: Badge + Time */}
            <div className="flex items-center justify-between gap-3">
              <motion.div whileHover={{ scale: 1.05 }} className="relative">
                <Badge className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-primary to-primary/80 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  />
                  <Flame className="h-3.5 w-3.5 mr-1.5 inline" />
                  <span className="relative">FEATURED</span>
                </Badge>
              </motion.div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <Countdown
                  targetTimestamp={market.resolutionTimestamp}
                  variant="compact"
                  showIcon={false}
                  className="text-xs font-medium"
                />
              </div>
            </div>

            {/* Title */}
            <CardHeader className="p-0">
              <CardTitle className="text-lg md:text-xl font-bold tracking-tight leading-snug group-hover:text-primary transition-colors">
                {market.title}
              </CardTitle>
            </CardHeader>

            {/* Stats Grid - Compact 3 columns */}
            <div className="grid grid-cols-3 gap-3">
              {/* Liquidity */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40 group-hover:border-primary/20 transition-colors">
                <div className="text-xs text-muted-foreground mb-1">
                  Liquidity
                </div>
                <div className="text-sm font-bold font-mono">
                  {hasLiquidity ? (
                    <>
                      {totalLiquidityDisplay.toFixed(1)}
                      <span className="text-xs ml-1 text-primary">Tokens</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No pool</span>
                  )}
                </div>
              </div>

              {/* Volume (Mock for now) */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40 group-hover:border-primary/20 transition-colors">
                <div className="text-xs text-muted-foreground mb-1">
                  24h Volume
                </div>
                <div className="text-sm font-bold font-mono">
                  {market.totalVolume ? (
                    <>
                      {market.totalVolume.toFixed(0)}
                      <span className="text-xs ml-1 text-primary">APT</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              {/* Traders (Mock for now) */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40 group-hover:border-primary/20 transition-colors">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Traders
                </div>
                <div className="text-sm font-bold font-mono">
                  <span className="text-muted-foreground">-</span>
                </div>
              </div>
            </div>

            {/* Price Display - Side by Side */}
            {hasLiquidity ? (
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20 group-hover:border-green-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-green-400/70">
                      YES
                    </span>
                    <span className="text-2xl font-bold font-mono text-green-400">
                      {yesProbability}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${yesProbability}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <div className="text-xs text-green-400/60 mt-2 font-mono">
                    {DataIntegrityEngine.formatPrice(yesPrice)}
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20 group-hover:border-red-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-red-400/70">
                      NO
                    </span>
                    <span className="text-2xl font-bold font-mono text-red-400">
                      {noProbability}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${noProbability}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <div className="text-xs text-red-400/60 mt-2 font-mono">
                    {DataIntegrityEngine.formatPrice(noPrice)}
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="p-4 bg-muted/20 rounded-lg border border-border/40 text-center">
                <div className="text-sm text-muted-foreground">
                  No pool created yet - Default 50/50 pricing
                </div>
              </div>
            )}

            {/* CTA Button */}
            <Button
              className="w-full group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow"
              size="lg"
            >
              <span className="flex items-center gap-2">
                Trade Now
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </span>
            </Button>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
