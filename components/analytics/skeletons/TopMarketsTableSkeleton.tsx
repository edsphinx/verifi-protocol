"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function TopMarketsTableSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse" />
          <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse" />
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="h-4 w-4 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 flex-1 max-w-md bg-slate-700/50 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-20 bg-slate-700/50 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
