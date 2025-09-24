import { Network } from "@aptos-labs/ts-sdk";

const networkString = process.env.NEXT_PUBLIC_APTOS_NETWORK?.toLowerCase();

export const NETWORK: Network =
  networkString === "local"
    ? Network.LOCAL
    : networkString === "testnet"
      ? Network.TESTNET
      : Network.DEVNET;

export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
export const APTOS_API_KEY = process.env.NEXT_PUBLIC_APTOS_API_KEY;

if (!MODULE_ADDRESS) {
  throw new Error(
    "NEXT_PUBLIC_MODULE_ADDRESS is not set in your .env.local file. Please update it with your contract address.",
  );
}
