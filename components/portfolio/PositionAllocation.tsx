/**
 * @file Position Allocation
 * @description Marimekko chart showing position sizes and performance
 */

'use client';

import { Card } from '@tremor/react';
import { ResponsiveMarimekko } from '@nivo/marimekko';
import { useTheme } from 'next-themes';
import type { PortfolioPosition } from '@/lib/types/database.types';

interface PositionAllocationProps {
  positions: PortfolioPosition[];
}

export function PositionAllocation({ positions }: PositionAllocationProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!positions || positions.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">Position Allocation</h3>
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          No positions to display
        </div>
      </Card>
    );
  }

  // Calculate total value for percentages
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);

  // Transform data for Marimekko
  const data = positions.slice(0, 8).map((position) => {
    const percentage = (position.currentValue / totalValue) * 100;
    const pnlCategory =
      position.unrealizedPnLPct > 10
        ? 'High Gain'
        : position.unrealizedPnLPct > 0
          ? 'Gain'
          : position.unrealizedPnLPct > -10
            ? 'Loss'
            : 'High Loss';

    return {
      id: position.marketDescription.slice(0, 30),
      value: percentage,
      [pnlCategory]: percentage,
      pnl: position.unrealizedPnLPct,
      outcome: position.outcome,
    };
  });

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Position Allocation</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Width = Position Size • Height = PnL Performance
      </p>
      <div className="h-[400px]">
        <ResponsiveMarimekko
          data={data}
          id="id"
          value="value"
          dimensions={[
            {
              id: 'High Gain',
              value: 'High Gain',
            },
            {
              id: 'Gain',
              value: 'Gain',
            },
            {
              id: 'Loss',
              value: 'Loss',
            },
            {
              id: 'High Loss',
              value: 'High Loss',
            },
          ]}
          innerPadding={4}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -30,
            legend: 'Position',
            legendOffset: 50,
            legendPosition: 'middle',
            truncateTickAt: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Performance Category',
            legendOffset: -40,
            legendPosition: 'middle',
          }}
          margin={{ top: 20, right: 80, bottom: 100, left: 80 }}
          colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
          borderWidth={2}
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.2]],
          }}
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
    </Card>
  );
}
