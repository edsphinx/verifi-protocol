/**
 * Nodit Webhook Handler
 * Handles events from Nodit indexer using service layer
 */

import { NextResponse } from "next/server";
import { recordActivity, activityExists } from "@/services/activity.service";
import { recordTappPool, poolExists } from "@/services/tapp-pool.service";
import { recordNewMarket } from "@/services/market.service";
import {
  createGlobalNotification,
  createUserNotification,
} from "@/services/notification.service";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.log(
      "📨 Nodit webhook FULL PAYLOAD:",
      JSON.stringify(payload, null, 2),
    );
    console.log("📨 Nodit webhook summary:", {
      event: payload.event?.type,
      tx: payload.transaction?.hash,
    });

    // Validate payload structure
    if (!payload.event || !payload.transaction || !payload.transaction.hash) {
      console.warn(
        "⚠️ Invalid webhook payload structure - likely a test webhook",
      );
      return NextResponse.json(
        {
          status: "ignored",
          reason:
            "Invalid payload structure - missing event or transaction data",
        },
        { status: 200 },
      );
    }

    const eventType = payload.event?.type;
    const eventData = payload.event?.data;
    const txHash = payload.transaction?.hash;
    const sender = payload.transaction?.sender;
    const timestamp = payload.transaction?.timestamp;

    // Skip if already processed
    if (await activityExists(txHash)) {
      return NextResponse.json({ status: "already_processed" });
    }

    // Handle VeriFi SharesMintedEvent (Buy)
    if (eventType?.includes("SharesMintedEvent")) {
      await recordActivity({
        txHash,
        marketAddress: eventData.market_address,
        userAddress: eventData.buyer,
        action: "BUY",
        outcome: eventData.is_yes_outcome ? "YES" : "NO",
        amount: parseInt(eventData.apt_amount_in) / 10 ** 8,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      });
    }

    // Handle VeriFi SharesBurnedEvent (Sell)
    else if (eventType?.includes("SharesBurnedEvent")) {
      await recordActivity({
        txHash,
        marketAddress: eventData.market_address,
        userAddress: eventData.seller,
        action: "SELL",
        outcome: eventData.is_yes_outcome ? "YES" : "NO",
        amount: parseInt(eventData.apt_amount_out) / 10 ** 8,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      });
    }

    // Handle MarketCreatedEvent
    else if (eventType?.includes("MarketCreatedEvent")) {
      await recordNewMarket({
        marketAddress: eventData.market_address,
        creatorAddress: eventData.creator,
        description: `Oracle: ${eventData.oracle_id}`,
        resolutionTimestamp: new Date(Number(eventData.expiration_time) * 1000),
        status: "active",
      });

      // Create global notification for new market
      await createGlobalNotification(
        "NEW_MARKET",
        "🎯 New Market Created!",
        `${eventData.title || "New prediction market"} is now live and accepting trades!`,
        eventData.market_address,
        txHash,
        {
          creator: eventData.creator,
          title: eventData.title,
          oracleId: eventData.oracle_id,
          expirationTime: eventData.expiration_time,
        },
      );
    }

    // Handle Tapp PoolCreated
    else if (eventType === `${MODULE_ADDRESS}::router::PoolCreated`) {
      if (!(await poolExists(eventData.pool_addr))) {
        await recordTappPool({
          poolAddress: eventData.pool_addr,
          marketAddress: eventData.market_address || "",
          hookType: eventData.hook_type || 4,
          yesTokenAddress: eventData.assets?.[0] || "",
          noTokenAddress: eventData.assets?.[1] || "",
          fee: eventData.fee || 3000,
          creatorAddress: sender,
        });

        // Create global notification for new pool
        await createGlobalNotification(
          "POOL_CREATED",
          "💧 New AMM Pool Available!",
          `A liquidity pool has been created. Start swapping without slippage!`,
          eventData.pool_addr,
          txHash,
          {
            poolAddress: eventData.pool_addr,
            marketAddress: eventData.market_address,
            fee: eventData.fee,
          },
        );
      }
    }

    // Handle Tapp LiquidityAdded
    else if (eventType === `${MODULE_ADDRESS}::router::LiquidityAdded`) {
      await recordActivity({
        txHash,
        marketAddress: eventData.pool_addr,
        userAddress: sender,
        action: "LIQUIDITY_ADD",
        amount: 0,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      });
    }

    // Handle Tapp Swapped
    else if (eventType === `${MODULE_ADDRESS}::router::Swapped`) {
      await recordActivity({
        txHash,
        marketAddress: eventData.pool_addr,
        userAddress: sender,
        action: "SWAP",
        amount: parseInt(eventData.amount_in) / 10 ** 8,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      });
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
