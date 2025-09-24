import { execSync } from "child_process";
import { namedAddress, packageDir, stdio } from "./_config";

function compile() {
  console.log("📦 Compiling Move contracts...");
  try {
    execSync(
      `aptos move compile --save-metadata --package-dir ${packageDir} --named-addresses ${namedAddress}`,
      stdio,
    );
    console.log("✅ Move contracts compiled successfully.");
  } catch (error) {
    console.error("❌ Error compiling Move contracts.");
    process.exit(1);
  }
}

compile();
