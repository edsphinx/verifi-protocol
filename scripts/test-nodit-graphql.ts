/**
 * Nodit GraphQL Indexer Test Script
 *
 * Tests the Nodit GraphQL indexer to fetch blockchain events
 * Uses GraphQL queries instead of REST API
 *
 * Usage: pnpm test:nodit-graphql
 */

import "dotenv/config";

const NODIT_API_KEY = process.env.NEXT_PUBLIC_NODIT_API_KEY;
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
const NODIT_GRAPHQL_ENDPOINT = `https://aptos-testnet.nodit.io/${NODIT_API_KEY}/v1/graphql`;

interface GraphQLResponse {
  data?: {
    events?: Array<{
      sequence_number: string;
      type: string;
      account_address: string;
      data: any;
      transaction_version: string;
      transaction_block_height: string;
    }>;
  };
  errors?: Array<{
    message: string;
  }>;
}

async function executeGraphQLQuery(
  query: string,
  variables?: any,
): Promise<GraphQLResponse> {
  const response = await fetch(NODIT_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: variables || {},
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

async function fetchEventsByType(eventType: string, limit: number = 5) {
  // Use indexed_type instead of type for better performance
  const query = `
    query GetEvents($eventType: String!, $limit: Int!) {
      events(
        where: {
          indexed_type: { _eq: $eventType }
        }
        order_by: { transaction_version: desc }
        limit: $limit
      ) {
        sequence_number
        type
        indexed_type
        account_address
        data
        transaction_version
        transaction_block_height
      }
    }
  `;

  const variables = {
    eventType,
    limit,
  };

  return await executeGraphQLQuery(query, variables);
}

async function fetchRecentTransactions(limit: number = 10) {
  const query = `
    query GetRecentTransactions($address: String!, $limit: Int!) {
      account_transactions(
        where: { account_address: { _eq: $address } }
        order_by: { transaction_version: desc }
        limit: $limit
      ) {
        transaction_version
        account_address
      }
    }
  `;

  const variables = {
    address: MODULE_ADDRESS,
    limit,
  };

  return await executeGraphQLQuery(query, variables);
}

async function testConnection() {
  console.log("🔌 Testing Nodit GraphQL Connection...\n");

  if (!NODIT_API_KEY) {
    console.error("❌ NEXT_PUBLIC_NODIT_API_KEY not found in .env");
    process.exit(1);
  }

  if (!MODULE_ADDRESS) {
    console.error("❌ NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS not found in .env");
    process.exit(1);
  }

  console.log(`✅ API Key: ${NODIT_API_KEY.substring(0, 10)}...`);
  console.log(`✅ Module Address: ${MODULE_ADDRESS.substring(0, 10)}...`);
  console.log(
    `✅ GraphQL Endpoint: ${NODIT_GRAPHQL_ENDPOINT.replace(NODIT_API_KEY, "***")}\n`,
  );

  return true;
}

async function testGraphQLEndpoint() {
  console.log("📡 Testing GraphQL Endpoint with simple query...\n");

  const query = `
    query {
      __schema {
        queryType {
          name
        }
      }
    }
  `;

  try {
    const response = await executeGraphQLQuery(query);

    if (response.errors) {
      console.error("   ❌ GraphQL Errors:", response.errors);
      return false;
    }

    console.log("   ✅ GraphQL endpoint is accessible");
    console.log(`   ✅ Schema type:`, response.data);
    return true;
  } catch (error) {
    console.error(
      "   ❌ Error:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

async function testEventQuery(eventName: string, eventType: string) {
  console.log(`\n📊 Querying: ${eventName}\n`);
  console.log(`   Event Type: ${eventType}\n`);

  try {
    const result = await fetchEventsByType(eventType, 5);

    if (result.errors) {
      console.error("   ❌ Errors:", result.errors);
      return [];
    }

    const events = result.data?.events || [];
    console.log(`   ✅ Found ${events.length} events`);

    if (events.length > 0) {
      console.log(`\n   📋 Recent Events:\n`);
      for (const event of events.slice(0, 3)) {
        console.log(
          `      Event #${event.sequence_number} (Block ${event.transaction_block_height}):`,
        );
        console.log(
          `      Data:`,
          JSON.stringify(event.data, null, 8).replace(/\n/g, "\n      "),
        );
        console.log("");
      }
    } else {
      console.log("   ℹ️  No events found\n");
    }

    return events;
  } catch (error) {
    console.error(
      `   ❌ Error:`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

async function main() {
  console.log("🚀 VeriFi Protocol - Nodit GraphQL Indexer Test\n");
  console.log("═".repeat(70));
  console.log("\n");

  // Test 1: Connection
  await testConnection();
  console.log("═".repeat(70));
  console.log("\n");

  // Test 2: GraphQL Endpoint
  const isEndpointWorking = await testGraphQLEndpoint();
  console.log("═".repeat(70));

  if (!isEndpointWorking) {
    console.log(
      "\n❌ GraphQL endpoint is not accessible. Check your API key.\n",
    );
    process.exit(1);
  }

  // Test 3: Recent Transactions
  console.log("\n🔍 Fetching recent transactions for module...\n");
  try {
    const txResult = await fetchRecentTransactions(5);
    const txCount = (txResult.data as any)?.account_transactions?.length || 0;
    console.log(`   ✅ Found ${txCount} recent transactions`);
  } catch (error) {
    console.log(
      "   ℹ️  Could not fetch transactions (this is normal for new modules)",
    );
  }
  console.log("═".repeat(70));

  // Test 4-8: Fetch Different Event Types
  const marketEvents = await testEventQuery(
    "MarketCreatedEvent",
    `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`,
  );
  console.log("═".repeat(70));

  const buyEvents = await testEventQuery(
    "SharesMintedEvent (BUY)",
    `${MODULE_ADDRESS}::verifi_protocol::SharesMintedEvent`,
  );
  console.log("═".repeat(70));

  const sellEvents = await testEventQuery(
    "SharesBurnedEvent (SELL)",
    `${MODULE_ADDRESS}::verifi_protocol::SharesBurnedEvent`,
  );
  console.log("═".repeat(70));

  const poolEvents = await testEventQuery(
    "PoolCreated (Tapp)",
    `${MODULE_ADDRESS}::router::PoolCreated`,
  );
  console.log("═".repeat(70));

  const swapEvents = await testEventQuery(
    "Swapped (Tapp)",
    `${MODULE_ADDRESS}::router::Swapped`,
  );
  console.log("═".repeat(70));

  const liquidityEvents = await testEventQuery(
    "LiquidityAdded (Tapp)",
    `${MODULE_ADDRESS}::router::LiquidityAdded`,
  );
  console.log("═".repeat(70));

  // Summary
  console.log("\n📈 SUMMARY\n");
  console.log(`   Markets Created:     ${marketEvents.length} events`);
  console.log(`   BUY Trades:          ${buyEvents.length} events`);
  console.log(`   SELL Trades:         ${sellEvents.length} events`);
  console.log(`   Pools Created:       ${poolEvents.length} events`);
  console.log(`   Swaps Executed:      ${swapEvents.length} events`);
  console.log(`   Liquidity Added:     ${liquidityEvents.length} events`);
  console.log("\n");

  const totalEvents =
    marketEvents.length +
    buyEvents.length +
    sellEvents.length +
    poolEvents.length +
    swapEvents.length +
    liquidityEvents.length;

  if (totalEvents > 0) {
    console.log("✅ SUCCESS - Nodit GraphQL Indexer is working!");
    console.log(`   Total events indexed: ${totalEvents}`);
    console.log("\n💡 Next Steps:");
    console.log("   1. Events are being indexed correctly ✅");
    console.log("   2. You can use this data in your frontend");
    console.log("   3. Configure webhooks for real-time updates");
    console.log("\n📊 You can now:");
    console.log("   - Query historical events via GraphQL");
    console.log("   - Build analytics dashboards");
    console.log("   - Track user activity");
    process.exit(0);
  } else {
    console.log("⚠️  No events found yet");
    console.log("\n💡 Recommendation:");
    console.log("   - Make some test transactions (create market, trade)");
    console.log("   - Wait a few minutes for indexing");
    console.log("   - Run this script again");
    console.log("\n   The GraphQL endpoint is working correctly! ✅");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("\n❌ FATAL ERROR:", error);
  process.exit(1);
});
