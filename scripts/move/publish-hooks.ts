/**
 * Script to publish all hooks modules in the correct order
 * Order: basic -> advanced -> vault
 */

import { execSync } from "child_process";
import {
  namedAddress,
  networkName,
  nodeUrl,
  privateKey,
  stdio,
  hooksBasicDir,
  hooksAdvancedDir,
  hooksVaultDir,
} from "./_config";

function publishHook(hookName: string, hookDir: string) {
  console.log(`\n📦 Publishing ${hookName} hook...`);
  console.log(`📁 Directory: ${hookDir}`);

  if (!privateKey) {
    console.error(
      "❌ Error: NEXT_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY is required for publishing.",
    );
    process.exit(1);
  }

  try {
    const maxGasFlag = networkName === "local" ? "--max-gas 100000" : "";

    // Each hook has its own named address from Move.toml
    const hookNamedAddress = `${hookName}=${process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS}`;

    execSync(
      `aptos move publish --package-dir ${hookDir} --named-addresses ${hookNamedAddress} --private-key ${privateKey} --url ${nodeUrl} --assume-yes ${maxGasFlag}`,
      stdio,
    );
    console.log(`✅ ${hookName} hook published successfully!`);
  } catch (error: any) {
    console.error(`❌ Error publishing ${hookName} hook.`);
    console.error(error.message);
    process.exit(1);
  }
}

function publishAllHooks() {
  console.log("🚀 Publishing all hooks in order...");
  console.log(`🌐 Network: ${networkName} (${nodeUrl})\n`);

  // Publish in dependency order
  publishHook("basic", hooksBasicDir);
  publishHook("advanced", hooksAdvancedDir);
  publishHook("vault", hooksVaultDir);

  console.log("\n✅ All hooks published successfully!");
  console.log("📝 You can now publish tapp with: pnpm move:publish:tapp");
}

publishAllHooks();
