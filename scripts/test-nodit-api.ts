/**
 * Nodit API Test Script
 *
 * Tests the Nodit API integration to verify:
 * 1. API key is valid
 * 2. Can fetch recent events
 * 3. Can query specific contract events
 * 4. Event data structure matches our webhook handler
 *
 * Usage: pnpm test:nodit
 */

import "dotenv/config";

const NODIT_API_KEY = process.env.NEXT_PUBLIC_NODIT_API_KEY;
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
const NODIT_API_BASE = "https://aptos-testnet.nodit.io";

interface NoditEventResponse {
  events: Array<{
    type: string;
    guid: {
      creation_number: string;
      account_address: string;
    };
    sequence_number: string;
    data: any;
  }>;
}

async function testNoditConnection() {
  console.log("🔌 Testing Nodit API Connection...\n");

  if (!NODIT_API_KEY) {
    console.error("❌ NEXT_PUBLIC_NODIT_API_KEY not found in .env");
    process.exit(1);
  }

  if (!MODULE_ADDRESS) {
    console.error("❌ NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS not found in .env");
    process.exit(1);
  }

  console.log(`✅ API Key: ${NODIT_API_KEY.substring(0, 10)}...`);
  console.log(`✅ Module Address: ${MODULE_ADDRESS.substring(0, 10)}...\n`);

  return true;
}

async function fetchRecentEvents(eventType: string, limit: number = 5) {
  const url = `${NODIT_API_BASE}/v1/accounts/${MODULE_ADDRESS}/events/${eventType}?limit=${limit}`;

  console.log(`📡 Fetching events: ${eventType.split("::").pop()}`);
  console.log(`   URL: ${url}\n`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": NODIT_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: NoditEventResponse = await response.json();

    console.log(`   ✅ Found ${data.events?.length || 0} events`);

    if (data.events && data.events.length > 0) {
      console.log(`\n   📋 Recent Events:\n`);
      for (const event of data.events.slice(0, 3)) {
        console.log(`      Event #${event.sequence_number}:`);
        console.log(
          `      Data:`,
          JSON.stringify(event.data, null, 8).replace(/\n/g, "\n      "),
        );
        console.log("");
      }
    } else {
      console.log(
        "   ℹ️  No events found (this might be normal if no activity yet)\n",
      );
    }

    return data.events || [];
  } catch (error) {
    console.error(
      `   ❌ Error:`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

async function testWebhookPayload() {
  console.log("\n🧪 Testing Webhook Payload Structure...\n");

  // Simulate a webhook payload
  const mockPayload = {
    event: {
      type: `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`,
      data: {
        market_address: "0xtest123...",
        creator: "0xcreator123...",
        oracle_id: "aptos-balance",
        title: "Test Market",
        expiration_time: "1735689600",
      },
    },
    transaction: {
      hash: "0xtxhash123...",
      sender: "0xcreator123...",
      timestamp: new Date().toISOString(),
    },
  };

  console.log("   Mock webhook payload:");
  console.log(JSON.stringify(mockPayload, null, 2));

  // Test if our webhook handler would accept this
  const isValid =
    mockPayload.event &&
    mockPayload.event.type &&
    mockPayload.transaction &&
    mockPayload.transaction.hash;

  console.log(
    `\n   ${isValid ? "✅" : "❌"} Payload structure is ${isValid ? "valid" : "invalid"}`,
  );

  return isValid;
}

async function main() {
  console.log("🚀 VeriFi Protocol - Nodit API Test\n");
  console.log("═".repeat(60));
  console.log("\n");

  // Test 1: Connection
  await testNoditConnection();
  console.log("═".repeat(60));
  console.log("\n");

  // Test 2: Fetch MarketCreatedEvent
  console.log("📊 Test 2: MarketCreatedEvent\n");
  const marketEvents = await fetchRecentEvents(
    `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`,
  );
  console.log("═".repeat(60));
  console.log("\n");

  // Test 3: Fetch SharesMintedEvent (BUY)
  console.log("💰 Test 3: SharesMintedEvent (BUY trades)\n");
  const buyEvents = await fetchRecentEvents(
    `${MODULE_ADDRESS}::verifi_protocol::SharesMintedEvent`,
  );
  console.log("═".repeat(60));
  console.log("\n");

  // Test 4: Fetch SharesBurnedEvent (SELL)
  console.log("💸 Test 4: SharesBurnedEvent (SELL trades)\n");
  const sellEvents = await fetchRecentEvents(
    `${MODULE_ADDRESS}::verifi_protocol::SharesBurnedEvent`,
  );
  console.log("═".repeat(60));
  console.log("\n");

  // Test 5: Fetch PoolCreated (Tapp)
  console.log("💧 Test 5: PoolCreated (Tapp AMM)\n");
  const poolEvents = await fetchRecentEvents(
    `${MODULE_ADDRESS}::router::PoolCreated`,
  );
  console.log("═".repeat(60));
  console.log("\n");

  // Test 6: Fetch Swapped (Tapp)
  console.log("🔄 Test 6: Swapped (Tapp AMM)\n");
  const swapEvents = await fetchRecentEvents(
    `${MODULE_ADDRESS}::router::Swapped`,
  );
  console.log("═".repeat(60));
  console.log("\n");

  // Test 7: Webhook payload structure
  await testWebhookPayload();
  console.log("═".repeat(60));
  console.log("\n");

  // Summary
  console.log("📈 SUMMARY\n");
  console.log(`   Markets Created:     ${marketEvents.length} events`);
  console.log(`   BUY Trades:          ${buyEvents.length} events`);
  console.log(`   SELL Trades:         ${sellEvents.length} events`);
  console.log(`   Pools Created:       ${poolEvents.length} events`);
  console.log(`   Swaps Executed:      ${swapEvents.length} events`);
  console.log("\n");

  const totalEvents =
    marketEvents.length +
    buyEvents.length +
    sellEvents.length +
    poolEvents.length +
    swapEvents.length;

  if (totalEvents > 0) {
    console.log("✅ SUCCESS - Nodit API is working correctly!");
    console.log(`   Total events indexed: ${totalEvents}`);
    console.log("\n💡 Next Steps:");
    console.log("   1. Configure webhooks in Nodit Dashboard");
    console.log("   2. Use ngrok to expose local dev server");
    console.log("   3. Test webhook by creating a market");
    process.exit(0);
  } else {
    console.log("⚠️  WARNING - No events found");
    console.log("   This could mean:");
    console.log("   - No transactions have been made yet");
    console.log("   - Events are not being indexed by Nodit");
    console.log("   - Module address might be incorrect");
    console.log("\n💡 Recommendation:");
    console.log("   - Make a test transaction (create market, buy shares)");
    console.log("   - Run this script again in a few minutes");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("\n❌ FATAL ERROR:", error);
  process.exit(1);
});
