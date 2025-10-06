/**
 * @file Lightweight Progress Bar
 * @description Simple progress bar with gradient support
 */

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  color?: "green" | "red" | "blue" | "orange" | "purple";
  showLabel?: boolean;
  label?: string;
  height?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  color = "blue",
  showLabel = false,
  label,
  height = "md",
  className,
}: ProgressBarProps) {
  const colorClasses = {
    green: "bg-green-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
  };

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("w-full space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{clampedValue.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "transition-all duration-500 ease-out rounded-full",
            heightClasses[height],
            colorClasses[color],
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
