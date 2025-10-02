import type { StdioOptions } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// --- Configuration Loading ---
// We explicitly resolve the project's root directory.
// __dirname is the current directory (`scripts/move`), so we go up two levels.
const projectRoot = path.resolve(__dirname, "..", "..");
console.log(`🔎 Project root identified at: ${projectRoot}`);

// Define the absolute paths to the .env files in the project root.
const envLocalPath = path.resolve(projectRoot, ".env.local");
const envPath = path.resolve(projectRoot, ".env");

// Load .env.local if it exists, otherwise fall back to .env
if (fs.existsSync(envLocalPath)) {
  console.log(`⚡ Loading environment variables from: ${envLocalPath}`);
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log(`⚡ Loading environment variables from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(
    "⚠️ Warning: No .env.local or .env file found. Scripts might fail if they need environment variables.",
  );
}

// --- Dynamic Network Configuration ---
// Read the network from the same environment variable your Next.js app uses.
// Default to 'local' if not specified.
const networkName =
  process.env.NEXT_PUBLIC_APTOS_NETWORK?.toLowerCase() || "local";

/**
 * Returns the corresponding Aptos node URL for a given network name.
 * @param network The name of the network ('local', 'devnet', 'testnet', 'mainnet').
 * @returns The RPC URL of the node.
 */
function getNodeUrl(network: string): string {
  switch (network) {
    case "local":
      return "http://127.0.0.1:8080";
    case "devnet":
      return "https://fullnode.devnet.aptoslabs.com/v1";
    case "testnet":
      return "https://fullnode.testnet.aptoslabs.com/v1";
    case "mainnet":
      return "https://fullnode.mainnet.aptoslabs.com/v1";
    default:
      console.error(
        `❌ Error: Unknown network specified: '${network}'. Defaulting to local node.`,
      );
      return "http://127.0.0.1:8080";
  }
}

const nodeUrl = getNodeUrl(networkName);
console.log(`🌐 Using network: ${networkName} (${nodeUrl})`);

// --- Constants ---
const address = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
const privateKey = process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY;

if (!address) {
  console.error(
    "❌ Error: NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS is not defined in your .env.local or .env file.",
  );
  process.exit(1);
}

export const namedAddress: string = `VeriFiPublisher=${address}`;
export const packageDir: string = "./contract";
export const tappDir: string = "./contract/test-deps/tapp";
export const hooksAdvancedDir: string = "./contract/test-deps/hooks/advanced";
export const hooksBasicDir: string = "./contract/test-deps/hooks/basic";
export const hooksVaultDir: string = "./contract/test-deps/hooks/vault";
export const stdio: { stdio: StdioOptions } = { stdio: "inherit" };
// Export the dynamically selected node URL
export { privateKey, nodeUrl, networkName };
