"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FeaturedMarketCard } from "@/components/cards/FeaturedMarketCard";
import { MarketCard } from "@/components/cards/MarketCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkets } from "@/lib/hooks/useMarkets";

export function MarketsHub() {
  const { featuredMarket, otherMarkets, soon, resolved, isLoading, isError } =
    useMarkets();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const renderMarketGrid = (marketsToRender: typeof otherMarkets) => {
    if (!marketsToRender || marketsToRender.length === 0) {
      return null;
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {marketsToRender.map((market) => (
          <motion.div key={market.id} variants={itemVariants}>
            <MarketCard market={market} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <Tabs defaultValue="active">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Active Markets</h1>
          <TabsList>
            <TabsTrigger value="active">All</TabsTrigger>
            <TabsTrigger value="soon">Resolving Soon</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingState />
            ) : isError ? (
              <ErrorState />
            ) : (
              <>
                <TabsContent value="active">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-10"
                  >
                    {featuredMarket ? (
                      <FeaturedMarketCard market={featuredMarket} />
                    ) : (
                      !isLoading && (
                        <EmptyState message="No active markets found. Create the first market!" />
                      )
                    )}
                    {otherMarkets && otherMarkets.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-6">
                          More Markets
                        </h2>
                        {renderMarketGrid(otherMarkets)}
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
                <TabsContent value="soon">
                  {soon.length > 0 ? (
                    renderMarketGrid(soon)
                  ) : (
                    <EmptyState message="No markets resolving soon." />
                  )}
                </TabsContent>
                <TabsContent value="resolved">
                  {resolved.length > 0 ? (
                    renderMarketGrid(resolved)
                  ) : (
                    <EmptyState message="No resolved markets to show." />
                  )}
                </TabsContent>
              </>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}

// --- Componentes Helper ---
const LoadingState = () => (
  <div className="space-y-10">
    <Skeleton className="h-[280px] w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <biome-ignore lint: false positive>
        <Skeleton key={i} className="h-[250px] w-full" />
      ))}
    </div>
  </div>
);

const ErrorState = () => (
  <div className="text-center py-20 text-destructive">
    Error loading markets. Please try again.
  </div>
);
const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12 text-muted-foreground">{message}</div>
);
