"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export function CardSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <Card className={`p-6 ${height}`}>
      <div className="space-y-4 h-full">
        <div className="h-6 w-40 bg-slate-700/50 rounded animate-pulse" />
        <div className="space-y-3 flex-1">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
              className="origin-left"
            >
              <div className="h-12 bg-slate-700/30 rounded animate-pulse" />
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}
