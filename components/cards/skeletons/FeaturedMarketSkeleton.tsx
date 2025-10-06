"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function FeaturedMarketSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <div className="p-6 space-y-5">
          {/* Header: Badge + Time */}
          <div className="flex items-center justify-between gap-3">
            <div className="h-7 w-28 bg-primary/20 rounded animate-pulse" />
            <div className="h-5 w-24 bg-slate-700/50 rounded animate-pulse" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-6 w-full bg-slate-700/50 rounded animate-pulse" />
            <div className="h-6 w-3/4 bg-slate-700/50 rounded animate-pulse" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="origin-left"
              >
                <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                  <div className="h-3 w-16 bg-slate-700/50 rounded animate-pulse mb-2" />
                  <div className="h-5 w-20 bg-slate-700/50 rounded animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Price Display */}
          <div className="grid grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              >
                <div
                  className={`p-4 rounded-lg border ${
                    i === 0
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-10 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-7 w-16 bg-slate-700/50 rounded animate-pulse" />
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full animate-pulse" />
                  <div className="h-3 w-12 bg-slate-700/50 rounded animate-pulse mt-2" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="h-11 w-full bg-primary/20 rounded-md animate-pulse" />
        </div>
      </Card>
    </motion.div>
  );
}
