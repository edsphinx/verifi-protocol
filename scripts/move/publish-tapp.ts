import { execSync } from "child_process";
import {
  namedAddress,
  networkName,
  nodeUrl,
  privateKey,
  stdio,
  tappDir,
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

    // tapp needs multiple named addresses: base, tapp, basic, advanced, vault, and VeriFiPublisher
    const address = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
    const tappNamedAddresses = `base=${address},tapp=${address},basic=${address},advanced=${address},vault=${address},${namedAddress}`;

    execSync(
      `aptos move publish --package-dir ${tappDir} --named-addresses ${tappNamedAddresses} --private-key ${privateKey} --url ${nodeUrl} --assume-yes ${maxGasFlag}`,
      stdio,
    );
    console.log("\n🚚 Contracts published. Generating TypeScript ABIs...");
    // After a successful publish, generate the TS ABIs
    execSync("pnpm move:get_abi:tapp", stdio);
    console.log("✅ Move contracts published and ABIs generated successfully.");
  } catch (error) {
    console.error("❌ Error publishing Move contracts.");
    process.exit(1);
  }
}

publish();
