"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-700/50 rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-4"
            >
              <div className="h-12 flex-1 bg-slate-700/30 rounded animate-pulse" />
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
