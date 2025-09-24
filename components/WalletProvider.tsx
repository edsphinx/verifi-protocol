"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import type { PropsWithChildren } from "react";
import { toast } from "sonner";
import { APTOS_API_KEY, NETWORK } from "@/lib/aptos/constants";

export function WalletProvider({ children }: PropsWithChildren) {
  const dappConfig =
    NETWORK === Network.LOCAL
      ? {
          // For local development, we omit the `network` property.
          // This prevents a runtime error where the adapter rejects the "custom" network.
          aptosApiKeys: APTOS_API_KEY
            ? { [NETWORK]: APTOS_API_KEY }
            : undefined,
        }
      : {
          // For public networks, we must specify the network.
          network: NETWORK,
          aptosApiKeys: APTOS_API_KEY
            ? { [NETWORK]: APTOS_API_KEY }
            : undefined,
        };

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
