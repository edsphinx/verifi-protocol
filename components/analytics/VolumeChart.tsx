/**
 * @file Volume Chart
 * @description 7-day volume trend visualization
 */

"use client";

import { Card, AreaChart } from "@tremor/react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useVolumeHistory } from "@/lib/hooks/use-volume-history";
import { format } from "date-fns";

export function VolumeChart() {
  const { data, isLoading } = useVolumeHistory(7);

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </Card>
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
  );
}
