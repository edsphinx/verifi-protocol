"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { MarketsHub } from "@/components/views/MarketsHub";

export default function HomePage() {
  const { connected } = useWallet();

  return (
    <main className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {connected ? (
        <div className="relative z-10">
          <MarketsHub />
        </div>
      ) : (
        <div className="h-[40rem] w-full rounded-md relative flex flex-col items-center justify-center antialiased">
          <div className="max-w-2xl mx-auto p-4 text-center">
            <h1 className="relative z-10 text-4xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-sans font-bold">
              VeriFi Protocol
            </h1>
            <p className="text-neutral-500 max-w-lg mx-auto my-4 text-lg relative z-10">
              Create and trade markets on any verifiable on-chain event,
              oracle-free.
            </p>
            <p className="text-muted-foreground  items-center relative z-10">
              Please connect your wallet to begin.
            </p>
          </div>
          <BackgroundBeams />
        </div>
      )}
    </main>
  );
}
