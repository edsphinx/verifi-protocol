/**
 * @file Market Rankings
 * @description Bump chart showing how market rankings change over time
 */

'use client';

import { Card } from '@tremor/react';
import { ResponsiveBump } from '@nivo/bump';
import { useTheme } from 'next-themes';

interface MarketRankingsProps {
  data: Array<{
    id: string;
    data: Array<{ x: string; y: number }>;
  }>;
}

export function MarketRankings({ data }: MarketRankingsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Generate mock data if none provided
  const rankingsData = data.length > 0 ? data : generateMockData();

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-2">Market Rankings</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Top markets by volume over time
      </p>
      <div className="h-[400px]">
        <ResponsiveBump
          data={rankingsData}
          margin={{ top: 40, right: 120, bottom: 40, left: 60 }}
          colors={{ scheme: 'spectral' }}
          lineWidth={3}
          activeLineWidth={6}
          inactiveLineWidth={3}
          inactiveOpacity={0.15}
          pointSize={10}
          activePointSize={16}
          inactivePointSize={0}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={3}
          activePointBorderWidth={3}
          pointBorderColor={{ from: 'serie.color' }}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendPosition: 'middle',
            legendOffset: -36,
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Time Period',
            legendPosition: 'middle',
            legendOffset: 32,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Ranking',
            legendPosition: 'middle',
            legendOffset: -40,
          }}
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

// Generate mock ranking data for demonstration
function generateMockData(): Array<{ id: string; data: Array<{ x: string; y: number }> }> {
  const periods = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  const markets = [
    'APT > $100',
    'BTC ATH 2025',
    'ETH Merge Success',
    'DeFi TVL Growth',
    'NFT Floor Up',
  ];

  return markets.map((market, idx) => ({
    id: market,
    data: periods.map((period, periodIdx) => {
      // Simulate ranking changes
      const baseRank = idx + 1;
      const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const rank = Math.max(1, Math.min(5, baseRank + variation));

      return {
        x: period,
        y: rank,
      };
    }),
  }));
}
