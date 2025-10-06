/**
 * @file Protocol Overview
 * @description Key protocol metrics displayed as stat cards
 */

"use client";

import { StatCard } from "@/components/ui/stat-card";
import { useProtocolMetrics } from "@/lib/hooks";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { motion, AnimatePresence } from "framer-motion";
import { ProtocolOverviewSkeleton } from "./skeletons/ProtocolOverviewSkeleton";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Lock,
  BarChart3,
  Users,
  Activity,
  Coins,
  Target,
  Zap,
} from "lucide-react";

export function ProtocolOverview() {
  const { protocol, isLoading, volumeChange24h, tvlChange24h } =
    useProtocolMetrics();
  const [showLoader, setShowLoader] = useState(false);

  // Show loader after skeleton appears
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoader(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  return (
    <AnimatePresence mode="wait">
      {isLoading || !protocol ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {showLoader ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <VeriFiLoader message="Loading protocol metrics..." />
            </div>
          ) : (
            <ProtocolOverviewSkeleton />
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1], // Bouncy easing for "degen" feel
          }}
        >
          {renderContent(protocol, volumeChange24h, tvlChange24h, formatAPT, formatNumber)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function renderContent(
  protocol: any,
  volumeChange24h: number,
  tvlChange24h: number,
  formatAPT: (amount: number) => string,
  formatNumber: (num: number) => string
) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Protocol Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Volume"
          value={`${formatAPT(protocol.totalVolume)} APT`}
          trend={volumeChange24h > 0 ? "up" : volumeChange24h < 0 ? "down" : "neutral"}
          subtitle={`${volumeChange24h >= 0 ? "+" : ""}${volumeChange24h.toFixed(2)}% 24h`}
          color="blue"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Total Value Locked"
          value={`${formatAPT(protocol.totalValueLocked)} APT`}
          trend={tvlChange24h > 0 ? "up" : tvlChange24h < 0 ? "down" : "neutral"}
          subtitle={`${tvlChange24h >= 0 ? "+" : ""}${tvlChange24h.toFixed(2)}% 24h`}
          color="green"
          icon={<Lock className="h-5 w-5" />}
        />
        <StatCard
          label="Active Markets"
          value={protocol.activeMarkets}
          subtitle={`${protocol.totalMarkets} total`}
          color="orange"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          label="Total Users"
          value={formatNumber(protocol.totalUsers)}
          subtitle={`${formatNumber(protocol.activeUsers24h)} active`}
          color="blue"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="24h Volume"
          value={`${formatAPT(protocol.volume24h)} APT`}
          subtitle="Last 24h"
          color="blue"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="24h Trades"
          value={formatNumber(protocol.trades24h)}
          subtitle={`${formatNumber(protocol.totalTrades)} total`}
          color="green"
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          label="Total Liquidity"
          value={`${formatAPT(protocol.totalLiquidity)} APT`}
          subtitle={`${protocol.totalPools} pools`}
          color="orange"
          icon={<Coins className="h-5 w-5" />}
        />
        <StatCard
          label="Resolved Markets"
          value={protocol.resolvedMarkets}
          subtitle={`${((protocol.resolvedMarkets / protocol.totalMarkets) * 100).toFixed(1)}%`}
          color="gray"
          icon={<Target className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

const formatAPT = (amount: number) => {
  // Data is already in APT format in database
  return amount.toFixed(2);
};

const formatNumber = (num: number) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toString();
};
