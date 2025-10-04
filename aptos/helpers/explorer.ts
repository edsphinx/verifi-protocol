import { Network } from "@aptos-labs/ts-sdk";

/**
 * Get the explorer URL for a given network
 */
export function getExplorerUrl(network: Network): string {
  switch (network) {
    case Network.MAINNET:
      return "https://explorer.aptoslabs.com";
    case Network.TESTNET:
      return "https://explorer.aptoslabs.com";
    case Network.DEVNET:
      return "https://explorer.aptoslabs.com";
    case Network.LOCAL:
      return "http://localhost:8080"; // Local explorer if available
    default:
      return "https://explorer.aptoslabs.com";
  }
}

/**
 * Get the network parameter for explorer URL
 */
export function getNetworkParam(network: Network): string {
  switch (network) {
    case Network.MAINNET:
      return "mainnet";
    case Network.TESTNET:
      return "testnet";
    case Network.DEVNET:
      return "devnet";
    case Network.LOCAL:
      return "local";
    default:
      return "testnet";
  }
}

/**
 * Generate a transaction explorer link
 */
export function getTxExplorerLink(txHash: string, network: Network): string {
  const baseUrl = getExplorerUrl(network);
  const networkParam = getNetworkParam(network);
  return `${baseUrl}/txn/${txHash}?network=${networkParam}`;
}

/**
 * Generate an account explorer link
 */
export function getAccountExplorerLink(
  address: string,
  network: Network,
): string {
  const baseUrl = getExplorerUrl(network);
  const networkParam = getNetworkParam(network);
  return `${baseUrl}/account/${address}?network=${networkParam}`;
}

/**
 * Truncate hash for display (e.g., "0x1234...5678")
 */
export function truncateHash(
  hash: string,
  prefixLength = 6,
  suffixLength = 4,
): string {
  if (hash.length <= prefixLength + suffixLength) return hash;
  return `${hash.slice(0, prefixLength)}...${hash.slice(-suffixLength)}`;
}
