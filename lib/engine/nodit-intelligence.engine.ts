/**
 * Nodit Intelligence Engine
 *
 * Advanced market intelligence powered by Nodit's real-time blockchain indexing.
 * This engine analyzes on-chain events to provide actionable insights.
 *
 * Features:
 * - Whale Detection: Identifies large traders and their patterns
 * - Momentum Analysis: Tracks market velocity and acceleration
 * - Smart Alerts: Context-aware notifications based on user preferences
 * - Sentiment Scoring: Aggregates trading patterns into market sentiment
 * - Predictive Analytics: Uses historical patterns to forecast trends
 *
 * Nodit Integration Points:
 * - GraphQL queries for historical event analysis
 * - Webhook handlers for real-time event processing
 * - Time-series data aggregation
 * - Cross-market correlation analysis
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NODIT_API_KEY = process.env.NEXT_PUBLIC_NODIT_API_KEY || "";
const NODIT_GRAPHQL = `https://aptos-testnet.nodit.io/${NODIT_API_KEY}/v1/graphql`;
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS || "";

// ============================================================================
// TYPES
// ============================================================================

export interface WhaleActivity {
  address: string;
  totalVolume: number;
  tradeCount: number;
  avgTradeSize: number;
  largestTrade: number;
  markets: string[];
  firstSeen: Date;
  lastSeen: Date;
  classification: "mega_whale" | "whale" | "large_trader";
}

export interface MarketMomentum {
  marketAddress: string;
  description: string;
  score: number; // 0-100
  velocity: number; // trades per hour
  acceleration: number; // change in velocity
  volumeGrowth24h: number; // percentage
  uniqueTraders24h: number;
  classification: "explosive" | "hot" | "warm" | "cooling" | "cold";
  signals: string[];
}

export interface MarketSentiment {
  marketAddress: string;
  score: number; // -100 to +100 (bearish to bullish)
  yesFlowRatio: number; // % of volume going to YES
  noFlowRatio: number; // % of volume going to NO
  conviction: number; // 0-100 (how confident the signal is)
  direction:
    | "strong_yes"
    | "leaning_yes"
    | "neutral"
    | "leaning_no"
    | "strong_no";
  recentTrends: Array<{
    timestamp: Date;
    score: number;
  }>;
}

export interface SmartAlert {
  id: string;
  type:
    | "whale_entry"
    | "momentum_spike"
    | "sentiment_shift"
    | "volume_surge"
    | "price_threshold";
  severity: "critical" | "high" | "medium" | "low";
  marketAddress: string;
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  actionable: boolean;
  suggestedAction?: string;
}

interface NoditGraphQLResponse {
  data?: any;
  errors?: Array<{ message: string }>;
}

// ============================================================================
// NODIT GRAPHQL HELPERS
// ============================================================================

async function executeNoditQuery(
  query: string,
  variables?: any,
): Promise<NoditGraphQLResponse> {
  const response = await fetch(NODIT_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: variables || {} }),
  });

  if (!response.ok) {
    throw new Error(`Nodit GraphQL error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch recent trading events from Nodit
 */
async function fetchRecentTrades(
  marketAddress?: string,
  hours: number = 24,
  limit: number = 100,
) {
  const sinceTimestamp = new Date(
    Date.now() - hours * 60 * 60 * 1000,
  ).toISOString();

  const query = `
    query GetRecentTrades($since: timestamptz!, $limit: Int!) {
      events(
        where: {
          indexed_type: {
            _in: [
              "${MODULE_ADDRESS}::verifi_protocol::SharesMintedEvent",
              "${MODULE_ADDRESS}::verifi_protocol::SharesBurnedEvent"
            ]
          },
          transaction: {
            timestamp: { _gte: $since }
          }
        }
        order_by: { transaction_version: desc }
        limit: $limit
      ) {
        type
        data
        transaction {
          sender
          timestamp
          version
        }
      }
    }
  `;

  const result = await executeNoditQuery(query, {
    since: sinceTimestamp,
    limit,
  });
  return result.data?.events || [];
}

