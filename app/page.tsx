"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketsHub } from "@/components/views/MarketsHub"; // 🆕 Nuevo componente de vista

export default function HomePage() {
  const { connected } = useWallet();

  return (
    <main className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {connected ? (
        <MarketsHub />
      ) : (
        <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>Welcome to VeriFi Protocol</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please connect your wallet using the button in the top-right
                corner to see available markets.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
