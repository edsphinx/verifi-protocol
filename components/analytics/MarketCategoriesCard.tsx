/**
 * @file Market Categories Card
 * @description Visual breakdown of markets by category
 */

"use client";

import { Card } from "@tremor/react";
import { BarChart3, TrendingUp, DollarSign, Users, Zap } from "lucide-react";
import { useMarketCategories } from "@/lib/hooks/use-market-categories";

const categoryIcons: Record<string, any> = {
  crypto: DollarSign,
  defi: TrendingUp,
  sports: Users,
  politics: BarChart3,
  other: Zap,
};

const categoryColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500",
];

export function MarketCategoriesCard() {
  const { data, isLoading } = useMarketCategories();

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">Market Categories</h3>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          No categories available
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Market Distribution</h3>

      <div className="space-y-4">
        {/* Category Bars */}
        <div className="space-y-3">
          {data.categories.map((category, index) => {
            const Icon = categoryIcons[category.category.toLowerCase()] || Zap;
            const color = categoryColors[index % categoryColors.length];

            return (
              <div key={category.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium capitalize">
                      {category.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {category.count} markets
                    </span>
                    <span className="font-semibold min-w-[3rem] text-right">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all duration-500 ease-out`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {category.volume.toFixed(2)} APT volume
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total Markets</span>
            <span className="text-lg">{data.total}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
