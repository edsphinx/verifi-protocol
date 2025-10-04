/**
 * @file Markets Sentiment Overview
 * @description RadialBar chart showing YES/NO sentiment for all active markets
 */

'use client';

import { Card } from '@tremor/react';
import { ResponsiveRadialBar } from '@nivo/radial-bar';
import { useTheme } from 'next-themes';

interface MarketSentimentData {
  id: string;
  marketName: string;
  yesPercentage: number;
  noPercentage: number;
}

interface MarketsSentimentProps {
  markets: Array<{
    id: string;
    description: string;
    totalSupplyYes: number;
    totalSupplyNo: number;
  }>;
}

export function MarketsSentiment({ markets }: MarketsSentimentProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!markets || markets.length === 0) {
    return null;
  }

  // Transform market data for radial bar
  const sentimentData = markets.slice(0, 8).map((market) => {
    const total = market.totalSupplyYes + market.totalSupplyNo;
    const yesPercentage = total > 0 ? (market.totalSupplyYes / total) * 100 : 50;

    return {
      id: market.description.slice(0, 30),
      data: [
        {
          x: 'YES',
          y: yesPercentage,
        },
        {
          x: 'NO',
          y: 100 - yesPercentage,
        },
      ],
    };
  });

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-2">Market Sentiment Overview</h3>
      <p className="text-sm text-muted-foreground mb-4">
        YES/NO distribution across active markets
      </p>
      <div className="h-[400px]">
        <ResponsiveRadialBar
          data={sentimentData}
          valueFormat=">-.2f"
          padding={0.4}
          cornerRadius={2}
          margin={{ top: 40, right: 120, bottom: 40, left: 40 }}
          radialAxisStart={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
          circularAxisOuter={{ tickSize: 5, tickPadding: 12, tickRotation: 0 }}
          colors={['#3b82f6', '#f59e0b']}
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.2]],
          }}
          legends={[
            {
              anchor: 'right',
              direction: 'column',
              justify: false,
              translateX: 80,
              translateY: 0,
              itemsSpacing: 6,
              itemDirection: 'left-to-right',
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: isDark ? '#cbd5e1' : '#475569',
              symbolSize: 18,
              symbolShape: 'circle',
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
