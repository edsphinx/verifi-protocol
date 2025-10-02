"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { useMemo, type PropsWithChildren } from "react";
import { toast } from "sonner";
import { APTOS_API_KEY, NETWORK } from "@/aptos/constants";

export function WalletProvider({ children }: PropsWithChildren) {
  // Memoize dappConfig to prevent recreation on every render
  // This prevents wallet disconnection on navigation
  const dappConfig = useMemo(() => {
    console.log('[WalletProvider] Creating dappConfig - NETWORK:', NETWORK);
    console.log('[WalletProvider] APTOS_API_KEY configured:', !!APTOS_API_KEY);

    const config =
      NETWORK === Network.LOCAL
        ? {
            // For local development, we omit the `network` property.
            // This prevents a runtime error where the adapter rejects the "custom" network.
          }
        : {
            // For public networks, we must specify the network.
            network: NETWORK,
          };

    console.log('[WalletProvider] dappConfig created:', {
      ...config,
      aptosApiKeys: 'aptosApiKeys' in config && config.aptosApiKeys ? 'CONFIGURED' : 'MISSING'
    });

    return config;
  }, []); // Empty deps array - only create once

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      // @ts-expect-error
      dappConfig={dappConfig}
      onError={(error) => {
        console.error("Wallet Error:", error);
        toast.error(error.message || "An unknown wallet error occurred.");
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
