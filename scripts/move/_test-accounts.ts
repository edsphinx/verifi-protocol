/**
 * Test accounts configuration
 * Loads test accounts from environment variables
 */

import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
const projectRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.resolve(projectRoot, ".env") });

/**
 * Creates an Account from a private key string
 * Handles both hex and ed25519-priv prefixed keys
 */
function createAccountFromPrivateKey(privateKey: string): Account {
  // Remove ed25519-priv- prefix if present
  const cleanKey = privateKey.startsWith("ed25519-priv-")
    ? privateKey.replace("ed25519-priv-", "")
    : privateKey;

  // Remove 0x prefix if present
  const hexKey = cleanKey.startsWith("0x") ? cleanKey.slice(2) : cleanKey;

  const privateKeyObj = new Ed25519PrivateKey(hexKey);
  return Account.fromPrivateKey({ privateKey: privateKeyObj });
}

// Publisher Account (19 APT)
export const publisherAccount = createAccountFromPrivateKey(
  process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY!,
);

// Market Creator Account (10 APT)
export const marketCreatorAccount = createAccountFromPrivateKey(
  process.env.NEXT_MODULE_CREATOR_ACCOUNT_PRIVATE_KEY!,
);

// Trader Accounts (5 APT each)
export const trader1Account = createAccountFromPrivateKey(
  process.env.NEXT_MODULE_TRADER1_ACCOUNT_PRIVATE_KEY!,
);

export const trader2Account = createAccountFromPrivateKey(
  process.env.NEXT_MODULE_TRADER2_ACCOUNT_PRIVATE_KEY!,
);

export const trader3Account = createAccountFromPrivateKey(
  process.env.NEXT_MODULE_TRADER3_ACCOUNT_PRIVATE_KEY!,
);

export const trader4Account = createAccountFromPrivateKey(
  process.env.NEXT_MODULE_TRADER4_ACCOUNT_PRIVATE_KEY!,
);

// Export all traders as an array for easy iteration
export const traderAccounts = [
  trader1Account,
  trader2Account,
  trader3Account,
  trader4Account,
];

// Helper to get account info
export function getAccountInfo(account: Account, name: string) {
  return {
    name,
    address: account.accountAddress.toString(),
  };
}

// Log all accounts (for debugging)
export function logAllAccounts() {
  console.log("\n📋 Test Accounts Configuration:");
  console.log("================================");
  console.log(
    `Publisher:      ${publisherAccount.accountAddress.toString()} (19 APT)`,
  );
  console.log(
    `Market Creator: ${marketCreatorAccount.accountAddress.toString()} (10 APT)`,
  );
  console.log(
    `Trader 1:       ${trader1Account.accountAddress.toString()} (5 APT)`,
  );
  console.log(
    `Trader 2:       ${trader2Account.accountAddress.toString()} (5 APT)`,
  );
  console.log(
    `Trader 3:       ${trader3Account.accountAddress.toString()} (5 APT)`,
  );
  console.log(
    `Trader 4:       ${trader4Account.accountAddress.toString()} (5 APT)`,
  );
  console.log("================================\n");
}
