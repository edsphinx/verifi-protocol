"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { TrendingUp, Droplets, Activity } from "lucide-react";
import Link from "next/link";
import { usePools } from "@/lib/hooks/usePools";
import { motion } from "framer-motion";

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

export function PoolsView() {
  const { data: pools, isLoading, isError } = usePools();

  if (isLoading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <VeriFiLoader message="Loading liquidity pools..." />
      </Card>
    );
  }

  if (isError || !pools) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-destructive">
            <p>Failed to load pools. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pools.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Droplets className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pools Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no active AMM pools yet. Create one from a market detail
              page.
            </p>
            <Link href="/" className="text-primary hover:underline">
              Browse Markets →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total TVL
  const totalTVL = pools.reduce((sum, pool) => sum + pool.totalLiquidity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Charts removed for performance - will add lightweight alternatives */}
      {/* <LiquidityFlow pools={pools} totalTVL={totalTVL} /> */}
      {/* <VolumeStream data={[]} /> */}

      {/* Pools Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {pools.map((pool) => (
          <motion.div key={pool.id} variants={itemVariants}>
            <Link href={`/market/${pool.marketAddress}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="border-accent/40 text-accent"
                    >
                      Active Pool
                    </Badge>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    Pool #{pool.poolAddress.substring(0, 8)}...
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    Market: {pool.marketAddress.substring(0, 12)}...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Liquidity
                      </span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span className="font-semibold">
                          {pool.totalLiquidity.toFixed(2)} APT
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        24h Volume
                      </span>
                      <span className="font-semibold">
                        {pool.volume24h.toFixed(2)} APT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fee</span>
                      <span className="font-semibold">
                        {(pool.fee / 10000).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
