/**
 * @file Volume Stream
 * @description Stream chart showing pool volume activity over time
 */

'use client';

import { Card } from '@tremor/react';
import { ResponsiveStream } from '@nivo/stream';
import { useTheme } from 'next-themes';

interface VolumeStreamProps {
  data: Array<{
    [key: string]: number | string;
  }>;
}

export function VolumeStream({ data }: VolumeStreamProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Generate mock data if none provided
  const streamData = data.length > 0 ? data : generateMockStreamData();

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-2">Pool Volume Activity</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Trading volume across pools over time
      </p>
      <div className="h-[400px]">
        <ResponsiveStream
          data={streamData}
          keys={['Pool A', 'Pool B', 'Pool C', 'Pool D', 'Pool E']}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Time Period',
            legendOffset: 36,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Volume (APT)',
            legendOffset: -40,
          }}
          offsetType="silhouette"
          colors={{ scheme: 'nivo' }}
          fillOpacity={0.85}
          borderColor={{ theme: 'background' }}
          dotSize={8}
          dotColor={{ from: 'color' }}
          dotBorderWidth={2}
          dotBorderColor={{
            from: 'color',
            modifiers: [['darker', 0.7]],
          }}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              translateX: 100,
              itemWidth: 80,
              itemHeight: 20,
              itemTextColor: isDark ? '#cbd5e1' : '#475569',
              symbolSize: 12,
              symbolShape: 'circle',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: isDark ? '#f1f5f9' : '#0f172a',
                  },
                },
              ],
            },
          ]}
          theme={{
            background: 'transparent',
            text: {
              fill: isDark ? '#cbd5e1' : '#475569',
              fontSize: 11,
            },
            grid: {
              line: {
                stroke: isDark ? '#1e293b' : '#f1f5f9',
                strokeWidth: 1,
              },
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

// Generate mock stream data
function generateMockStreamData() {
  const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

  return periods.map((period) => ({
    period,
    'Pool A': Math.random() * 100 + 50,
    'Pool B': Math.random() * 80 + 40,
    'Pool C': Math.random() * 60 + 30,
    'Pool D': Math.random() * 40 + 20,
    'Pool E': Math.random() * 30 + 10,
  }));
}
