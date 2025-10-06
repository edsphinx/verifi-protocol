/**
 * @file Analytics Dashboard Page
 * @description Comprehensive analytics and metrics for VeriFi Protocol
 * Optimized layout for maximum data visibility and space efficiency
 */

"use client";

import {
  ProtocolOverview,
  TopTradersTable,
  RecentActivityFeed,
  MarketCategoriesCard,
  VolumeChart,
  GlobalStatsTicker,
  MarketPulseMonitor,
} from "@/components/analytics";
import { TopMarketsTable } from "@/components/dashboard/TopMarketsTable";
import { FeaturedMarketsGrid } from "@/components/analytics/FeaturedMarketsGrid";
import { CompactSystemStatus } from "@/components/analytics/CompactSystemStatus";
import { CompactAlertsButton } from "@/components/analytics/CompactAlertsButton";
import { useTopMarkets } from "@/lib/hooks/use-top-markets";
import { motion, AnimatePresence } from "framer-motion";

// Bouncy "degen" easing for professional animations
const bouncy = [0.34, 1.56, 0.64, 1] as const;

const fadeInUp = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

export default function AnalyticsPage() {
  // Fetch data for intelligence features
  const { topMarkets } = useTopMarkets();
  const markets = topMarkets || [];

  return (
    <div className="min-h-screen">
      {/* Global Stats Ticker */}
      <GlobalStatsTicker />

      <div className="container mx-auto py-6 space-y-6">
        {/* Compact Top Bar: System Status + Alerts */}
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.5, ease: bouncy }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex-1">
            <CompactSystemStatus />
          </div>
          <CompactAlertsButton />
        </motion.div>

        {/* Main Dashboard Grid - Optimized for Data Visibility */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Primary Data (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Protocol Overview - Compact */}
            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.5, delay: 0.1, ease: bouncy }}
            >
              <ProtocolOverview />
            </motion.div>

            {/* Volume Chart - Prominent */}
            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.5, delay: 0.2, ease: bouncy }}
            >
              <VolumeChart />
            </motion.div>

            {/* Featured Markets - Level 3 Intelligence */}
            <AnimatePresence mode="wait">
              {markets.length > 0 && (
                <motion.div
                  key="featured-markets"
                  {...fadeInUp}
                  transition={{ duration: 0.5, delay: 0.3, ease: bouncy }}
                >
                  <FeaturedMarketsGrid markets={markets} count={3} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Markets & Traders Tables - Full Width for Better Data Visibility */}
            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.5, delay: 0.4, ease: bouncy }}
            >
              <TopMarketsTable />
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.5, delay: 0.5, ease: bouncy }}
            >
              <TopTradersTable />
            </motion.div>
          </div>

          {/* Right Sidebar: Live Activity (4 cols) - Level 4 Complete */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Market Categories - Compact */}
            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.5, delay: 0.2, ease: bouncy }}
            >
              <MarketCategoriesCard />
            </motion.div>

            {/* Recent Activity Feed - Scrollable */}
            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.5, delay: 0.3, ease: bouncy }}
            >
              <RecentActivityFeed />
            </motion.div>

            {/* Level 4: Market Pulse Monitor */}
            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.5, delay: 0.4, ease: bouncy }}
            >
              <MarketPulseMonitor />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
