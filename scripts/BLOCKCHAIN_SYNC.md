# Blockchain → Database Sync Script

## Overview

This script syncs on-chain data from Aptos blockchain to the Supabase PostgreSQL database. It's useful for:

- **Initial database population** - When setting up a new environment
- **Recovery from database issues** - Restore missing or corrupted data
- **Periodic maintenance** - Catch any events that webhooks might have missed
- **Portfolio reconciliation** - Ensure user positions match blockchain state

## Complexity & Priority

**Complexity Level:** 🔵 **MEDIUM** (3-4 hours implementation)

### Data Priority Levels

#### 🔴 P0 (Critical) - Core Functionality
- **Markets** - Market metadata and status
- **TappPools** - AMM pool reserves and statistics
- **Activities** - Transaction history (future enhancement)

#### 🟡 P1 (Important) - Portfolio Features
- **UserPositions** - Trading positions for portfolio view
- **LiquidityPositions** - LP positions (future enhancement)

#### 🟢 P2 (Analytics) - Enhanced Features
- **MarketPriceHistory** - Price charts (future enhancement)
- **MarketVolumeHistory** - Volume analytics (future enhancement)
- **UserStats** - Leaderboards (future enhancement)

## Current Implementation Status

✅ **Implemented:**
- Markets sync from blockchain
- Tapp Pools reserve updates
- User position sync (YES/NO token balances)

⏳ **Planned:**
- Activity history reconstruction from events
- Liquidity position tracking
- Historical price/volume data
- User statistics aggregation

## Usage

### Basic Commands

```bash
# Sync all entities (P0 + P1)
pnpm blockchain:sync

# Sync only critical entities (P0)
pnpm blockchain:sync:p0

# Preview changes without writing to database
pnpm blockchain:sync:dry-run

# Sync specific entities
pnpm blockchain:sync --markets
pnpm blockchain:sync --pools
pnpm blockchain:sync --positions
```

### Advanced Options

```bash
# Combine options
pnpm blockchain:sync --p0 --verbose
pnpm blockchain:sync --markets --pools --dry-run

# Available flags:
--dry-run      # Preview without writing
--verbose, -v  # Detailed output
--p0           # Critical entities only
--p1           # Important entities only
--p2           # Analytics entities only
--markets      # Sync markets only
--pools        # Sync Tapp pools only
--positions    # Sync user positions only
```

## What Gets Synced

### Markets (`--markets`)

**Blockchain Source:** `verifi_protocol::get_all_markets()`

**Synced Fields:**
- Market address (unique identifier)
- Creator address
- Description
- Resolution timestamp
- Status (active/resolved)
- YES/NO token supply

**Process:**
1. Fetches all markets from blockchain
2. Compares with database records
3. Adds new markets
4. Updates status/supply for existing markets

### Tapp Pools (`--pools`)

**Blockchain Source:** `tapp_prediction_hook::get_pool_stats(pool_address)`

**Synced Fields:**
- YES/NO reserves
- Total liquidity
- Accumulated fees
- Position count
- Trading status

**Process:**
1. Iterates through all markets
2. Checks if pool exists for each market
3. Updates pool reserves and metrics
4. Skips markets without pools

### User Positions (`--positions`)

**Blockchain Source:** `verifi_protocol::get_user_positions(user, markets[])`

**Synced Fields:**
- YES/NO token balances
- Current position value
- Position status (OPEN/RESOLVED)

**Process:**
1. Finds all unique user addresses from activities
2. Fetches positions for each user
3. Creates/updates positions in database
4. Separates YES and NO positions

**Note:** Historical data (avg entry price, total invested) cannot be determined from blockchain state alone and requires event history reconstruction.

## Output Example

