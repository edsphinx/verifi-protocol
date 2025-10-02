"use client";

import { useMarketDetails } from "@/aptos/queries/use-market-details";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionPanel } from "@/components/views/market/ActionPanel";
import { MarketDetails } from "@/components/views/market/MarketDetails";

// This component is now a Client Component and can use hooks.
export function MarketView({ marketId }: { marketId: string }) {
  const {
    data: marketDetails,
    isLoading,
    isError,
  } = useMarketDetails(marketId);

  // This is a placeholder. In a real app, you'd fetch this from your database.
  const staticMarketData = {
    title: "Will AMNIS Finance TVL be above $10M on Oct 31, 2025?",
    category: "DeFi",
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !marketDetails) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load market data.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      <div className="lg:col-span-2">
        <MarketDetails
          staticData={staticMarketData}
          dynamicData={marketDetails}
        />
      </div>
      <div className="lg:col-span-1">
        <ActionPanel marketId={marketId} dynamicData={marketDetails} />
      </div>
    </div>
  );
}
