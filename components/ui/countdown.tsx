"use client";

import { useCountdown } from "@/lib/hooks/useCountdown";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface CountdownProps {
  targetTimestamp: number;
  className?: string;
  variant?: "default" | "compact" | "badge";
  showIcon?: boolean;
}

export function Countdown({
  targetTimestamp,
  className,
  variant = "default",
  showIcon = true,
}: CountdownProps) {
  const timeRemaining = useCountdown(targetTimestamp);

  if (timeRemaining.isExpired) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          variant === "badge" && "text-xs",
          className
        )}
      >
        {showIcon && <Clock className="h-4 w-4" />}
        <span>Expired</span>
      </div>
    );
  }

  // Compact variant: "2d 5h 30m"
  if (variant === "compact") {
    const parts = [];
    if (timeRemaining.days > 0) parts.push(`${timeRemaining.days}d`);
    if (timeRemaining.hours > 0 || timeRemaining.days > 0)
      parts.push(`${timeRemaining.hours}h`);
    parts.push(`${timeRemaining.minutes}m`);

    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm font-medium",
          timeRemaining.totalSeconds < 3600 && "text-destructive",
          timeRemaining.totalSeconds < 86400 &&
            timeRemaining.totalSeconds >= 3600 &&
            "text-orange-500",
          className
        )}
      >
        {showIcon && <Clock className="h-4 w-4" />}
        <span>{parts.join(" ")}</span>
      </div>
    );
  }

  // Badge variant: minimal
  if (variant === "badge") {
    const parts = [];
    if (timeRemaining.days > 0) parts.push(`${timeRemaining.days}d`);
    if (timeRemaining.hours > 0) parts.push(`${timeRemaining.hours}h`);
    if (timeRemaining.minutes > 0) parts.push(`${timeRemaining.minutes}m`);

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium",
          timeRemaining.totalSeconds < 3600 && "text-destructive",
          timeRemaining.totalSeconds < 86400 &&
            timeRemaining.totalSeconds >= 3600 &&
            "text-orange-500",
          className
        )}
      >
        {showIcon && <Clock className="h-3 w-3" />}
        {parts.join(" ")}
      </span>
    );
  }

  // Default variant: full display with labels
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showIcon && <Clock className="h-5 w-5 text-muted-foreground" />}
      <div className="flex gap-2">
        {timeRemaining.days > 0 && (
          <TimeUnit value={timeRemaining.days} label="days" />
        )}
        <TimeUnit value={timeRemaining.hours} label="hrs" />
        <TimeUnit value={timeRemaining.minutes} label="min" />
        {timeRemaining.days === 0 && (
          <TimeUnit value={timeRemaining.seconds} label="sec" />
        )}
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-bold tabular-nums">{value.toString().padStart(2, "0")}</div>
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
    </div>
  );
}
