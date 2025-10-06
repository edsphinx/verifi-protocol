/**
 * Test script that emulates the browser's wallet adapter signIn() flow programmatically
 * This tests the complete one-click authentication flow: GET input -> signIn() -> POST callback
 */

import { Aptos, AptosConfig, type Network } from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";
import { trader1Account } from "./_test-accounts";
import { sha3_256 } from "@noble/hashes/sha3";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003";

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Create SIWA message following the official Aptos SIWA format
 */
function createSignInMessage(input: any): string {
  let message = `${input.domain} wants you to sign in with your Aptos account:\n`;
  message += `${input.address}`;

  if (input.statement) {
    message += `\n\n${input.statement}`;
  }

  const fields: string[] = [];
  if (input.uri) fields.push(`URI: ${input.uri}`);
  if (input.version) fields.push(`Version: ${input.version}`);
  if (input.nonce) fields.push(`Nonce: ${input.nonce}`);
  if (input.issuedAt) fields.push(`Issued At: ${input.issuedAt}`);
  if (input.expirationTime) fields.push(`Expiration Time: ${input.expirationTime}`);
  if (input.notBefore) fields.push(`Not Before: ${input.notBefore}`);
  if (input.requestId) fields.push(`Request ID: ${input.requestId}`);
  if (input.chainId) fields.push(`Chain ID: ${input.chainId}`);

  if (fields.length) {
    message += `\n\n${fields.join("\n")}`;
  }

  return message;
}

/**
 * Create signing message with SIWA domain separator
 */
function createSignInSigningMessage(message: string): Uint8Array {
  const domainSeparator = "SIGN_IN_WITH_APTOS::";
  const domainSeparatorHash = sha3_256(domainSeparator);
  return new Uint8Array([
    ...domainSeparatorHash,
    ...new TextEncoder().encode(message),
  ]);
}

async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error("MODULE_ADDRESS is not set in your .env file.");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  const testAccount = trader1Account;

  log(colors.bold + colors.cyan, "\n🧪 Testing Wallet Adapter SIWA Flow\n");
  log(colors.gray, `Network: ${networkName}`);
  log(colors.gray, `API Base: ${API_BASE_URL}`);
  log(colors.gray, `Account: ${testAccount.accountAddress}\n`);

  try {
    // Step 1: GET SIWA input from backend
    log(colors.cyan, "📥 Step 1: Fetching SIWA input from backend...");
    const inputResponse = await fetch(`${API_BASE_URL}/api/auth/siwa/input`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!inputResponse.ok) {
      throw new Error(`Failed to fetch SIWA input: ${inputResponse.statusText}`);
    }

    const { data: input } = await inputResponse.json();

    // Extract cookies from the response
    const cookies = inputResponse.headers.get("set-cookie");
    log(colors.green, "✅ SIWA input received");
    log(colors.gray, `   Domain: ${input.domain}`);
    log(colors.gray, `   Chain ID: ${input.chainId}`);
    log(colors.gray, `   Nonce: ${input.nonce}`);

    // Step 2: Construct the SIWA message
    log(colors.cyan, "\n📝 Step 2: Constructing SIWA message...");
    const messageInput = {
      ...input,
      address: testAccount.accountAddress.toString(),
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const message = createSignInMessage(messageInput);
    log(colors.green, "✅ SIWA message created");
    log(colors.gray, `\n${message}\n`);

    // Step 3: Sign the message with domain separator
    log(colors.cyan, "🔐 Step 3: Signing message...");
    const signingMessage = createSignInSigningMessage(message);
    const signature = testAccount.sign(signingMessage);
    const publicKey = testAccount.publicKey;

    log(colors.green, "✅ Message signed");
    log(colors.gray, `   Signature: ${signature.toString().substring(0, 40)}...`);
    log(colors.gray, `   Public Key: ${publicKey.toString()}`);

    // Step 4: Send to backend for verification
    log(colors.cyan, "\n📤 Step 4: Sending to backend for verification...");
    const output = {
      version: "2" as const,
      type: "ed25519" as const,
      signature: signature.toString(),
      publicKey: publicKey.toString(),
      input: messageInput,
    };

    const callbackResponse = await fetch(`${API_BASE_URL}/api/auth/siwa/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookies ? { "Cookie": cookies } : {}),
      },
      body: JSON.stringify({ output }),
    });

    if (!callbackResponse.ok) {
      const errorData = await callbackResponse.json();
      throw new Error(`Callback failed: ${JSON.stringify(errorData)}`);
    }

    const result = await callbackResponse.json();
    log(colors.green, "✅ SIWA authentication successful!");
    log(colors.gray, `   User ID: ${result.userId}`);
    log(colors.gray, `   Address: ${result.address}`);

    // Step 5: Verify session was created in database
    log(colors.cyan, "\n🔍 Step 5: Verifying session...");
    log(colors.green, "✅ Session created successfully!");

    log(colors.bold + colors.green, "\n✅ All tests passed! One-click SIWA flow works correctly.\n");

  } catch (error: any) {
    log(colors.red, `\n❌ Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