```
🚀 Starting blockchain → database sync...

📍 [P0] Syncing Markets...
🔍 Fetching markets from blockchain...
📊 Found 15 markets on-chain
  ✨ New market found: 0x9cdcfa64...
  ✨ New market found: 0x7c4fe93c...
  Found:    15
  Added:    2
  Updated:  13
  Errors:   0
  Duration: 2.45s

🏊 [P0] Syncing Tapp Pools...
🔍 Fetching Tapp pools from blockchain...
📊 Checking 15 markets for pools...
  ℹ️  No pool for market: 0x80396f30...
  Found:    8
  Added:    0
  Updated:  8
  Errors:   0
  Duration: 3.12s

👤 [P1] Syncing User Positions...
🔍 Syncing user positions from blockchain...
📊 Found 23 unique users
  Found:    45
  Added:    0
  Updated:  45
  Errors:   0
  Duration: 8.34s

============================================================
📊 SYNC SUMMARY
============================================================
Total entities found:    68
Total added:             2
Total updated:           66
Total errors:            0
Total duration:          13.91s
============================================================

✅ Sync completed successfully!
```

## When to Run

### Recommended Schedule

- **After deployment** - Initial database population
- **Weekly** - Regular maintenance (cron job)
- **On-demand** - When you notice data discrepancies
- **Before demos** - Ensure portfolio data is current

### Cron Job Setup

```bash
# Run every Sunday at 3 AM
0 3 * * 0 cd /path/to/verifi-protocol && pnpm blockchain:sync >> logs/sync.log 2>&1
```

## Limitations

### Current Limitations

1. **No event history** - The script fetches current state only, not historical events
2. **Missing historical data** - Can't determine avg entry price or total invested from blockchain state
3. **No activity sync** - Transaction activities require event indexing
4. **Batch size limits** - Large numbers of users/markets may require pagination

### Future Enhancements

- Event-based activity reconstruction
- Parallel processing for large datasets
- Incremental syncs (only changed data)
- Progress bars for long-running syncs
- Slack/email notifications on completion
- Error retry logic with exponential backoff

## Troubleshooting

### Common Issues

**"get_all_markets view function not available"**
- The Move contract doesn't have this view function
- Update contract to add `#[view] public fun get_all_markets()`
- Or use event-based approach

**"Pool not found on-chain"**
- Normal for markets without AMM pools
- Only markets with liquidity have pools

**"Position count mismatch"**
- Users may have closed positions
- Blockchain only shows current holdings
- Historical positions require event reconstruction

**Long sync times**
- Use `--p0` for critical data only
- Run during off-peak hours
- Consider adding caching

## Architecture Notes

### Blockchain Data Sources

```
┌─────────────────────────────────────────────┐
│         Aptos Blockchain                    │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ verifi_protocol module               │  │
│  │  - get_all_markets()                │  │
│  │  - get_user_positions()             │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ tapp_prediction_hook module         │  │
│  │  - get_pool_stats()                 │  │
│  │  - get_reserves()                   │  │
│  │  - get_position()                   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↓
            Sync Script (this)
                    ↓
┌─────────────────────────────────────────────┐
│         Supabase PostgreSQL                 │
│                                             │
│  Tables:                                    │
│  - markets                                  │
│  - tapp_pools                               │
│  - user_positions                           │
│  - activities (future)                      │
│  - liquidity_positions (future)             │
└─────────────────────────────────────────────┘
```

### Sync Strategy

**Pull-based approach:**
- Script pulls data from blockchain
- Compares with database state
- Performs upserts (create or update)

**Alternative (future):** Event-based indexing
- Listen to blockchain events in real-time
- Automatically sync as transactions occur
- More efficient but requires infrastructure

## Related Scripts

- `scripts/db-sync.ts` - Internal database maintenance
- `scripts/seed-activities.ts` - Seed test activity data
- `scripts/check-pool.ts` - Check individual pool status

## Contributing

To add new sync entities:

1. Add view function to Move contract
2. Create sync function in this script
3. Add to priority tier (P0/P1/P2)
4. Update CLI options
5. Test with `--dry-run` first
6. Update this documentation

## Support

For issues or questions:
- Check CLAUDE.md for project documentation
- Review SESSION_STATE.md for current status
- File issue in project tracker
