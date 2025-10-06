"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function ProtocolOverviewSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-48 bg-slate-700/50 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="p-4 h-24">
              <div className="flex items-start justify-between gap-2 h-full">
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-20 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-7 w-28 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-2 w-16 bg-slate-700/50 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-slate-700/30 rounded-lg animate-pulse" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
