/**
 * Intelligence Engine Test Script
 *
 * Demonstrates the Nodit-powered intelligence features
 * Usage: pnpm test:intelligence
 */

import "dotenv/config";
import {
  detectWhales,
  getTopMomentumMarkets,
  analyzeMarketSentiment,
  generateSmartAlerts,
} from "../lib/engine/nodit-intelligence.engine";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 VeriFi Protocol - Intelligence Engine Test\n");
  console.log("Powered by Nodit Real-Time Indexing");
  console.log("═".repeat(70));
  console.log("\n");

  // Test 1: Whale Detection
  console.log("🐋 Test 1: Whale Detection\n");
  console.log("   Analyzing large traders using Nodit event data...\n");

  const whales = await detectWhales(50);

  if (whales.length > 0) {
    console.log(`   ✅ Found ${whales.length} whale(s)/large trader(s)\n`);
    for (const whale of whales.slice(0, 5)) {
      console.log(
        `      ${whale.classification.toUpperCase().replace("_", " ")}`,
      );
      console.log(`      Address: ${whale.address.substring(0, 12)}...`);
      console.log(`      Total Volume: ${whale.totalVolume.toFixed(2)} APT`);
      console.log(`      Trades: ${whale.tradeCount}`);
      console.log(`      Avg Trade: ${whale.avgTradeSize.toFixed(2)} APT`);
      console.log(`      Largest Trade: ${whale.largestTrade.toFixed(2)} APT`);
      console.log(`      Markets: ${whale.markets.length}`);
      console.log("");
    }
  } else {
    console.log("   ℹ️  No whales detected (normal for new markets)\n");
  }

  console.log("═".repeat(70));
  console.log("\n");

  // Test 2: Market Momentum
  console.log("📊 Test 2: Market Momentum Analysis\n");
  console.log("   Finding hot markets with high velocity...\n");

  const topMomentum = await getTopMomentumMarkets(5);

  if (topMomentum.length > 0) {
    console.log(`   ✅ Found ${topMomentum.length} market(s) with momentum\n`);
    for (const market of topMomentum) {
      console.log(
        `      ${market.classification.toUpperCase()} - Score: ${market.score}/100`,
      );
      console.log(`      Market: ${market.marketAddress.substring(0, 12)}...`);
      console.log(`      Description: ${market.description}`);
      console.log(`      Velocity: ${market.velocity} trades/hour`);
      console.log(`      Acceleration: ${market.acceleration}%`);
      console.log(`      Volume Growth: ${market.volumeGrowth24h}%`);
      console.log(`      Signals: ${market.signals.join(", ") || "None"}`);
      console.log("");
    }
  } else {
    console.log("   ℹ️  No momentum detected yet\n");
  }

  console.log("═".repeat(70));
  console.log("\n");

  // Test 3: Sentiment Analysis
  console.log("💭 Test 3: Market Sentiment Analysis\n");

  const markets = await prisma.market.findMany({
    where: { status: "active" },
    select: { marketAddress: true, description: true },
    take: 3,
  });

  if (markets.length > 0) {
    console.log(`   Analyzing sentiment for ${markets.length} market(s)...\n`);

    for (const market of markets) {
      const sentiment = await analyzeMarketSentiment(market.marketAddress);

      if (sentiment) {
        console.log(`      Market: ${market.description}`);
        console.log(
          `      Direction: ${sentiment.direction.toUpperCase().replace("_", " ")}`,
        );
        console.log(`      Score: ${sentiment.score} (-100 to +100)`);
        console.log(`      YES Flow: ${sentiment.yesFlowRatio}%`);
        console.log(`      NO Flow: ${sentiment.noFlowRatio}%`);
        console.log(`      Conviction: ${sentiment.conviction}%`);
        console.log("");
      }
    }
  }

  console.log("═".repeat(70));
  console.log("\n");

  // Test 4: Smart Alerts
  console.log("🔔 Test 4: Smart Alerts Generation\n");
  console.log("   Generating actionable alerts...\n");

  const alerts = await generateSmartAlerts();

  if (alerts.length > 0) {
    console.log(`   ✅ Generated ${alerts.length} alert(s)\n`);

    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    const highAlerts = alerts.filter((a) => a.severity === "high");

    if (criticalAlerts.length > 0) {
      console.log(`      🚨 CRITICAL ALERTS (${criticalAlerts.length}):\n`);
      for (const alert of criticalAlerts) {
        console.log(`         ${alert.title}`);
        console.log(`         ${alert.message}`);
        if (alert.suggestedAction) {
          console.log(`         💡 ${alert.suggestedAction}`);
        }
        console.log("");
      }
    }

    if (highAlerts.length > 0) {
      console.log(`      ⚠️  HIGH PRIORITY ALERTS (${highAlerts.length}):\n`);
      for (const alert of highAlerts.slice(0, 3)) {
        console.log(`         ${alert.title}`);
        console.log(`         ${alert.message}`);
        console.log("");
      }
    }
  } else {
    console.log("   ℹ️  No alerts generated (markets are quiet)\n");
  }

  console.log("═".repeat(70));
  console.log("\n");

  // Summary
  console.log("📈 INTELLIGENCE SUMMARY\n");
  console.log(`   Whales Detected:       ${whales.length}`);
  console.log(
    `   Hot Markets:           ${topMomentum.filter((m) => m.classification === "hot" || m.classification === "explosive").length}`,
  );
  console.log(`   Markets Analyzed:      ${markets.length}`);
  console.log(`   Alerts Generated:      ${alerts.length}`);
  console.log("\n");

  console.log("✅ SUCCESS - Intelligence Engine is operational!");
  console.log("\n💡 Features demonstrated:");
  console.log("   ✓ Real-time whale detection via Nodit");
  console.log("   ✓ Market momentum scoring");
  console.log("   ✓ Sentiment analysis from trading flow");
  console.log("   ✓ Context-aware smart alerts");
  console.log("\n🔗 API Endpoints available:");
  console.log("   GET /api/intelligence/whales");
  console.log("   GET /api/intelligence/momentum");
  console.log("   GET /api/intelligence/sentiment?market=<address>");
  console.log("   GET /api/intelligence/alerts");
  console.log("\n");

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ FATAL ERROR:", error);
  process.exit(1);
});
