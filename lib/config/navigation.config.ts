/**
 * Navigation configuration for VeriFi Protocol
 * Centralized source of truth for all navigation routes and structure
 */

import {
  TrendingUp,
  PlusCircle,
  Wallet,
  Activity,
  Droplets,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import type { NavigationConfig } from "@/types";

export const navigationConfig: NavigationConfig = {
  mainNav: [
    {
      title: "Markets",
      items: [
        {
          title: "Markets Hub",
          href: "/",
          description:
            "Explore all active prediction markets and trade on verifiable on-chain events",
          icon: TrendingUp,
        },
        {
          title: "Create Market",
          href: "/create",
          description:
            "Launch a new prediction market based on any verifiable on-chain data",
          icon: PlusCircle,
        },
        {
          title: "Portfolio",
          href: "/portfolio",
          description:
            "View your active positions, trading history, and winnings",
          icon: Wallet,
        },
      ],
    },
    {
      title: "Liquidity",
      items: [
        {
          title: "AMM Overview",
          href: "/amm-demo",
          description: "View automated market maker pools and liquidity",
          icon: Activity,
        },
        {
          title: "Provide Liquidity",
          href: "/amm-demo",
          description:
            "Earn fees by providing liquidity to prediction market pools",
          icon: Droplets,
        },
        {
          title: "Swap Tokens",
          href: "/amm-demo",
          description:
            "Trade YES/NO tokens directly through the AMM with instant execution",
          icon: ArrowLeftRight,
        },
        {
          title: "Pool Analytics",
          href: "/amm-demo",
          description:
            "Track pool performance, APY, and trading volume metrics",
          icon: BarChart3,
        },
      ],
    },
  ],
};

/**
 * Routes configuration for easy access and type-safety
 */
export const routes = {
  home: "/",
  markets: "/",
  create: "/create",
  portfolio: "/portfolio",
  market: (id: string) => `/market/${id}`,
  amm: {
    overview: "/amm-demo",
    demo: "/amm-demo",
  },
} as const;
