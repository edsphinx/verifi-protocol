"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { useMemo, type PropsWithChildren, useEffect, useState } from "react";
import { toast } from "sonner";
import { APTOS_API_KEY, NETWORK } from "@/aptos/constants";

export function WalletProvider({ children }: PropsWithChildren) {
  const [isClient, setIsClient] = useState(false);

  // Ensure we only render on client to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize dappConfig to prevent recreation on every render
  // This prevents wallet disconnection on navigation
  const dappConfig = useMemo(() => {
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

    return config;
  }, []); // Empty deps array - only create once

  // Prevent SSR/hydration issues
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      // @ts-expect-error
      dappConfig={dappConfig}
      onError={(error) => {
        console.error("Wallet Error:", error);
        // Only show toast for actual errors, not disconnections
        if (!error.message?.includes("disconnected")) {
          toast.error(error.message || "An unknown wallet error occurred.");
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
