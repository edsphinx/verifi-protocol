"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FeaturedMarketCard } from "@/components/cards/FeaturedMarketCard";
import { MarketCard } from "@/components/cards/MarketCard";
import { FeaturedMarketSkeleton } from "@/components/cards/skeletons/FeaturedMarketSkeleton";
import { MarketCardSkeleton } from "@/components/cards/skeletons/MarketCardSkeleton";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkets } from "@/lib/hooks/useMarkets";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { HeroStats } from "@/components/homepage/HeroStats";
import { LiveActivityTicker } from "@/components/homepage/LiveActivityTicker";

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

  const [showLoader, setShowLoader] = useState(false);

  // Show loader after skeleton appears (400ms delay)
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoader(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

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
        {marketsToRender.map((market, index) => (
          <motion.div
            key={market.id}
            variants={itemVariants}
            custom={index}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
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
    <>
      {/* Live Activity Ticker - Full Width, no container */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="origin-top mb-6 md:mb-8"
      >
        <LiveActivityTicker />
      </motion.div>

      {/* Main content with container padding */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 md:space-y-8">
          {/* Hero Stats Section */}
          <HeroStats />

        <Tabs defaultValue="active">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary"
          >
            Markets
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
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
          </motion.div>
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingState showLoader={showLoader} />
            ) : isError ? (
              <ErrorState />
            ) : (
              <>
                <TabsContent value="active">
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.34, 1.56, 0.64, 1], // Bouncy "degen" easing
                    }}
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
                        <motion.h2
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.5,
                            delay: 0.3,
                            ease: [0.34, 1.56, 0.64, 1],
                          }}
                          className="text-2xl font-bold tracking-tight mb-6"
                        >
                          More Markets
                        </motion.h2>
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
    </div>
    </>
  );
}

// --- Componentes Helper ---
const LoadingState = ({ showLoader }: { showLoader: boolean }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key="loading"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {showLoader ? (
        <Card className="min-h-[500px] flex items-center justify-center">
          <VeriFiLoader message="Loading markets..." />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Featured market skeleton */}
          <FeaturedMarketSkeleton />

          {/* Grid of market card skeletons */}
          <div>
            <div className="h-8 w-48 bg-slate-700/50 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <MarketCardSkeleton />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  </AnimatePresence>
);

const ErrorState = () => (
  <div className="text-center py-20 text-destructive">
    Error loading markets. Please try again.
  </div>
);
const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12 text-muted-foreground">{message}</div>
);
