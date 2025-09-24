import { execSync } from "child_process";
import {
  namedAddress,
  networkName,
  nodeUrl,
  packageDir,
  privateKey,
  stdio,
} from "./_config";

function publish() {
  console.log("🚀 Publishing Move contracts...");

  if (!privateKey) {
    console.error(
      "❌ Error: NEXT_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY is required for publishing.",
    );
    process.exit(1);
  }

  try {
    const maxGasFlag = networkName === "local" ? "--max-gas 100000" : "";

    execSync(
      `aptos move publish --package-dir ${packageDir} --named-addresses ${namedAddress} --private-key ${privateKey} --url ${nodeUrl} --assume-yes ${maxGasFlag}`,
      stdio,
    );
    console.log("\n🚚 Contracts published. Generating TypeScript ABIs...");
    // After a successful publish, generate the TS ABIs
    execSync("pnpm move:get_abi", stdio);
    console.log("✅ Move contracts published and ABIs generated successfully.");
  } catch (error) {
    console.error("❌ Error publishing Move contracts.");
    process.exit(1);
  }
}

publish();
