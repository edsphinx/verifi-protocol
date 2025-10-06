/**
 * Metrics Sync Script
 *
 * Manually trigger metrics synchronization
 * Usage: pnpm metrics:sync
 */

import { syncAllMetrics } from "../lib/engine/metrics-sync.engine";

async function main() {
  console.log("🚀 VeriFi Protocol - Metrics Sync\n");

  try {
    const result = await syncAllMetrics();

    if (result.success) {
      console.log("\n✅ SUCCESS - All metrics synced");
      process.exit(0);
    } else {
      console.log("\n⚠️  PARTIAL SUCCESS - Some errors occurred");
      console.log("Errors:", result.errors);
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error);
    process.exit(1);
  }
}

main();
