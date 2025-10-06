/**
 * @file Volume Chart
 * @description 7-day volume trend visualization
 */

"use client";

import { Card, AreaChart } from "@tremor/react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useVolumeHistory } from "@/lib/hooks/use-volume-history";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { ChartSkeleton } from "./skeletons/ChartSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { format } from "date-fns";

export function VolumeChart() {
  const { data, isLoading } = useVolumeHistory(7);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoader(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {showLoader ? (
            <Card className="min-h-[320px] flex items-center justify-center">
              <VeriFiLoader message="Loading volume chart..." />
            </Card>
          ) : (
            <ChartSkeleton />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">7-Day Volume Trend</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No volume data available
        </div>
      </Card>
    );
  }

  // Format data for chart - data is already in APT
  const chartData = data.data.map((point) => ({
    date: format(new Date(point.date), "MMM dd"),
    Volume: Number(point.volume.toFixed(2)),
    Trades: point.trades,
  }));

  // Calculate trend
  const firstValue = data.data[0]?.volume || 0;
  const lastValue = data.data[data.data.length - 1]?.volume || 0;
  const trend = lastValue >= firstValue;
  const changePercent =
    firstValue > 0 ? (((lastValue - firstValue) / firstValue) * 100).toFixed(2) : "0.00";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        <Card>
          <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">7-Day Volume Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Average: {data.average.toFixed(2)} APT per day
          </p>
        </div>
        <div className="flex items-center gap-2">
          {trend ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          <span
            className={`text-sm font-semibold ${
              trend ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {trend ? "+" : ""}
            {changePercent}%
          </span>
        </div>
      </div>

      <AreaChart
        className="h-64"
        data={chartData}
        index="date"
        categories={["Volume"]}
        colors={["blue"]}
        valueFormatter={(value) => `${value} APT`}
        showLegend={false}
        showGridLines={true}
        showAnimation={true}
        curveType="natural"
      />

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Volume</p>
            <p className="text-lg font-semibold mt-1">
              {data.total.toFixed(2)} APT
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Daily</p>
            <p className="text-lg font-semibold mt-1">
              {data.average.toFixed(2)} APT
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Peak Day</p>
            <p className="text-lg font-semibold mt-1">
              {Math.max(...data.data.map((d) => d.volume)).toFixed(2)} APT
            </p>
          </div>
        </div>
      </div>
    </Card>
      </motion.div>
    </AnimatePresence>
  );
}
