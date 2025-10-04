import { NextResponse } from "next/server";
import client from "@/lib/clients/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      txHash,
      marketAddress,
      userAddress,
      action,
      outcome,
      amount,
      price,
      totalValue,
      // Additional fields for liquidity actions
      poolAddress,
      yesAmount,
      noAmount,
      lpTokens,
    } = body;

    console.log(
      `[API /api/activity] Recording ${action} activity for user: ${userAddress.substring(0, 10)}...`,
    );

    // Check if activity with this txHash already exists
    const existingActivity = await client.activity.findUnique({
      where: { txHash },
    });

    if (existingActivity) {
      console.log(
        `[API /api/activity] Activity already exists for tx: ${txHash.substring(0, 10)}...`,
      );
      return NextResponse.json(existingActivity);
    }

    // Create new activity record
    const activity = await client.activity.create({
      data: {
        txHash,
        marketAddress,
        userAddress,
        action,
        outcome: outcome || null,
        amount,
        price: price || null,
        totalValue: totalValue || null,
      },
    });

    console.log(`[API /api/activity] Activity recorded:`, activity.id);

    // Handle liquidity-specific actions
    if (action === "LIQUIDITY_ADD" && poolAddress && lpTokens) {
      // Create or update liquidity position
      try {
        const liquidityPosition = await client.liquidityPosition.create({
          data: {
            userAddress,
            poolAddress,
            marketAddress,
            lpTokens,
            liquidityProvided: totalValue || 0,
            yesAmount: yesAmount || 0,
            noAmount: noAmount || 0,
            currentValue: totalValue || 0,
            feesEarned: 0,
            unrealizedPnL: 0,
            apr: 0,
            status: "ACTIVE",
          },
        });

        console.log(
          `[API /api/activity] Liquidity position created:`,
          liquidityPosition.id,
        );

        // Update pool metrics
        await client.tappPool.update({
          where: { poolAddress },
          data: {
            totalLiquidity: { increment: totalValue || 0 },
          },
        });
      } catch (positionError) {
        console.error(
          "[API /api/activity] Error creating liquidity position:",
          positionError,
        );
      }
    } else if (action === "LIQUIDITY_REMOVE" && poolAddress && lpTokens) {
      // Update liquidity position to withdrawn
      try {
        // Find the most recent active position for this user and pool
        const position = await client.liquidityPosition.findFirst({
          where: {
            userAddress,
            poolAddress,
            status: "ACTIVE",
          },
          orderBy: { createdAt: "desc" },
        });

        if (position) {
          await client.liquidityPosition.update({
            where: { id: position.id },
            data: {
              status: "WITHDRAWN",
              withdrawnAt: new Date(),
            },
          });

          console.log(
            `[API /api/activity] Liquidity position withdrawn:`,
            position.id,
          );

          // Update pool metrics
          await client.tappPool.update({
            where: { poolAddress },
            data: {
              totalLiquidity: { decrement: position.liquidityProvided },
            },
          });
        }
      } catch (withdrawError) {
        console.error(
          "[API /api/activity] Error withdrawing liquidity position:",
          withdrawError,
        );
      }
    }

    // Update market metrics based on action
    if (action === "BUY" || action === "SELL" || action === "SWAP") {
      // Increment total trades and volume
      await client.market.update({
        where: { marketAddress },
        data: {
          totalTrades: { increment: 1 },
          totalVolume: { increment: totalValue || 0 },
          volume24h: { increment: totalValue || 0 },
          volume7d: { increment: totalValue || 0 },
        },
      });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("[API /api/activity] Error recording activity:", error);

    if (error instanceof Error) {
      console.error("[API /api/activity] Error details:", error.message);
    }

    return NextResponse.json(
      { error: "Failed to record activity" },
      { status: 500 },
    );
  }
}
