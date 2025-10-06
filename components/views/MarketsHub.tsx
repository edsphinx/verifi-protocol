"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FeaturedMarketCard } from "@/components/cards/FeaturedMarketCard";
import { MarketCard } from "@/components/cards/MarketCard";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkets } from "@/lib/hooks/useMarkets";

export function MarketsHub() {
  const {
    featuredMarket,
    otherMarkets,
    soon,
    expired,
    resolved,
    isLoading,
    isError,
  } = useMarkets();

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

  // Prepare markets data for sentiment chart
  const activeMarketsData =
    otherMarkets && featuredMarket
      ? [featuredMarket, ...otherMarkets].map((m) => ({
          id: m.id,
          description: m.title || "",
          totalSupplyYes: 0, // TODO: Add supply data from contract
          totalSupplyNo: 0,
        }))
      : [];

  return (
    <div className="space-y-8 md:space-y-12">
      <Tabs defaultValue="active">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
          <TabsList className="grid grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="active">
              Active
              {!isLoading && otherMarkets && featuredMarket && (
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                  {otherMarkets.length + 1}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="soon">
              Soon
              {!isLoading && soon && (
                <span className="ml-2 text-xs bg-amber-500/20 px-2 py-0.5 rounded-full">
                  {soon.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired
              {!isLoading && expired && (
                <span className="ml-2 text-xs bg-destructive/20 px-2 py-0.5 rounded-full">
                  {expired.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved
              {!isLoading && resolved && (
                <span className="ml-2 text-xs bg-green-500/20 px-2 py-0.5 rounded-full">
                  {resolved.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
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
                    {/* Sentiment Overview - Removed for performance */}
                    {/* {activeMarketsData.length > 0 && (
                      <MarketsSentiment markets={activeMarketsData} />
                    )} */}

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
                    <>
                      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-sm text-amber-200">
                          These markets will resolve within the next 24 hours.
                          Place your final trades now!
                        </p>
                      </div>
                      {renderMarketGrid(soon)}
                    </>
                  ) : (
                    <EmptyState message="No markets resolving within the next 24 hours." />
                  )}
                </TabsContent>
                <TabsContent value="expired">
                  {expired.length > 0 ? (
                    <>
                      <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive/80">
                          These markets have expired and are awaiting oracle
                          resolution.
                        </p>
                      </div>
                      {renderMarketGrid(expired)}
                    </>
                  ) : (
                    <EmptyState message="No expired markets awaiting resolution." />
                  )}
                </TabsContent>
                <TabsContent value="resolved">
                  {resolved.length > 0 ? (
                    renderMarketGrid(resolved)
                  ) : (
                    <EmptyState message="No resolved markets to show." />
                  )}
                </TabsContent>
                <TabsContent value="rankings">
                  {/* MarketRankings chart removed for performance */}
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Market rankings coming soon once we have historical volume
                      data
                    </p>
                  </div>
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
const LoadingState = () => <VeriFiLoader message="Loading markets..." />;

const ErrorState = () => (
  <div className="text-center py-20 text-destructive">
    Error loading markets. Please try again.
  </div>
);
const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12 text-muted-foreground">{message}</div>
);
