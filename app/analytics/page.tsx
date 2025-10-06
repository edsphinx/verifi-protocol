/**
 * @file Analytics Dashboard Page
 * @description Comprehensive analytics and metrics for VeriFi Protocol
 */

"use client";

import {
  DashboardHeader,
  ProtocolOverview,
  TopTradersTable,
  RecentActivityFeed,
  MarketCategoriesCard,
  VolumeChart,
  GlobalStatsTicker,
  SyncControlPanel,
} from "@/components/analytics";
import { TopMarketsTable } from "@/components/dashboard/TopMarketsTable";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  // Elastic bounce animation from UX research
  const containerAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  };

  const sectionAnimation = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  };

  return (
    <div className="min-h-screen">
      {/* Global Stats Ticker */}
      <GlobalStatsTicker />

      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <motion.div {...containerAnimation}>
          <DashboardHeader />
        </motion.div>

        {/* Sync Control Panel */}
        <motion.div
          {...sectionAnimation}
          transition={{ ...sectionAnimation.transition, delay: 0.05 }}
        >
          <SyncControlPanel />
        </motion.div>

        {/* Protocol Overview */}
        <motion.div
          {...sectionAnimation}
          transition={{ ...sectionAnimation.transition, delay: 0.1 }}
        >
          <ProtocolOverview />
        </motion.div>

        {/* Volume Chart - Full Width */}
        <motion.div
          {...sectionAnimation}
          transition={{ ...sectionAnimation.transition, delay: 0.15 }}
        >
          <VolumeChart />
        </motion.div>

        {/* Two Column Layout: Markets & Traders */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <motion.div
            {...sectionAnimation}
            transition={{ ...sectionAnimation.transition, delay: 0.2 }}
          >
            <TopMarketsTable />
          </motion.div>

          <motion.div
            {...sectionAnimation}
            transition={{ ...sectionAnimation.transition, delay: 0.25 }}
          >
            <TopTradersTable />
          </motion.div>
        </div>

        {/* Two Column Layout: Categories & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div
            {...sectionAnimation}
            transition={{ ...sectionAnimation.transition, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <MarketCategoriesCard />
          </motion.div>

          <motion.div
            {...sectionAnimation}
            transition={{ ...sectionAnimation.transition, delay: 0.35 }}
            className="lg:col-span-3"
          >
            <RecentActivityFeed />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
