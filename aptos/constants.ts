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

// Debug logs
console.log('[aptos/constants] Environment check:', {
  NETWORK,
  MODULE_ADDRESS_exists: !!MODULE_ADDRESS,
  MODULE_ADDRESS_preview: MODULE_ADDRESS?.substring(0, 10) + '...',
  APTOS_API_KEY_exists: !!APTOS_API_KEY,
  APTOS_API_KEY_length: APTOS_API_KEY?.length,
  APTOS_API_KEY_preview: APTOS_API_KEY ? APTOS_API_KEY.substring(0, 15) + '...' : 'NOT_SET',
});

if (!MODULE_ADDRESS) {
  throw new Error(
    "NEXT_PUBLIC_MODULE_ADDRESS is not set in your .env.local file. Please update it with your contract address.",
  );
}
