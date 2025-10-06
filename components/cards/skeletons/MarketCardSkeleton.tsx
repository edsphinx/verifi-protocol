"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function MarketCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col justify-between border-border/40 bg-card">
        <div>
          {/* Header */}
          <div className="p-6 pb-3">
            <div className="flex justify-between items-center mb-3">
              <div className="h-6 w-24 bg-slate-700/50 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-700/50 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-full bg-slate-700/50 rounded animate-pulse" />
              <div className="h-5 w-4/5 bg-slate-700/50 rounded animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 space-y-3 pb-4">
            {/* Volume */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="origin-left"
            >
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-slate-700/50 rounded animate-pulse" />
                </div>
              </div>
            </motion.div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="origin-left"
            >
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                <div className="h-3 w-24 bg-slate-700/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-slate-700/50 rounded animate-pulse" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <div className="h-5 w-full bg-primary/20 rounded animate-pulse" />
        </div>
      </Card>
    </motion.div>
  );
}
