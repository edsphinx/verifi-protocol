/**
 * @file Lightweight Stat Card
 * @description Replacement for heavy chart components - shows key metrics with visual appeal
 */

import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "red" | "gray" | "blue" | "orange";
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  color = "gray",
  subtitle,
  icon,
  className,
}: StatCardProps) {
  const colorClasses = {
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    gray: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };

  const getTrendIcon = () => {
    if (trend === "up") return <ArrowUpIcon className="w-4 h-4" />;
    if (trend === "down") return <ArrowDownIcon className="w-4 h-4" />;
    return <MinusIcon className="w-4 h-4" />;
  };

  return (
    <Card className={cn("p-4 transition-all hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{label}</p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <h3 className="text-xl font-bold tracking-tight break-words">{value}</h3>
            {trend && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium shrink-0",
                  trend === "up" && "text-green-600 dark:text-green-400",
                  trend === "down" && "text-red-600 dark:text-red-400",
                  trend === "neutral" && "text-gray-600 dark:text-gray-400",
                )}
              >
                {getTrendIcon()}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate" title={subtitle}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn("p-2 rounded-lg shrink-0", colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
