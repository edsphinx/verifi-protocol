/**
 * @file Global Stats Ticker
 * @description Scrolling banner showing live protocol stats
 */

"use client";

import { useProtocolMetrics, useRecentActivity } from "@/lib/hooks";
import { TrendingUp, Activity, Users, BarChart3, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function GlobalStatsTicker() {
  const { protocol } = useProtocolMetrics();
  const { data: activityData } = useRecentActivity(1);

  if (!protocol) return null;

  const lastActivity = activityData?.activities[0];

  const stats = [
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "24h Volume",
      value: `${protocol.volume24h.toFixed(2)} APT`,
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "24h Trades",
      value: protocol.trades24h.toString(),
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Active Users",
      value: protocol.activeUsers24h.toString(),
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Active Markets",
      value: protocol.activeMarkets.toString(),
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: "Last Activity",
      value: lastActivity
        ? formatDistanceToNow(new Date(lastActivity.timestamp), { addSuffix: true })
        : "No recent activity",
    },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white overflow-hidden">
      <div className="animate-marquee whitespace-nowrap py-2">
        <div className="inline-flex items-center gap-8 px-4">
          {/* Repeat stats multiple times for seamless loop */}
          {[...Array(3)].map((_, repeatIndex) => (
            <div key={repeatIndex} className="inline-flex items-center gap-8">
              {stats.map((stat, index) => (
                <div key={`${repeatIndex}-${index}`} className="inline-flex items-center gap-2">
                  <div className="opacity-80">{stat.icon}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium opacity-90">{stat.label}:</span>
                    <span className="text-sm font-bold">{stat.value}</span>
                  </div>
                  {index < stats.length - 1 && (
                    <div className="w-px h-4 bg-white/30 ml-2" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
