"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function ChartSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-40 bg-slate-700/50 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-slate-700/30 rounded animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-slate-700/30 rounded animate-pulse" />
        </div>
        <div className="h-64 bg-slate-700/20 rounded-lg relative overflow-hidden">
          {/* Animated bars */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-4 pb-4 gap-2">
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${30 + Math.random() * 60}%` }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                className="flex-1 bg-slate-600/40 rounded-t animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