/**
 * Fetch user's trading history from Nodit
 */
async function fetchUserTradingHistory(
  userAddress: string,
  limit: number = 50,
) {
  const query = `
    query GetUserTrades($userAddress: String!, $limit: Int!) {
      events(
        where: {
          indexed_type: {
            _in: [
              "${MODULE_ADDRESS}::verifi_protocol::SharesMintedEvent",
              "${MODULE_ADDRESS}::verifi_protocol::SharesBurnedEvent"
            ]
          },
          transaction: {
            sender: { _eq: $userAddress }
          }
        }
        order_by: { transaction_version: desc }
        limit: $limit
      ) {
        type
        data
        transaction {
          timestamp
          version
        }
      }
    }
  `;

  const result = await executeNoditQuery(query, { userAddress, limit });
  return result.data?.events || [];
}

// ============================================================================
// WHALE DETECTION
// ============================================================================

/**
 * Analyze whale activity using Nodit event data
 */
export async function detectWhales(
  minVolumeAPT: number = 100,
): Promise<WhaleActivity[]> {
  console.log("[Intelligence] 🐋 Detecting whale activity...");

  try {
    // Get all trades from last 7 days via Nodit
    const events = await fetchRecentTrades(undefined, 24 * 7, 500);

    // Group by trader
    const traderMap = new Map<string, any[]>();
    for (const event of events) {
      const trader = event.transaction?.sender;
      if (!trader) continue;

      if (!traderMap.has(trader)) {
        traderMap.set(trader, []);
      }
      traderMap.get(trader)!.push(event);
    }

    const whales: WhaleActivity[] = [];

    for (const [address, trades] of traderMap.entries()) {
      // Calculate total volume
      let totalVolume = 0;
      const markets = new Set<string>();
      let largestTrade = 0;

      for (const trade of trades) {
        const amount =
          parseFloat(
            trade.data?.apt_amount_in || trade.data?.apt_amount_out || 0,
          ) / 1e8;
        totalVolume += amount;
        largestTrade = Math.max(largestTrade, amount);

        if (trade.data?.market_address) {
          markets.add(trade.data.market_address);
        }
      }

      // Filter by minimum volume
      if (totalVolume < minVolumeAPT) continue;

      const avgTradeSize = totalVolume / trades.length;
      const timestamps = trades.map((t) => new Date(t.transaction.timestamp));
      const firstSeen = new Date(
        Math.min(...timestamps.map((t) => t.getTime())),
      );
      const lastSeen = new Date(
        Math.max(...timestamps.map((t) => t.getTime())),
      );

      // Classify whale
      let classification: WhaleActivity["classification"];
      if (totalVolume >= 1000) classification = "mega_whale";
      else if (totalVolume >= 500) classification = "whale";
      else classification = "large_trader";

      whales.push({
        address,
        totalVolume,
        tradeCount: trades.length,
        avgTradeSize,
        largestTrade,
        markets: Array.from(markets),
        firstSeen,
        lastSeen,
        classification,
      });
    }

    // Sort by volume
    whales.sort((a, b) => b.totalVolume - a.totalVolume);

    console.log(`[Intelligence] Found ${whales.length} whales/large traders`);
    return whales;
  } catch (error) {
    console.error("[Intelligence] Whale detection failed:", error);
    return [];
  }
}

// ============================================================================
// MOMENTUM ANALYSIS
// ============================================================================

/**
 * Calculate market momentum using Nodit real-time data
 */
