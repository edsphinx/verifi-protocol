import { execSync } from "child_process";
import { namedAddress, stdio, tappDir } from "./_config";

function compile() {
  console.log("📦 Compiling Move contracts...");
  try {
    // tapp needs multiple named addresses: base, tapp, basic, advanced, vault, and VeriFiPublisher
    const address = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
    const tappNamedAddresses = `base=${address},tapp=${address},basic=${address},advanced=${address},vault=${address},${namedAddress}`;

    execSync(
      `aptos move compile --save-metadata --package-dir ${tappDir} --named-addresses ${tappNamedAddresses}`,
      stdio,
    );
    console.log("✅ Move contracts compiled successfully.");
  } catch (error) {
    console.error("❌ Error compiling Move contracts.");
    process.exit(1);
  }
}

compile();
