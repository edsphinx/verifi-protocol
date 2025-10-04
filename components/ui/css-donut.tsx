/**
 * @file CSS-only Donut Chart
 * @description Lightweight donut chart using conic gradient (0 KB JS)
 */

import { cn } from "@/lib/utils";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface CSSDonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  className?: string;
}

export function CSSDonut({
  segments,
  size = 160,
  thickness = 40,
  showLegend = true,
  className,
}: CSSDonutProps) {
  // Calculate total
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  // Build conic gradient
  let currentPercent = 0;
  const gradientStops = segments
    .map((seg) => {
      const percent = (seg.value / total) * 100;
      const start = currentPercent;
      const end = currentPercent + percent;
      currentPercent = end;
      return `${seg.color} ${start}% ${end}%`;
    })
    .join(", ");

  const innerSize = size - thickness * 2;

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* Donut Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer ring with gradient */}
        <div
          className="rounded-full transition-all duration-500"
          style={{
            width: size,
            height: size,
            background: `conic-gradient(${gradientStops})`,
          }}
        />
        {/* Inner circle (creates donut hole) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-full flex items-center justify-center"
          style={{
            width: innerSize,
            height: innerSize,
          }}
        >
          <div className="text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-2 flex-1">
          {segments.map((seg, idx) => {
            const percentage = ((seg.value / total) * 100).toFixed(1);
            return (
              <div key={idx} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-sm truncate">{seg.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{seg.value}</p>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
