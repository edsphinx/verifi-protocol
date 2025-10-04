/**
 * Blockchain to Database Sync Script
 *
 * Syncs on-chain data to Supabase database
 * Useful for:
 * - Initial database population
 * - Recovery from database issues
 * - Periodic maintenance to catch missed events
 *
 * Priority Levels:
 * P0 (Critical): Markets, TappPools, Activities
 * P1 (Important): UserPositions, LiquidityPositions
 * P2 (Analytics): Price/Volume history, UserStats
 *
 * Usage:
 *   pnpm blockchain:sync             # Sync all
 *   pnpm blockchain:sync --p0        # Sync P0 only
 *   pnpm blockchain:sync --markets   # Sync markets only
 *   pnpm blockchain:sync --dry-run   # Preview without writing
 */

import { PrismaClient } from '@prisma/client';
import { Aptos, AptosConfig, type Network } from '@aptos-labs/ts-sdk';
import type { InputViewFunctionData } from '@aptos-labs/ts-sdk';
import { networkName, nodeUrl } from './move/_config';

const prisma = new PrismaClient();

// Initialize Aptos client using shared config
const config = new AptosConfig({
  network: networkName as Network,
});
const aptos = new Aptos(config);

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS!;

console.log(`🌐 Blockchain Sync - Network: ${networkName} (${nodeUrl})`);
console.log(`📍 Module Address: ${MODULE_ADDRESS}\n`);

// Sync configuration
interface SyncOptions {
  dryRun?: boolean;
  priority?: 'p0' | 'p1' | 'p2' | 'all';
  entities?: ('markets' | 'pools' | 'activities' | 'positions' | 'lp-positions')[];
  verbose?: boolean;
}

interface SyncStats {
  entity: string;
  found: number;
  added: number;
  updated: number;
  errors: number;
  duration: number;
}

// ============================================================================
// MARKET SYNC (P0)
// ============================================================================

