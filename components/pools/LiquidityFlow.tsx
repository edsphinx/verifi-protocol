/**
 * @file Liquidity Flow
 * @description Sankey diagram showing liquidity distribution across pools
 */

'use client';

import { Card } from '@tremor/react';
import { ResponsiveSankey } from '@nivo/sankey';
import { useTheme } from 'next-themes';

interface Pool {
  id: string;
  poolAddress: string;
  marketAddress: string;
  totalLiquidity: number;
}

interface LiquidityFlowProps {
  pools: Pool[];
  totalTVL: number;
}

export function LiquidityFlow({ pools, totalTVL }: LiquidityFlowProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!pools || pools.length === 0) {
    return null;
  }

  // Build Sankey data structure
  const nodes = [
    { id: 'Total TVL' },
    ...pools.slice(0, 6).map((pool) => ({
      id: `Pool ${pool.poolAddress.slice(0, 8)}`,
    })),
    ...pools.slice(0, 6).map((pool) => ({
      id: `Market ${pool.marketAddress.slice(0, 8)}`,
    })),
  ];

  const links = pools.slice(0, 6).flatMap((pool) => [
    {
      source: 'Total TVL',
      target: `Pool ${pool.poolAddress.slice(0, 8)}`,
      value: pool.totalLiquidity,
    },
    {
      source: `Pool ${pool.poolAddress.slice(0, 8)}`,
      target: `Market ${pool.marketAddress.slice(0, 8)}`,
      value: pool.totalLiquidity,
    },
  ]);

  const sankeyData = { nodes, links };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-2">Liquidity Flow</h3>
      <p className="text-sm text-muted-foreground mb-4">
        How liquidity flows from TVL to pools to markets
      </p>
      <div className="h-[500px]">
        <ResponsiveSankey
          data={sankeyData}
          margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
          align="justify"
          colors={{ scheme: 'category10' }}
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={18}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderColor={{
            from: 'color',
            modifiers: [['darker', 0.8]],
          }}
          nodeBorderRadius={3}
          linkOpacity={0.5}
          linkHoverOthersOpacity={0.1}
          linkContract={3}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="vertical"
          labelPadding={16}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 1]],
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