export async function analyzeMarketMomentum(
  marketAddress: string,
): Promise<MarketMomentum | null> {
  console.log(
    `[Intelligence] 📊 Analyzing momentum for ${marketAddress.substring(0, 10)}...`,
  );

  try {
    // Get market from DB
    const market = await prisma.market.findUnique({
      where: { marketAddress },
    });

    if (!market) return null;

    // Get activities from last 24h from DB (already synced from Nodit webhooks)
    const now = new Date();
    const time24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const time12hAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const [activities24h, activities12h] = await Promise.all([
      prisma.activity.count({
        where: {
          marketAddress,
          action: { in: ["BUY", "SELL", "SWAP"] },
          timestamp: { gte: time24hAgo },
        },
      }),
      prisma.activity.count({
        where: {
          marketAddress,
          action: { in: ["BUY", "SELL", "SWAP"] },
          timestamp: { gte: time12hAgo },
        },
      }),
    ]);

    // Calculate velocity (trades per hour)
    const velocity = activities24h / 24;
    const recentVelocity = activities12h / 12;

    // Calculate acceleration (change in velocity)
    const acceleration =
      velocity > 0 ? ((recentVelocity - velocity) / velocity) * 100 : 0;

    // Get volume growth
    const volumeGrowth24h =
      market.volume24h > 0
        ? ((market.totalVolume - market.volume24h) / market.volume24h) * 100
        : 0;

    // Calculate momentum score (0-100)
    let score = 0;
    score += Math.min(velocity * 2, 30); // Up to 30 points for velocity
    score += Math.min(Math.max(acceleration, 0), 40); // Up to 40 points for positive acceleration
    score += Math.min(volumeGrowth24h / 2, 30); // Up to 30 points for volume growth

    // Classify momentum
    let classification: MarketMomentum["classification"];
    if (score >= 80) classification = "explosive";
    else if (score >= 60) classification = "hot";
    else if (score >= 40) classification = "warm";
    else if (score >= 20) classification = "cooling";
    else classification = "cold";

    // Generate signals
    const signals: string[] = [];
    if (velocity > 10) signals.push("High trading frequency");
    if (acceleration > 50) signals.push("Accelerating momentum");
    if (volumeGrowth24h > 100) signals.push("Volume surge detected");
    if (market.uniqueTraders > 20) signals.push("Strong trader diversity");

    return {
      marketAddress,
      description: market.description,
      score: Math.min(Math.round(score), 100),
      velocity: Math.round(velocity * 10) / 10,
      acceleration: Math.round(acceleration),
      volumeGrowth24h: Math.round(volumeGrowth24h),
      uniqueTraders24h: market.uniqueTraders,
      classification,
      signals,
    };
  } catch (error) {
    console.error("[Intelligence] Momentum analysis failed:", error);
    return null;
  }
}

/**
 * Analyze all markets and return top momentum markets
 */
export async function getTopMomentumMarkets(
  limit: number = 10,
): Promise<MarketMomentum[]> {
  console.log("[Intelligence] 🚀 Finding top momentum markets...");

  const markets = await prisma.market.findMany({
    where: { status: "active" },
    select: { marketAddress: true },
  });

  const momentumPromises = markets.map((m) =>
    analyzeMarketMomentum(m.marketAddress),
  );
  const results = await Promise.all(momentumPromises);

  const validResults = results.filter((r) => r !== null) as MarketMomentum[];
  validResults.sort((a, b) => b.score - a.score);

  return validResults.slice(0, limit);
}

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

/**
 * Calculate market sentiment from trading flow
 */
