/**
 * @file Performance Metrics
 * @description Bullet charts showing portfolio performance vs targets
 */

'use client';

import { Card } from '@tremor/react';
import { ResponsiveBullet } from '@nivo/bullet';
import { useTheme } from 'next-themes';

interface PerformanceMetricsProps {
  roi: number; // Current ROI percentage
  winRate: number; // Win rate percentage (0-100)
  totalPnL: number; // Total PnL percentage
}

export function PerformanceMetrics({
  roi,
  winRate,
  totalPnL,
}: PerformanceMetricsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = [
    {
      id: 'ROI',
      ranges: [0, 25, 50, 100], // Poor | Good | Excellent zones
      measures: [roi],
      markers: [50], // Target marker
    },
    {
      id: 'Win Rate',
      ranges: [0, 40, 60, 100],
      measures: [winRate],
      markers: [60],
    },
    {
      id: 'Total PnL',
      ranges: [-50, 0, 25, 100],
      measures: [totalPnL],
      markers: [25],
    },
  ];

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      <div className="h-[250px]">
        <ResponsiveBullet
          data={data}
          margin={{ top: 20, right: 60, bottom: 50, left: 110 }}
          spacing={60}
          titleAlign="start"
          titleOffsetX={-80}
          measureSize={0.4}
          rangeColors={['#ef4444', '#f59e0b', '#10b981', '#3b82f6']}
          measureColors={['#6366f1']}
          markerColors={['#1e293b']}
          theme={{
            background: 'transparent',
            text: {
              fill: isDark ? '#cbd5e1' : '#475569',
              fontSize: 11,
            },
            tooltip: {
              container: {
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#f1f5f9' : '#0f172a',
                fontSize: 12,
                borderRadius: '4px',
                boxShadow: '0 3px 9px rgba(0, 0, 0, 0.5)',
                padding: '8px 12px',
              },
            },
          }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
        <div>
          <div className="font-semibold text-lg">
            {roi.toFixed(2)}%
          </div>
          <div className="text-muted-foreground">ROI</div>
        </div>
        <div>
          <div className="font-semibold text-lg">
            {winRate.toFixed(1)}%
          </div>
          <div className="text-muted-foreground">Win Rate</div>
        </div>
        <div>
          <div className="font-semibold text-lg">
            {totalPnL.toFixed(2)}%
          </div>
          <div className="text-muted-foreground">Total PnL</div>
        </div>
      </div>
    </Card>
  );
}
