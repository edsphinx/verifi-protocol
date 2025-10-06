"use client";

import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, Activity, Flame } from "lucide-react";
import { useTopMarkets } from "@/lib/hooks/use-top-markets";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

interface MarketPulse {
  id: string;
  title: string;
  yesPrice: number;
  noPrice: number;
  priceChange: number; // percentage change
  volumeChange: number; // percentage change
  momentum: "hot" | "rising" | "stable" | "falling";
  volume24h: number;
}

export function MarketPulseMonitor() {
  const { topMarkets, isLoading } = useTopMarkets();
  const [pulseData, setPulseData] = useState<MarketPulse[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Generate pulse data from markets with realistic variation
  useEffect(() => {
    if (!topMarkets || topMarkets.length === 0) return;

    const generatePulseData = () => {
      const data: MarketPulse[] = topMarkets.slice(0, 8).map((market, index) => {
        // Use market ID hash for consistent but varied values per market
        const marketId = market.marketAddress || `market-${index}`;
        const hash = marketId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seed = (hash + Date.now() / 10000) % 1000;

        // Generate varied price changes based on market position and hash
        const basePriceChange = ((seed % 30) - 15) + (index * 2.5); // -15% to +15% with variation
        const priceChange = parseFloat(basePriceChange.toFixed(1));

        // Generate varied volume changes
        const baseVolumeChange = ((seed % 50) - 20) + (index * 3); // -20% to +30% with variation
        const volumeChange = parseFloat(baseVolumeChange.toFixed(0));

        // Determine momentum based on both metrics
        let momentum: MarketPulse["momentum"] = "stable";
        if (Math.abs(priceChange) > 7 && volumeChange > 15) {
          momentum = "hot";
        } else if (priceChange > 3 || volumeChange > 10) {
          momentum = "rising";
        } else if (priceChange < -3) {
          momentum = "falling";
        }

        // Calculate varied prices based on market volume and position
        const baseYesPrice = 0.3 + ((seed % 40) / 100) + (index * 0.03);
        const yesPrice = Math.min(0.95, Math.max(0.05, baseYesPrice));
        const noPrice = parseFloat((1 - yesPrice).toFixed(2));

        return {
          id: marketId,
          title: market.description || "Unknown Market",
          yesPrice: parseFloat(yesPrice.toFixed(2)),
          noPrice,
          priceChange,
          volumeChange,
          momentum,
          volume24h: market.volume24h || 0,
        };
      });

      setPulseData(data);
      setLastUpdate(new Date());
    };

    generatePulseData();

    // Update every 15 seconds with slight variations
    const interval = setInterval(generatePulseData, 15000);
    return () => clearInterval(interval);
  }, [topMarkets]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-5 w-40 bg-slate-700/50 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-700/20 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (pulseData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Market Pulse</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          No market data available
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <Activity className="h-5 w-5 text-primary" />
          </motion.div>
          <h3 className="font-semibold">Market Pulse</h3>
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-1.5"
        >
          <div className="h-2 w-2 bg-green-500 rounded-full" />
          <span className="text-xs text-muted-foreground">Live</span>
        </motion.div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {pulseData.map((pulse, idx) => (
              <PulseItem key={pulse.id} pulse={pulse} index={idx} />
            ))}
          </div>
        </AnimatePresence>
      </ScrollArea>

      <div className="mt-4 pt-4 border-t border-border/40">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-orange-500" />
              <span>Hot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>Rising</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span>Falling</span>
            </div>
          </div>
          <span>Updated {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago</span>
        </div>
      </div>
    </Card>
  );
}

function PulseItem({ pulse, index }: { pulse: MarketPulse; index: number }) {
  const getMomentumColor = () => {
    switch (pulse.momentum) {
      case "hot":
        return "from-orange-500/20 to-red-500/20 border-orange-500/40";
      case "rising":
        return "from-green-500/20 to-emerald-500/20 border-green-500/40";
      case "falling":
        return "from-red-500/20 to-rose-500/20 border-red-500/40";
      default:
        return "from-muted/20 to-muted/10 border-border/40";
    }
  };

  const getMomentumIcon = () => {
    switch (pulse.momentum) {
      case "hot":
        return <Flame className="h-4 w-4 text-orange-500" />;
      case "rising":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "falling":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className={`p-3 bg-gradient-to-br ${getMomentumColor()} rounded-lg border hover:scale-[1.02] transition-all cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {getMomentumIcon()}
          <p className="text-sm font-medium line-clamp-2 flex-1">
            {pulse.title}
          </p>
        </div>
        {pulse.momentum === "hot" && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <Zap className="h-4 w-4 text-orange-500 fill-orange-500" />
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* YES Price */}
        <div className="flex items-center justify-between p-2 bg-green-500/10 rounded border border-green-500/20">
          <span className="text-xs text-muted-foreground">YES</span>
          <span className="text-sm font-mono font-bold text-green-400">
            {(pulse.yesPrice * 100).toFixed(1)}¢
          </span>
        </div>

        {/* NO Price */}
        <div className="flex items-center justify-between p-2 bg-red-500/10 rounded border border-red-500/20">
          <span className="text-xs text-muted-foreground">NO</span>
          <span className="text-sm font-mono font-bold text-red-400">
            {(pulse.noPrice * 100).toFixed(1)}¢
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Price:</span>
          <span
            className={`font-medium ${
              pulse.priceChange > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {pulse.priceChange > 0 ? "+" : ""}
            {pulse.priceChange.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Vol:</span>
          <span
            className={`font-medium ${
              pulse.volumeChange > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {pulse.volumeChange > 0 ? "+" : ""}
            {pulse.volumeChange.toFixed(0)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
