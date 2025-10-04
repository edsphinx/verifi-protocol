/**
 * Verify Portfolio Data Script
 *
 * Fetches and displays portfolio data from the API to verify it's working correctly
 *
 * Usage:
 *   pnpm verify:portfolio
 */

const TEST_ADDRESS = '0x32ee964a31be2ce5db67a29c31ecabd3244b578cd4abd28e69f7ec641d21d691';
const API_BASE = 'http://localhost:3000';

async function verifyPortfolio() {
  console.log('🔍 Verifying Portfolio Data');
  console.log('='.repeat(80));
  console.log(`📍 Address: ${TEST_ADDRESS}`);
  console.log(`🌐 API Base: ${API_BASE}\n`);

  try {
    // Fetch portfolio data
    console.log('📡 Fetching portfolio data from API...');
    const url = `${API_BASE}/api/portfolio/${TEST_ADDRESS}`;
    console.log(`   GET ${url}\n`);

    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      process.exit(1);
    }

    const data = await response.json();

    // Display summary
    console.log('='.repeat(80));
    console.log('📊 PORTFOLIO SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Value:        $${data.totalValue?.toFixed(2) || '0.00'}`);
    console.log(`Total Invested:     $${data.totalInvested?.toFixed(2) || '0.00'}`);
    console.log(`Unrealized P&L:     $${data.unrealizedPnL?.toFixed(2) || '0.00'} (${data.unrealizedPnLPct?.toFixed(2) || '0.00'}%)`);
    console.log(`Realized P&L:       $${data.realizedPnL?.toFixed(2) || '0.00'}`);
    console.log(`Total Positions:    ${data.totalPositions || 0}`);
    console.log(`Open Positions:     ${data.openPositions?.length || 0}`);
    console.log(`Closed Positions:   ${data.closedPositions?.length || 0}`);
    console.log('');

    // Display stats
    if (data.stats) {
      console.log('='.repeat(80));
      console.log('📈 TRADING STATS');
      console.log('='.repeat(80));
      console.log(`Total Trades:       ${data.stats.totalTrades || 0}`);
      console.log(`Total Volume:       $${data.stats.totalVolume?.toFixed(2) || '0.00'}`);
      console.log(`Winning Trades:     ${data.stats.winningTrades || 0}`);
      console.log(`Losing Trades:      ${data.stats.losingTrades || 0}`);
      console.log(`Win Rate:           ${data.stats.winRate?.toFixed(1) || '0.0'}%`);
      console.log(`Avg Trade Size:     $${data.stats.avgTradeSize?.toFixed(2) || '0.00'}`);
      console.log('');
    }

    // Display open positions
    if (data.openPositions && data.openPositions.length > 0) {
      console.log('='.repeat(80));
      console.log('💼 OPEN POSITIONS');
      console.log('='.repeat(80));

      data.openPositions.forEach((pos: any, index: number) => {
        console.log(`\n${index + 1}. ${pos.marketDescription?.slice(0, 60) || 'Unknown Market'}...`);
        console.log(`   Market:          ${pos.marketAddress?.slice(0, 10)}...${pos.marketAddress?.slice(-8)}`);
        console.log(`   Outcome:         ${pos.outcome}`);
        console.log(`   Shares Owned:    ${pos.sharesOwned?.toFixed(4) || '0.0000'}`);
        console.log(`   Avg Entry Price: $${pos.avgEntryPrice?.toFixed(4) || '0.0000'}`);
        console.log(`   Current Price:   $${pos.currentPrice?.toFixed(4) || '0.0000'}`);
        console.log(`   Total Invested:  $${pos.totalInvested?.toFixed(2) || '0.00'}`);
        console.log(`   Current Value:   $${pos.currentValue?.toFixed(2) || '0.00'}`);
        console.log(`   P&L:             $${pos.unrealizedPnL?.toFixed(2) || '0.00'} (${pos.unrealizedPnLPct?.toFixed(2) || '0.00'}%)`);
        console.log(`   Status:          ${pos.status}`);
      });
      console.log('');
    } else {
      console.log('='.repeat(80));
      console.log('💼 OPEN POSITIONS');
      console.log('='.repeat(80));
      console.log('No open positions found.\n');
    }

    // Display closed positions
    if (data.closedPositions && data.closedPositions.length > 0) {
      console.log('='.repeat(80));
      console.log('📁 CLOSED POSITIONS');
      console.log('='.repeat(80));
      console.log(`Found ${data.closedPositions.length} closed positions\n`);
    }

    // Display last updated
    console.log('='.repeat(80));
    console.log(`Last Updated: ${data.lastUpdated || 'Unknown'}`);
    console.log('='.repeat(80));

    // Verification checks
    console.log('\n');
    console.log('='.repeat(80));
    console.log('✅ VERIFICATION CHECKS');
    console.log('='.repeat(80));

    const checks = [
      {
        name: 'API Response OK',
        passed: response.ok,
      },
      {
        name: 'Has Portfolio Data',
        passed: !!data,
      },
      {
        name: 'Has Open Positions Array',
        passed: Array.isArray(data.openPositions),
      },
      {
        name: 'Has Closed Positions Array',
        passed: Array.isArray(data.closedPositions),
      },
      {
        name: 'Has Stats Object',
        passed: !!data.stats,
      },
      {
        name: 'Total Positions Count Matches',
        passed: data.totalPositions === (data.openPositions?.length || 0) + (data.closedPositions?.length || 0),
      },
      {
        name: 'Has Positions (Open or Closed)',
        passed: (data.openPositions?.length || 0) > 0 || (data.closedPositions?.length || 0) > 0,
      },
    ];

    checks.forEach((check) => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });

    const allPassed = checks.every((c) => c.passed);

    console.log('='.repeat(80));

    if (allPassed) {
      console.log('\n🎉 All checks passed! Portfolio data is working correctly.\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some checks failed. Please review the output above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error fetching portfolio:', error);
    console.error('\nMake sure the dev server is running: pnpm dev\n');
    process.exit(1);
  }
}

verifyPortfolio();
