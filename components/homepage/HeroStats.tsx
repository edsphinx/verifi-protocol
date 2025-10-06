"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, BarChart3, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useProtocolMetrics } from "@/lib/hooks";
import { useState, useEffect } from "react";

export function HeroStats() {
  const { protocol, isLoading } = useProtocolMetrics();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading || !protocol) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="p-4">
              <div className="h-10 w-24 bg-slate-700/50 rounded animate-pulse" />
              <div className="h-6 w-16 bg-slate-700/50 rounded animate-pulse mt-2" />
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Total Volume",
      value: `${protocol.totalVolume.toFixed(0)} APT`,
      icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
      color: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-500/20",
    },
    {
      label: "Active Markets",
      value: protocol.activeMarkets,
      icon: <BarChart3 className="h-5 w-5 text-orange-400" />,
      color: "from-orange-500/10 to-orange-500/5",
      border: "border-orange-500/20",
    },
    {
      label: "Total Users",
      value:
        protocol.totalUsers >= 1000
          ? `${(protocol.totalUsers / 1000).toFixed(1)}K`
          : protocol.totalUsers,
      icon: <Users className="h-5 w-5 text-green-400" />,
      color: "from-green-500/10 to-green-500/5",
      border: "border-green-500/20",
    },
    {
      label: "24h Trades",
      value:
        protocol.trades24h >= 1000
          ? `${(protocol.trades24h / 1000).toFixed(1)}K`
          : protocol.trades24h,
      icon: <Zap className="h-5 w-5 text-purple-400" />,
      color: "from-purple-500/10 to-purple-500/5",
      border: "border-purple-500/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
      transition={{
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className="mb-8"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: i * 0.1,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <Card
              className={`p-4 bg-gradient-to-br ${stat.color} border ${stat.border} hover:scale-105 transition-transform duration-300 cursor-default`}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    delay: i * 0.2,
                  }}
                >
                  {stat.icon}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <motion.p
                    className="text-xl font-bold font-mono"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                  >
                    {stat.value}
                  </motion.p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
