"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function VolumeChartSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse" />
          <div className="h-8 w-48 bg-slate-700/50 rounded animate-pulse" />
        </div>

        {/* Chart Area */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="h-[300px] bg-muted/20 rounded-lg flex items-end justify-around p-4 origin-bottom"
        >
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.random() * 80 + 20}%` }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
              className="w-12 bg-primary/20 rounded-t animate-pulse"
            />
          ))}
        </motion.div>
      </div>
    </Card>
  );
}
