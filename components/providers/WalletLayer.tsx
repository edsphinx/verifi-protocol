/**
 * @file Wallet Layer Provider
 * @description Unified wallet management layer that consolidates:
 * - WalletProvider (Aptos adapter)
 * - WalletSync (Zustand persistence)
 * - WalletConnectionGuard (UX layer)
 */

import type { PropsWithChildren } from "react";
import { WalletProvider } from "@/components/WalletProvider";
import { WalletSync } from "@/components/WalletSync";
import { WalletConnectionGuard } from "@/components/WalletConnectionGuard";

export function WalletLayer({ children }: PropsWithChildren) {
  return (
    <WalletProvider>
      <WalletSync />
      <WalletConnectionGuard>
        {children}
      </WalletConnectionGuard>
    </WalletProvider>
  );
}
