/**
 * @file Portfolio Breakdown
 * @description Sunburst chart showing hierarchical portfolio structure
 */

'use client';

import { Card } from '@tremor/react';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { useTheme } from 'next-themes';
import type { PortfolioPosition } from '@/lib/types/database.types';

interface PortfolioBreakdownProps {
  positions: PortfolioPosition[];
  totalValue: number;
}

export function PortfolioBreakdown({
  positions,
  totalValue,
}: PortfolioBreakdownProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!positions || positions.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">Portfolio Breakdown</h3>
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          No positions to display
        </div>
      </Card>
    );
  }

  // Group positions by market, then outcome, then status
  const marketGroups = positions.reduce(
    (acc, position) => {
      if (!acc[position.marketDescription]) {
        acc[position.marketDescription] = [];
      }
      acc[position.marketDescription].push(position);
      return acc;
    },
    {} as Record<string, PortfolioPosition[]>
  );

  // Build hierarchical data structure
  const sunburstData = {
    name: 'Portfolio',
    color: '#6366f1',
    children: Object.entries(marketGroups)
      .slice(0, 6) // Limit to top 6 markets for readability
      .map(([marketName, marketPositions]) => {
        const marketValue = marketPositions.reduce(
          (sum, p) => sum + p.currentValue,
          0
        );
        return {
          name: marketName.slice(0, 25),
          color: marketValue > 0 ? '#10b981' : '#ef4444',
          value: marketValue,
          children: marketPositions.map((position) => ({
            name: position.outcome,
            color:
              position.outcome === 'YES'
                ? '#3b82f6'
                : position.outcome === 'NO'
                  ? '#f59e0b'
                  : '#6b7280',
            value: position.currentValue,
            children: [
              {
                name: position.status,
                color: position.status === 'OPEN' ? '#10b981' : '#64748b',
                value: position.currentValue,
              },
            ],
          })),
        };
      }),
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Portfolio Breakdown</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Center → Markets → Outcomes → Status
      </p>
      <div className="h-[400px]">
        <ResponsiveSunburst
          data={sunburstData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          id="name"
          value="value"
          cornerRadius={2}
          borderWidth={2}
          borderColor={{ theme: 'background' }}
          colors={{ scheme: 'nivo' }}
          childColor={{
            from: 'color',
            modifiers: [['brighter', 0.3]],
          }}
          enableArcLabels={true}
          arcLabel="id"
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [['darker', 2]],
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
