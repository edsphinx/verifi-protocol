"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useRecentActivity } from "@/lib/hooks/use-recent-activity";
import { formatDistanceToNow } from "date-fns";

export function LiveActivityTicker() {
  const { data, isLoading } = useRecentActivity(15);
  const [isPaused, setIsPaused] = useState(false);

  const activities = data?.activities;

  // Duplicate activities for seamless loop
  const duplicatedActivities = activities
    ? [...activities, ...activities, ...activities]
    : [];

  if (isLoading || !activities || activities.length === 0) {
    return null; // Hide ticker if no data
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-y border-slate-700/50">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />

      <motion.div
        className="flex gap-8 py-3"
        animate={{
          x: isPaused ? 0 : [0, -2000],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          },
        }}
        onHoverStart={() => setIsPaused(true)}
        onHoverEnd={() => setIsPaused(false)}
      >
        {duplicatedActivities.map((activity, idx) => (
          <ActivityItem key={`${activity.id}-${idx}`} activity={activity} />
        ))}
      </motion.div>

      {/* Gradient overlays for fade effect - positioned at viewport edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />
    </div>
  );
}

function ActivityItem({ activity }: { activity: any }) {
  const isYes = activity.outcome?.toLowerCase() === "yes";
  const isBuy = activity.type?.toLowerCase() === "buy";

  return (
    <div className="flex items-center gap-3 px-4 py-1 bg-slate-800/40 rounded-lg border border-slate-700/30 backdrop-blur-sm whitespace-nowrap">
      {/* Type indicator */}
      <div className="flex items-center gap-1.5">
        {isBuy ? (
          <TrendingUp className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-red-400" />
        )}
        <span
          className={`text-xs font-semibold ${
            isBuy ? "text-green-400" : "text-red-400"
          }`}
        >
          {activity.type}
        </span>
      </div>

      {/* Amount */}
      <span className="text-sm font-mono font-medium text-foreground">
        {activity.amount} APT
      </span>

      {/* Outcome */}
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded ${
          isYes
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        }`}
      >
        {activity.outcome}
      </span>

      {/* Market (truncated) */}
      <span className="text-xs text-muted-foreground max-w-[200px] truncate">
        {activity.marketDescription}
      </span>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {formatDistanceToNow(new Date(activity.timestamp), {
          addSuffix: true,
        })}
      </div>
    </div>
  );
}
