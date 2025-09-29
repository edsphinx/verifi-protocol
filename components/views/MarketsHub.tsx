"use client";

import { useQuery } from "@tanstack/react-query";
import { type Market, MarketCard } from "@/components/cards/MarketCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function fetchActiveMarkets(): Promise<Market[]> {
  const response = await fetch("/api/markets");
  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }
  const data = await response.json();

  return data.map((market: any) => ({
    id: market.marketAddress,
    title: market.description,
    category: "On-Chain", // Puedes hacerlo más dinámico después
    totalVolume: market.totalVolume,
    resolvesOn: new Date(market.resolutionTimestamp).toLocaleDateString(),
  }));
}

export function MarketsHub() {
  const { data: markets, isLoading, isError } = useQuery({
    queryKey: ["activeMarkets"],
    queryFn: fetchActiveMarkets,
  });
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="soon">Resolving Soon</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static list for skeletons
                <Skeleton key={i} className="h-[250px] w-full" />
              ))}
            </div>
          )}
          {isError && (
            <div className="text-center py-12 text-destructive">
              Error loading markets. Please try again.
            </div>
          )}
          {markets && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="soon">
          {/* Aquí iría la lista filtrada de mercados que resuelven pronto */}
          <div className="text-center py-12 text-muted-foreground">
            No markets resolving soon.
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          {/* Aquí iría la lista filtrada de mercados ya resueltos */}
          <div className="text-center py-12 text-muted-foreground">
            No resolved markets to show.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
