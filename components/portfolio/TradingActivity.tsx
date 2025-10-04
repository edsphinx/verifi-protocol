/**
 * @file Trading Activity
 * @description Calendar heatmap showing trading activity over time
 */

'use client';

import { Card } from '@tremor/react';
import { ResponsiveCalendar } from '@nivo/calendar';
import { useTheme } from 'next-themes';

interface ActivityDataPoint {
  day: string; // YYYY-MM-DD format
  value: number; // Number of trades
}

interface TradingActivityProps {
  data: ActivityDataPoint[];
  from: string; // Start date
  to: string; // End date
}

export function TradingActivity({ data, from, to }: TradingActivityProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Trading Activity</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Your trading consistency over the last year
      </p>
      <div className="h-[200px]">
        <ResponsiveCalendar
          data={data}
          from={from}
          to={to}
          emptyColor={isDark ? '#1e293b' : '#f1f5f9'}
          colors={['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af']}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          yearSpacing={40}
          monthBorderColor={isDark ? '#334155' : '#e2e8f0'}
          dayBorderWidth={2}
          dayBorderColor={isDark ? '#0f172a' : '#ffffff'}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'row',
              translateY: 36,
              itemCount: 4,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: 'right-to-left',
            },
          ]}
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
