/**
 * Admin endpoint to resolve expired markets
 * GET /api/admin/resolve-expired
 */

import { NextResponse } from "next/server";
import { aptosClient } from "@/aptos/client";
import { MODULE_ADDRESS } from "@/aptos/constants";
import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    console.log("[resolve-expired] 🚀 Starting resolution process...");

    // Get resolver private key from env
    const resolverKey = process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY;
    if (!resolverKey) {
      console.error(
        "[resolve-expired] ❌ Resolver key not found in environment",
      );
      return NextResponse.json(
        { error: "Resolver key not configured" },
        { status: 500 },
      );
    }

    // Initialize resolver account
    const privateKey = new Ed25519PrivateKey(resolverKey);
    const resolver = Account.fromPrivateKey({ privateKey });

    console.log(
      `[resolve-expired] 🔑 Resolver address: ${resolver.accountAddress.toString()}`,
    );

    // Get all market addresses from registry
    const result = await aptosClient().view({
      payload: {
        function:
          `${MODULE_ADDRESS}::verifi_protocol::get_all_market_addresses` as `${string}::${string}::${string}`,
        typeArguments: [],
        functionArguments: [],
      },
    });

    const marketAddresses = (result[0] as string[]) || [];
    console.log(
      `[resolve-expired] 📊 Found ${marketAddresses.length} total markets`,
    );

    const results = {
      total: marketAddresses.length,
      expired: 0,
      resolved: 0,
      failed: 0,
      errors: [] as string[],
      txHashes: [] as string[],
    };

    const now = Date.now() / 1000; // Current time in seconds

    // Check each market
    for (const marketAddress of marketAddresses) {
      try {
        // Get market state
        const marketState = await aptosClient().view({
          payload: {
            function:
              `${MODULE_ADDRESS}::verifi_protocol::get_market_state` as `${string}::${string}::${string}`,
            typeArguments: [],
            functionArguments: [marketAddress],
          },
        });

        const status = Number(marketState[0]);

        // Skip if already resolved (status 2 or 3)
        if (status === 2 || status === 3) {
          console.log(
            `[resolve-expired] ⏭️  Market ${marketAddress.substring(0, 10)}... already resolved (status: ${status})`,
          );
          continue;
        }

        // Get market details to check expiration
        const marketDetails = await aptosClient().getAccountResource({
          accountAddress: marketAddress,
          resourceType: `${MODULE_ADDRESS}::verifi_protocol::Market`,
        });

        const expirationTime = Number(
          (marketDetails.data as any).expiration_timestamp,
        );

        // Check if expired
        if (now >= expirationTime) {
          results.expired++;
          console.log(
            `[resolve-expired] ⏰ Market ${marketAddress.substring(0, 10)}... is expired, resolving...`,
          );

          try {
            // Call resolve_market
            console.log(
              `[resolve-expired] 📝 Building transaction for market ${marketAddress.substring(0, 10)}...`,
            );
            const transaction = await aptosClient().transaction.build.simple({
              sender: resolver.accountAddress,
              data: {
                function: `${MODULE_ADDRESS}::verifi_protocol::resolve_market`,
                functionArguments: [marketAddress],
              },
            });

            console.log(
              `[resolve-expired] ✍️  Signing and submitting transaction...`,
            );
            const committedTxn = await aptosClient().signAndSubmitTransaction({
              signer: resolver,
              transaction,
            });

            console.log(
              `[resolve-expired] ⏳ Waiting for transaction ${committedTxn.hash.substring(0, 20)}...`,
            );
            await aptosClient().waitForTransaction({
              transactionHash: committedTxn.hash,
              options: {
                timeoutSecs: 30,
                waitForIndexer: false,
              },
            });

            results.resolved++;
            results.txHashes.push(committedTxn.hash);
            console.log(
              `[resolve-expired] ✅ Resolved market ${marketAddress.substring(0, 10)}... - tx: ${committedTxn.hash}`,
            );
          } catch (resolveError: any) {
            results.failed++;
            const errorMsg = `Failed to resolve ${marketAddress.substring(0, 10)}...: ${resolveError.message}`;
            results.errors.push(errorMsg);
            console.error(`[resolve-expired] ❌ ${errorMsg}`);
          }
        }
      } catch (error: any) {
        console.error(
          `[resolve-expired] ⚠️  Error checking market ${marketAddress.substring(0, 10)}...:`,
          error.message,
        );
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[resolve-expired] 🎉 Resolution complete in ${duration}s:`,
      results,
    );

    return NextResponse.json({
      success: true,
      message: `Resolved ${results.resolved} expired markets`,
      results,
    });
  } catch (error: any) {
    console.error("[resolve-expired] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
