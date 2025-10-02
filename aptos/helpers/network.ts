/**
 * @file Contains network-related helper functions for the Aptos wallet adapter.
 * @author edsphinx
 */

import { Network } from "@aptos-labs/ts-sdk";
import {
  isAptosNetwork,
  type NetworkInfo,
} from "@aptos-labs/wallet-adapter-react";

/**
 * @notice Checks if the connected wallet's network is a valid network for the dApp.
 * @dev This utility is used with the wallet adapter to verify network compatibility.
 * It's designed to be permissive for local development by treating any non-standard
 * "custom" network (like a local testnet) as valid. For standard Aptos networks,
 * it strictly checks against the official `Network` enum from the SDK.
 * @param network The `NetworkInfo` object from the `useWallet` hook.
 * @returns `true` if the network is a recognized Aptos network or a custom network,
 * otherwise `false`.
 */
export const isValidNetworkName = (network: NetworkInfo | null) => {
  if (isAptosNetwork(network)) {
    // It's a standard network (Devnet, Testnet, Mainnet). Check if its name
    // is in the list of recognized networks from the Aptos TS-SDK.
    return Object.values<string | undefined>(Network).includes(network?.name);
  }
  // If `isAptosNetwork` is false, it's a custom network (e.g., a local node).
  // We'll treat it as valid to allow for local development and testing.
  return true;
};