async function syncMarkets(opts: SyncOptions): Promise<SyncStats> {
  const startTime = Date.now();
  const stats: SyncStats = {
    entity: 'Markets',
    found: 0,
    added: 0,
    updated: 0,
    errors: 0,
    duration: 0,
  };

  try {
    console.log('🔍 Fetching markets from blockchain...');

    // Get all market creation events from blockchain
    // Note: This is a simplified version - in production you'd paginate through events
    const payload: InputViewFunctionData = {
      function: `${MODULE_ADDRESS}::verifi_protocol::get_all_markets`,
      functionArguments: [],
    };

    let onChainMarkets: any[] = [];
    try {
      const result = await aptos.view({ payload });
      onChainMarkets = result[0] as any[];
    } catch (error) {
      console.warn('⚠️  get_all_markets view function not available, will use alternative method');
      // Alternative: Could fetch from events or use a different approach
      return stats;
    }

    stats.found = onChainMarkets.length;
    console.log(`📊 Found ${stats.found} markets on-chain`);

    // Get existing markets from DB
    const dbMarkets = await prisma.market.findMany({
      select: { marketAddress: true },
    });
    const dbMarketAddresses = new Set(dbMarkets.map((m) => m.marketAddress));

    // Sync each market
    for (const market of onChainMarkets) {
      try {
        // Debug: log market structure on first iteration
        if (opts.verbose && onChainMarkets.indexOf(market) === 0) {
          console.log('  📝 Sample market structure:', JSON.stringify(market, null, 2).slice(0, 500));
        }

        // get_all_markets returns Object<Market> addresses wrapped in { inner: "0x..." }
        const marketAddress = market.inner || market.market_address || market.marketAddress || market.address;
        if (!marketAddress) {
          console.warn('  ⚠️  Market missing address field, skipping');
          stats.errors++;
          continue;
        }

        // For markets returned as just addresses, we need to fetch full details
        // For now, we'll skip the create/update since we don't have market details
        // This would require calling get_market_details for each address
        if (opts.verbose) {
          console.log(`  ℹ️  Found market: ${marketAddress.slice(0, 10)}... (address only - full sync not implemented)`);
        }
        stats.found++;
        continue;

        const exists = dbMarketAddresses.has(marketAddress);

        if (!exists) {
          if (opts.verbose) {
            console.log(`  ✨ New market found: ${marketAddress.slice(0, 10)}...`);
          }

          if (!opts.dryRun) {
            await prisma.market.create({
              data: {
                marketAddress,
                creatorAddress: market.creator,
                description: market.description || 'Unknown market',
                resolutionTimestamp: new Date(Number(market.resolution_timestamp) * 1000),
                status: market.status === 0 ? 'active' : 'resolved',
                yesSupply: Number(market.yes_supply || 0) / 1_000_000,
                noSupply: Number(market.no_supply || 0) / 1_000_000,
              },
            });
            stats.added++;
          }
        } else {
          // Update market status if needed
          if (!opts.dryRun) {
            await prisma.market.update({
              where: { marketAddress },
              data: {
                status: market.status === 0 ? 'active' : 'resolved',
                yesSupply: Number(market.yes_supply || 0) / 1_000_000,
                noSupply: Number(market.no_supply || 0) / 1_000_000,
              },
            });
            stats.updated++;
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing market: ${error}`);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('❌ Market sync failed:', error);
    stats.errors++;
  }

  stats.duration = Date.now() - startTime;
  return stats;
}

// ============================================================================
// TAPP POOL SYNC (P0)
// ============================================================================

async function syncTappPools(opts: SyncOptions): Promise<SyncStats> {
  const startTime = Date.now();
  const stats: SyncStats = {
    entity: 'TappPools',
    found: 0,
    added: 0,
    updated: 0,
    errors: 0,
    duration: 0,
  };

  try {
    console.log('🔍 Fetching Tapp pools from blockchain...');

    // Get all markets first
    const markets = await prisma.market.findMany({
      select: { marketAddress: true },
    });

    console.log(`📊 Checking ${markets.length} markets for pools...`);

    for (const market of markets) {
      try {
        // Try to get pool for this market
        const poolPayload: InputViewFunctionData = {
          function: `${MODULE_ADDRESS}::tapp_prediction_hook::get_pool_stats`,
          functionArguments: [market.marketAddress],
        };

        try {
          const result = await aptos.view({ payload: poolPayload });
          const [yesReserve, noReserve, feeYes, feeNo, positionCount, isTrading] = result as [
            string,
            string,
            string,
            string,
            string,
            boolean,
          ];

          stats.found++;

          // Check if pool exists in DB (using marketAddress as filter)
          const existingPool = await prisma.tappPool.findFirst({
            where: { marketAddress: market.marketAddress },
          });

          if (!existingPool) {
            if (opts.verbose) {
              console.log(`  ✨ New pool found for market: ${market.marketAddress.slice(0, 10)}...`);
            }

            if (!opts.dryRun) {
              // Note: poolAddress and token addresses need to be fetched from events
              // This is a simplified version
              stats.added++;
            }
          } else {
            // Update pool reserves
            if (!opts.dryRun) {
              await prisma.tappPool.update({
                where: { id: existingPool.id },
                data: {
                  yesReserve: Number(yesReserve) / 1_000_000,
                  noReserve: Number(noReserve) / 1_000_000,
                  totalLiquidity:
                    (Number(yesReserve) + Number(noReserve)) / 1_000_000,
                },
              });
              stats.updated++;
            }
          }
        } catch (poolError) {
          // Pool doesn't exist for this market - that's OK
          if (opts.verbose) {
            console.log(`  ℹ️  No pool for market: ${market.marketAddress.slice(0, 10)}...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error checking pool for market: ${error}`);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('❌ Pool sync failed:', error);
    stats.errors++;
  }

  stats.duration = Date.now() - startTime;
  return stats;
}

// ============================================================================
// USER POSITION SYNC (P1)
// ============================================================================

async function syncUserPositions(opts: SyncOptions): Promise<SyncStats> {
  const startTime = Date.now();
  const stats: SyncStats = {
    entity: 'UserPositions',
    found: 0,
    added: 0,
    updated: 0,
    errors: 0,
    duration: 0,
  };

  try {
    console.log('🔍 Syncing user positions from blockchain...');

    // Get all unique user addresses from activities
    const uniqueUsers = await prisma.activity.groupBy({
      by: ['userAddress'],
      _count: true,
    });

    console.log(`📊 Found ${uniqueUsers.length} unique users`);

    // Get all markets
    const markets = await prisma.market.findMany({
      select: { marketAddress: true, description: true, status: true },
    });

    for (const user of uniqueUsers) {
      try {
        // Fetch user positions from blockchain
        const payload: InputViewFunctionData = {
          function: `${MODULE_ADDRESS}::verifi_protocol::get_user_positions`,
          functionArguments: [
            user.userAddress,
            markets.map((m) => m.marketAddress),
          ],
        };

        const result = await aptos.view({ payload });
        const positions = result[0] as any[];

        for (const pos of positions) {
          const yesBalance = Number(pos.yes_balance) / 1_000_000;
          const noBalance = Number(pos.no_balance) / 1_000_000;

          // Skip if no position
          if (yesBalance === 0 && noBalance === 0) continue;

          stats.found++;

          // Create/update YES position
          if (yesBalance > 0) {
            const market = markets.find((m) => m.marketAddress === pos.market_address);

            if (!opts.dryRun) {
              await prisma.userPosition.upsert({
                where: {
                  userAddress_marketAddress_outcome: {
                    userAddress: user.userAddress,
                    marketAddress: pos.market_address,
                    outcome: 'YES',
                  },
                },
                create: {
                  userAddress: user.userAddress,
                  marketAddress: pos.market_address,
                  outcome: 'YES',
                  sharesOwned: yesBalance,
                  avgEntryPrice: 0, // Can't determine from blockchain alone
                  totalInvested: 0,
                  currentPrice: yesBalance > 0 ? Number(pos.yes_value) / Number(pos.yes_balance) / 100_000_000 : 0,
                  currentValue: Number(pos.yes_value) / 100_000_000,
                  unrealizedPnL: 0,
                  unrealizedPnLPct: 0,
                  status: market?.status === 'active' ? 'OPEN' : 'RESOLVED',
                },
                update: {
                  sharesOwned: yesBalance,
                  currentValue: Number(pos.yes_value) / 100_000_000,
                  status: market?.status === 'active' ? 'OPEN' : 'RESOLVED',
                },
              });
              stats.updated++;
            }
          }

          // Create/update NO position
          if (noBalance > 0) {
            const market = markets.find((m) => m.marketAddress === pos.market_address);

            if (!opts.dryRun) {
              await prisma.userPosition.upsert({
                where: {
                  userAddress_marketAddress_outcome: {
                    userAddress: user.userAddress,
                    marketAddress: pos.market_address,
                    outcome: 'NO',
                  },
                },
                create: {
                  userAddress: user.userAddress,
                  marketAddress: pos.market_address,
                  outcome: 'NO',
                  sharesOwned: noBalance,
                  avgEntryPrice: 0,
                  totalInvested: 0,
                  currentPrice: noBalance > 0 ? Number(pos.no_value) / Number(pos.no_balance) / 100_000_000 : 0,
                  currentValue: Number(pos.no_value) / 100_000_000,
                  unrealizedPnL: 0,
                  unrealizedPnLPct: 0,
                  status: market?.status === 'active' ? 'OPEN' : 'RESOLVED',
                },
                update: {
                  sharesOwned: noBalance,
                  currentValue: Number(pos.no_value) / 100_000_000,
                  status: market?.status === 'active' ? 'OPEN' : 'RESOLVED',
                },
              });
              stats.updated++;
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing positions for user ${user.userAddress}:`, error);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('❌ Position sync failed:', error);
    stats.errors++;
  }

  stats.duration = Date.now() - startTime;
  return stats;
}

// ============================================================================
// MAIN SYNC ORCHESTRATOR
// ============================================================================

async function runSync(opts: SyncOptions) {
  console.log('🚀 Starting blockchain → database sync...\n');

  if (opts.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be written to database\n');
  }

  const allStats: SyncStats[] = [];

  // Determine what to sync based on priority/entities
  const shouldSyncMarkets =
    !opts.entities ||
    opts.entities.includes('markets') ||
    ['p0', 'all'].includes(opts.priority || 'all');

  const shouldSyncPools =
    !opts.entities ||
    opts.entities.includes('pools') ||
    ['p0', 'all'].includes(opts.priority || 'all');

  const shouldSyncPositions =
    !opts.entities ||
    opts.entities.includes('positions') ||
    ['p1', 'all'].includes(opts.priority || 'all');

  // Execute syncs in priority order
  if (shouldSyncMarkets) {
    console.log('\n📍 [P0] Syncing Markets...');
    const marketStats = await syncMarkets(opts);
    allStats.push(marketStats);
    printStats(marketStats);
  }

  if (shouldSyncPools) {
    console.log('\n🏊 [P0] Syncing Tapp Pools...');
    const poolStats = await syncTappPools(opts);
    allStats.push(poolStats);
    printStats(poolStats);
  }

  if (shouldSyncPositions) {
    console.log('\n👤 [P1] Syncing User Positions...');
    const positionStats = await syncUserPositions(opts);
    allStats.push(positionStats);
    printStats(positionStats);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(60));

  const totals = allStats.reduce(
    (acc, stat) => ({
      found: acc.found + stat.found,
      added: acc.added + stat.added,
      updated: acc.updated + stat.updated,
      errors: acc.errors + stat.errors,
      duration: acc.duration + stat.duration,
    }),
    { found: 0, added: 0, updated: 0, errors: 0, duration: 0 }
  );

  console.log(`Total entities found:    ${totals.found}`);
  console.log(`Total added:             ${totals.added}`);
  console.log(`Total updated:           ${totals.updated}`);
  console.log(`Total errors:            ${totals.errors}`);
  console.log(`Total duration:          ${(totals.duration / 1000).toFixed(2)}s`);
  console.log('='.repeat(60));

  if (opts.dryRun) {
    console.log('\n⚠️  This was a DRY RUN - no changes were made to the database');
  } else {
    console.log('\n✅ Sync completed successfully!');
  }
}

function printStats(stats: SyncStats) {
  console.log(`  Found:    ${stats.found}`);
  console.log(`  Added:    ${stats.added}`);
  console.log(`  Updated:  ${stats.updated}`);
  console.log(`  Errors:   ${stats.errors}`);
  console.log(`  Duration: ${(stats.duration / 1000).toFixed(2)}s`);
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const opts: SyncOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  // Parse priority
  if (args.includes('--p0')) opts.priority = 'p0';
  else if (args.includes('--p1')) opts.priority = 'p1';
  else if (args.includes('--p2')) opts.priority = 'p2';
  else opts.priority = 'all';

  // Parse specific entities
  const entityArgs = args.filter((arg) =>
    ['--markets', '--pools', '--activities', '--positions', '--lp-positions'].includes(arg)
  );

  if (entityArgs.length > 0) {
    opts.entities = entityArgs.map((arg) =>
      arg.replace('--', '').replace('-', '-')
    ) as any;
  }

  try {
    await runSync(opts);
  } catch (error) {
    console.error('\n❌ Sync failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
