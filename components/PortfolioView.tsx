"use client";

/**
 * Portfolio View - Degen DX Edition
 * Professional, satisfying portfolio experience with bouncy animations
 */

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, RefreshCw, TrendingUp, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { usePortfolio } from "@/lib/hooks";
import { ActivityFeed } from "@/components/portfolio/ActivityFeed";
import { MarketPositionCard } from "@/components/portfolio/MarketPositionCard";
import { LiquidityPositions } from "@/components/portfolio/LiquidityPositions";
import { StatCard } from "@/components/ui/stat-card";
import { CSSDonut } from "@/components/ui/css-donut";
import { useUserActivities } from "@/lib/hooks/use-user-activities";

// Bouncy "degen" easing for professional animations
const bouncy = [0.34, 1.56, 0.64, 1] as const;

const fadeInUp = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

export function PortfolioView() {
  const { account } = useWallet();

  const {
    portfolio,
    isLoading: isLoadingPortfolio,
    totalValue,
    totalPnL,
    totalPnLPct,
    roi,
    openPositionsCount,
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

  // Group positions by market for MarketPositionCard component
  const groupedPositions = useMemo(() => {
    if (!portfolio?.openPositions) return [];

    const marketGroups = new Map<
      string,
      {
        marketAddress: string;
        marketTitle: string;
        positions: typeof portfolio.openPositions;
        marketStatus: number;
      }
    >();

    portfolio.openPositions.forEach((pos) => {
      if (!marketGroups.has(pos.marketAddress)) {
        marketGroups.set(pos.marketAddress, {
          marketAddress: pos.marketAddress,
          marketTitle: pos.marketDescription,
          positions: [],
          marketStatus: pos.status === "OPEN" ? 0 : 1,
        });
      }

      const group = marketGroups.get(pos.marketAddress)!;
      group.positions.push(pos);
    });

    return Array.from(marketGroups.values());
  }, [portfolio?.openPositions]);

  const handleRefresh = () => {
    refetchPortfolio();
    refetchActivities();
  };

  if (!account) {
    return (
      <motion.div
        {...fadeInUp}
        transition={{ duration: 0.5, ease: bouncy }}
        className="space-y-6"
      >
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: bouncy }}
          className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary"
        >
          Portfolio
        </motion.h1>
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Connect your wallet to view your portfolio
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Don't block rendering - show content with loading indicator instead
  // The UserPositions and ActivityFeed components handle their own loading states

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: bouncy }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: bouncy }}
        className="flex items-center justify-between"
      >
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
          Portfolio
        </h1>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: bouncy }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Performance Metrics - Stat Cards with Staggered Animations */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            label: "Total Portfolio Value",
            value: `${totalValue.toFixed(2)} APT`,
            trend: totalValue > 0 ? "up" : "neutral",
            color: totalValue > 0 ? "green" : "gray",
            icon: <TrendingUp className="w-5 h-5" />,
            subtitle: `${openPositionsCount} active positions`,
          },
          {
            label: "Total Markets",
            value: `${portfolio?.openPositions ? new Set(portfolio.openPositions.map((p) => p.marketAddress)).size : 0}`,
            trend: "neutral",
            color: "blue",
            icon: <Target className="w-5 h-5" />,
            subtitle: "Markets with positions",
          },
          {
            label: "Total Trades",
            value: `${portfolio?.stats?.totalTrades || 0}`,
            trend:
              portfolio?.stats?.totalTrades && portfolio.stats.totalTrades > 0
                ? "up"
                : "neutral",
            color:
              portfolio?.stats?.totalTrades && portfolio.stats.totalTrades > 0
                ? "green"
                : "gray",
            icon: <Trophy className="w-5 h-5" />,
            subtitle: `${portfolio?.stats?.totalVolume.toFixed(2) || "0.00"} APT volume`,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.2 + index * 0.1,
              ease: bouncy,
            }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <StatCard
              label={stat.label}
              value={stat.value}
              trend={stat.trend as any}
              color={stat.color as any}
              icon={stat.icon}
              subtitle={stat.subtitle}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Portfolio Breakdown - Lightweight CSS Donut */}
      <AnimatePresence mode="wait">
        {donutData.length > 0 && donutData.some((d) => d.value > 0) && (
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.5, ease: bouncy }}
            className="bg-card rounded-lg border p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Position Distribution</h3>
            <CSSDonut segments={donutData} size={200} thickness={50} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pure Plays - VeriFi Trading Positions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: bouncy }}
        className="space-y-4"
      >
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.65, ease: bouncy }}
          className="text-2xl font-bold"
        >
          🎯 Pure Plays
        </motion.h2>
        <AnimatePresence mode="wait">
          {isLoadingPortfolio ? (
            <motion.div
              key="loading"
              {...fadeInUp}
              transition={{ duration: 0.3 }}
            >
              <Card className="min-h-[200px] flex items-center justify-center">
                <VeriFiLoader message="Loading positions..." />
              </Card>
            </motion.div>
          ) : groupedPositions.length === 0 ? (
            <motion.div
              key="empty"
              {...fadeInUp}
              transition={{ duration: 0.4, ease: bouncy }}
            >
              <Card className="p-6">
                <p className="text-sm text-muted-foreground text-center">
                  No pure plays yet. Browse markets to start betting!
                </p>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="positions"
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {groupedPositions.map((group, index) => (
                <motion.div
                  key={group.marketAddress}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.7 + index * 0.08,
                    ease: bouncy,
                  }}
                  whileHover={{ scale: 1.01, x: 4 }}
                >
                  <MarketPositionCard
                    marketAddress={group.marketAddress}
                    marketTitle={group.marketTitle}
                    positions={group.positions}
                    marketStatus={group.marketStatus}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* LP Farms - AMM Liquidity Positions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8, ease: bouncy }}
      >
        <LiquidityPositions
          positions={portfolio?.liquidityPositions || []}
          isLoading={isLoadingPortfolio}
        />
      </motion.div>

      {/* Trading History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: bouncy }}
      >
        <ActivityFeed
          activities={activitiesData?.activities || []}
          isLoading={isLoadingActivities}
        />
      </motion.div>
    </motion.div>
  );
}
