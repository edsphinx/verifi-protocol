/**
 * Deploy All Script
 *
 * Orchestrates the complete deployment:
 * 1. Publishes VeriFi Protocol
 * 2. Updates all Move.toml files with correct addresses
 * 3. Publishes Hooks (basic, advanced, vault)
 * 4. Publishes Tapp Router
 * 5. Registers oracles
 */

import { execSync } from "child_process";
import { stdio } from "./_config";

console.log("🚀 Starting complete deployment orchestration...");
console.log("=".repeat(60));

// Step 1: Publish VeriFi Protocol
console.log("\n[1/5] 📦 Publishing VeriFi Protocol...");
try {
  execSync("pnpm move:publish", stdio);
  console.log("✅ VeriFi Protocol published successfully!");
} catch (error) {
  console.error("❌ Failed to publish VeriFi Protocol");
  process.exit(1);
}

// Step 2: Update addresses in Move.toml files
console.log("\n[2/5] 🔄 Updating addresses in Move.toml files...");
try {
  execSync(
    "ts-node --project tsconfig.scripts.json scripts/move/update-addresses.ts",
    stdio,
  );
  console.log("✅ Addresses updated successfully!");
} catch (error) {
  console.error("❌ Failed to update addresses");
  process.exit(1);
}

// Step 3: Publish Hooks
console.log("\n[3/5] 🪝 Publishing Tapp Hooks...");
try {
  execSync("pnpm move:publish:hooks", stdio);
  console.log("✅ Hooks published successfully!");
} catch (error) {
  console.error("❌ Failed to publish hooks");
  process.exit(1);
}

// Step 4: Publish Tapp Router
console.log("\n[4/5] 🔀 Publishing Tapp Router...");
try {
  execSync("pnpm move:publish:tapp", stdio);
  console.log("✅ Tapp Router published successfully!");
} catch (error) {
  console.error("❌ Failed to publish Tapp Router");
  process.exit(1);
}

// Step 5: Register oracles
console.log("\n[5/5] 🔮 Registering oracles...");
try {
  execSync("pnpm move:register_oracles", stdio);
  console.log("✅ Oracles registered successfully!");
} catch (error) {
  console.error(
    "⚠️  Warning: Failed to register oracles (you may need to do this manually)",
  );
}

console.log("\n" + "=".repeat(60));
console.log("✨ DEPLOYMENT COMPLETE!");
console.log("=".repeat(60));
console.log(
  `\n📍 Contract Address: ${process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS}`,
);
console.log("\n🎯 Next steps:");
console.log("  1. Run tests: pnpm test:tapp:integration");
console.log("  2. Update frontend if needed");
console.log("  3. Verify on explorer\n");
