"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, AlertCircle } from "lucide-react";
import { WalletSelector } from "@/components/WalletSelector";

export function WalletConnectionGuard({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    // Track if user was previously connected
    if (connected) {
      setWasConnected(true);
      setShowReconnectPrompt(false);
    }

    // If user was connected but now disconnected, show prompt
    if (wasConnected && !connected) {
      setShowReconnectPrompt(true);
    }
  }, [connected, wasConnected]);

  // Don't show prompt on initial load (user never connected)
  if (!showReconnectPrompt) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-primary/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Wallet className="h-12 w-12 text-primary" />
                <AlertCircle className="h-5 w-5 text-destructive absolute -top-1 -right-1" />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold">Wallet Disconnected</CardTitle>
            <CardDescription className="text-base">
              Your wallet connection was lost. Please reconnect to continue using VeriFi Protocol.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wallet selector with prominent styling */}
            <div className="space-y-2">
              <WalletSelector />
            </div>

            {/* Dismiss button for browsing without wallet */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowReconnectPrompt(false)}
            >
              Browse without wallet
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Some features require a connected wallet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Render children in background (blurred) */}
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
    </>
  );
}