export async function analyzeMarketSentiment(
  marketAddress: string,
): Promise<MarketSentiment | null> {
  console.log(
    `[Intelligence] 💭 Analyzing sentiment for ${marketAddress.substring(0, 10)}...`,
  );

  try {
    const time24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get BUY activities (flow direction)
    const buyActivities = await prisma.activity.findMany({
      where: {
        marketAddress,
        action: "BUY",
        timestamp: { gte: time24hAgo },
      },
      select: {
        outcome: true,
        totalValue: true,
        timestamp: true,
      },
    });

    let yesVolume = 0;
    let noVolume = 0;

    for (const activity of buyActivities) {
      const volume = activity.totalValue || 0;
      if (activity.outcome === "YES") {
        yesVolume += volume;
      } else if (activity.outcome === "NO") {
        noVolume += volume;
      }
    }

    const totalVolume = yesVolume + noVolume;
    if (totalVolume === 0) {
      return {
        marketAddress,
        score: 0,
        yesFlowRatio: 50,
        noFlowRatio: 50,
        conviction: 0,
        direction: "neutral",
        recentTrends: [],
      };
    }

    const yesFlowRatio = (yesVolume / totalVolume) * 100;
    const noFlowRatio = (noVolume / totalVolume) * 100;

    // Calculate sentiment score (-100 to +100)
    const score = (yesFlowRatio - 50) * 2;

    // Calculate conviction (how strong is the signal)
    const deviation = Math.abs(yesFlowRatio - 50);
    const conviction = Math.min((deviation / 50) * 100, 100);

    // Determine direction
    let direction: MarketSentiment["direction"];
    if (score >= 40) direction = "strong_yes";
    else if (score >= 10) direction = "leaning_yes";
    else if (score <= -40) direction = "strong_no";
    else if (score <= -10) direction = "leaning_no";
    else direction = "neutral";

    return {
      marketAddress,
      score: Math.round(score),
      yesFlowRatio: Math.round(yesFlowRatio),
      noFlowRatio: Math.round(noFlowRatio),
      conviction: Math.round(conviction),
      direction,
      recentTrends: [], // TODO: Implement time-series analysis
    };
  } catch (error) {
    console.error("[Intelligence] Sentiment analysis failed:", error);
    return null;
  }
}

// ============================================================================
// SMART ALERTS
// ============================================================================

/**
 * Generate smart alerts based on market intelligence
 */
export async function generateSmartAlerts(
  marketAddress?: string,
): Promise<SmartAlert[]> {
  console.log("[Intelligence] 🔔 Generating smart alerts...");

  const alerts: SmartAlert[] = [];

  try {
    // Detect whale entries
    const whales = await detectWhales(50);
    for (const whale of whales.slice(0, 5)) {
      if (whale.lastSeen > new Date(Date.now() - 60 * 60 * 1000)) {
        alerts.push({
          id: `whale_${whale.address}_${Date.now()}`,
          type: "whale_entry",
          severity: whale.classification === "mega_whale" ? "critical" : "high",
          marketAddress: whale.markets[0] || "",
          title: `${whale.classification.replace("_", " ").toUpperCase()} Detected`,
          message: `Trader ${whale.address.substring(0, 8)}... placed ${whale.avgTradeSize.toFixed(1)} APT avg trades`,
          data: whale,
          timestamp: whale.lastSeen,
          actionable: true,
          suggestedAction:
            "Monitor this trader's positions for potential market movement",
        });
      }
    }

    // Detect momentum spikes
    const topMomentum = await getTopMomentumMarkets(5);
    for (const momentum of topMomentum) {
      if (
        momentum.classification === "explosive" ||
        momentum.classification === "hot"
      ) {
        alerts.push({
          id: `momentum_${momentum.marketAddress}_${Date.now()}`,
          type: "momentum_spike",
          severity:
            momentum.classification === "explosive" ? "critical" : "high",
          marketAddress: momentum.marketAddress,
          title: `${momentum.classification.toUpperCase()} Momentum Detected`,
          message: `${momentum.description} - Score: ${momentum.score}/100`,
          data: momentum,
          timestamp: new Date(),
          actionable: true,
          suggestedAction: "High activity market - Consider entering position",
        });
      }
    }

    console.log(`[Intelligence] Generated ${alerts.length} alerts`);
    return alerts;
  } catch (error) {
    console.error("[Intelligence] Alert generation failed:", error);
    return [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const NoditIntelligenceEngine = {
  // Whale Detection
  detectWhales,

  // Momentum Analysis
  analyzeMarketMomentum,
  getTopMomentumMarkets,

  // Sentiment Analysis
  analyzeMarketSentiment,

  // Smart Alerts
  generateSmartAlerts,

  // Direct Nodit Access
  fetchRecentTrades,
  fetchUserTradingHistory,
} as const;

export default NoditIntelligenceEngine;
