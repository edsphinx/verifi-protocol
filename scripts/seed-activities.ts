#!/usr/bin/env ts-node

/**
 * Seed Activities for Testing Portfolio
 *
 * Manually inserts sample activities for the publisher account to test portfolio view
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PUBLISHER_ADDRESS =
  "0x227a26b2dbd6093f6f779dcae84254f5dc40b461859a49b2eae6562db0434b15";
const MARKET_ADDRESS =
  "0x42788cbb3a82048632c3c05e5a662b17c86ef34a3ad22281ad296aafd7bc437";
const POOL_ADDRESS =
  "0xff9764df723c8a4714b6c058201cd3f4213ebcd26050c3eaf6beae9e46ca2b38";

async function seedActivities() {
  console.log("🌱 Seeding activities for portfolio testing...\n");

  try {
    // Activity 1: Pool Created
    await prisma.activity.create({
      data: {
        txHash:
          "0x46283ba6bf2e8480d0b75dec166f5cef2f7e28bb8680876b0366132802720f87",
        marketAddress: MARKET_ADDRESS,
        userAddress: PUBLISHER_ADDRESS,
        action: "LIQUIDITY_ADD",
        outcome: null,
        amount: 0.03, // 0.015 YES + 0.015 NO
        timestamp: new Date(Date.now() - 600000), // 10 min ago
      },
    });
    console.log(" Activity 1: Pool Creation & Liquidity Added");

    // Activity 2: Bought YES shares
    await prisma.activity.create({
      data: {
        txHash:
          "0x0b01b08f398fb3af82418a66aa949d59cf079ee4281474ed792ed0c14e5f9d7b",
        marketAddress: MARKET_ADDRESS,
        userAddress: PUBLISHER_ADDRESS,
        action: "BUY",
        outcome: "YES",
        amount: 0.5,
        timestamp: new Date(Date.now() - 300000), // 5 min ago
      },
    });
    console.log(" Activity 2: Bought YES shares (0.5 APT)");

    // Activity 3: Bought NO shares
    await prisma.activity.create({
      data: {
        txHash:
          "0xabc123def456789012345678901234567890123456789012345678901234567",
        marketAddress: MARKET_ADDRESS,
        userAddress: PUBLISHER_ADDRESS,
        action: "BUY",
        outcome: "NO",
        amount: 0.3,
        timestamp: new Date(Date.now() - 180000), // 3 min ago
      },
    });
    console.log(" Activity 3: Bought NO shares (0.3 APT)");

    // Activity 4: Swapped on AMM
    await prisma.activity.create({
      data: {
        txHash:
          "0xdef456abc789012345678901234567890123456789012345678901234567890",
        marketAddress: POOL_ADDRESS,
        userAddress: PUBLISHER_ADDRESS,
        action: "SWAP",
        outcome: "YES",
        amount: 0.1,
        timestamp: new Date(Date.now() - 60000), // 1 min ago
      },
    });
    console.log(" Activity 4: Swapped YES → NO (0.1 APT)");

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" Successfully seeded 4 activities!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`👤 User: ${PUBLISHER_ADDRESS}`);
    console.log(` Market: ${MARKET_ADDRESS}`);
    console.log(`💧 Pool: ${POOL_ADDRESS}`);
    console.log("\n Check your portfolio at http://localhost:3000/portfolio\n");
  } catch (error) {
    console.error(" Error seeding activities:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedActivities();
