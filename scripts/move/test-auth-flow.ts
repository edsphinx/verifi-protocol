/**
 * Automated test script for the complete authorization flow
 * Tests: Wallet connection -> SIWA -> Session Keys -> Session Transactions
 */

import {
  Aptos,
  AptosConfig,
  EphemeralKeyPair,
  Serializer,
  AccountAddress,
  type Network,
} from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";
import { trader1Account, trader2Account, logAllAccounts } from "./_test-accounts";
import * as fs from "fs";
import * as path from "path";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

// Test results
interface TestResult {
  test: string;
  status: "pass" | "fail";
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

// Helper functions
function logTest(name: string) {
  console.log(`${colors.cyan}\n🧪 Testing: ${name}${colors.reset}`);
}

function logSuccess(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message: string) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message: string) {
  console.log(`${colors.gray}ℹ️  ${message}${colors.reset}`);
}

function logDebug(label: string, data: any) {
  console.log(`${colors.gray}🔍 ${label}:${colors.reset}`, data);
}

function addResult(test: string, status: "pass" | "fail", error?: string, data?: any) {
  results.push({ test, status, error, data });
}

// Main test runner
async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error("MODULE_ADDRESS is not set in your .env file.");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  // Select test account
  const testAccount = trader1Account; // Use trader1 for testing

  console.log(`${colors.bold}${colors.blue}\n🚀 Starting Authorization Flow Tests\n${colors.reset}`);
  console.log(`${colors.gray}Network: ${networkName} (${nodeUrl})`);
  console.log(`${colors.gray}Module: ${MODULE_ADDRESS}`);
  console.log(`${colors.gray}Test Account: ${testAccount.accountAddress}${colors.reset}`);

  // Test 1: Wallet Connection
  await testWalletConnection(aptos, testAccount);

  // Test 2: SIWA Authentication
  const siwaResult = await testSIWAAuth(testAccount);

  // Test 3: Session Key Creation
  const sessionResult = await testSessionKeyCreation(aptos, testAccount);

  if (sessionResult.success && sessionResult.ephemeralKeyPair) {
    // Test 4: Verify Session
    await testVerifySession(aptos, testAccount);

    // Test 5: Execute Transaction with Session
    await testSessionTransaction(aptos, testAccount, sessionResult.ephemeralKeyPair);

    // Test 6: Revoke Session
    await testRevokeSession(aptos, testAccount);
  }

  printSummary();
}

// Test 1: Wallet Connection Simulation
async function testWalletConnection(aptos: Aptos, account: any) {
  logTest("Wallet Connection");

  try {
    logDebug("Account address", account.accountAddress.toString());
    logDebug("Public key", account.publicKey.toString());

    // Get account info to verify connection
    const accountInfo = await aptos.getAccountInfo({
      accountAddress: account.accountAddress,
    });

    logSuccess(`Connected wallet: ${account.accountAddress}`);
    logInfo(`Sequence number: ${accountInfo.sequence_number}`);
    logDebug("Account info", accountInfo);

    addResult("Wallet Connection", "pass", undefined, {
      address: account.accountAddress.toString(),
      sequenceNumber: accountInfo.sequence_number,
    });

    return true;
  } catch (error: any) {
    logError(`Failed to connect wallet: ${error.message}`);
    addResult("Wallet Connection", "fail", error.message);
    return false;
  }
}

// Test 2: SIWA Authentication
async function testSIWAAuth(account: any) {
  logTest("SIWA (Sign In With Aptos) Authentication");

  try {
    // Create SIWA message
    const domain = "verifi.network";
    const statement = "Sign in to VeriFi Protocol";
    const uri = "https://verifi.network";
    const chainId = networkName === "mainnet" ? 1 : 2;
    const nonce = Math.random().toString(36).substring(2, 15);
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const message = `${domain} wants you to sign in with your Aptos account:
${account.accountAddress}

${statement}

URI: ${uri}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;

    logInfo("SIWA Message created");
    logDebug("Message", message);

    // Sign the message
    const messageBytes = new TextEncoder().encode(message);
    const signature = account.sign(messageBytes);

    logSuccess("Message signed successfully");
    logInfo(`Signature: ${signature.toString().substring(0, 20)}...`);

    // Verify signature locally (simulate backend verification)
    const publicKey = account.publicKey;
    const isValid = publicKey.verifySignature({
      message: messageBytes,
      signature: signature,
    });

    if (isValid) {
      logSuccess("SIWA signature verified successfully");
      addResult("SIWA Authentication", "pass", undefined, {
        nonce,
        signature: signature.toString().substring(0, 40) + "...",
        verified: true,
      });
      return { success: true, nonce };
    } else {
      throw new Error("Signature verification failed");
    }
  } catch (error: any) {
    logError(`SIWA authentication failed: ${error.message}`);
    addResult("SIWA Authentication", "fail", error.message);
    return { success: false };
  }
}

// Test 3: Session Key Creation
async function testSessionKeyCreation(aptos: Aptos, account: any) {
  logTest("Session Key Creation");

  try {
    // First, try to revoke any existing session
    try {
      const checkResult = await aptos.view<[boolean, string, string, string, string]>({
        payload: {
          function: `${MODULE_ADDRESS}::session_key_mockup::get_session`,
          functionArguments: [account.accountAddress.toString()],
        },
      });

      if (checkResult[0]) {
        logInfo("Found existing session, revoking it first...");
        const revokeTxn = await aptos.transaction.build.simple({
          sender: account.accountAddress,
          data: {
            function: `${MODULE_ADDRESS}::session_key_mockup::revoke_session`,
            functionArguments: [],
          },
        });

        const revokePendingTx = await aptos.signAndSubmitTransaction({
          signer: account,
          transaction: revokeTxn,
        });

        await aptos.waitForTransaction({
          transactionHash: revokePendingTx.hash,
        });

        logSuccess("Existing session revoked");
      }
    } catch (e) {
      // No existing session, continue
      logDebug("No existing session found", e);
    }
    // Generate ephemeral key pair with expiry
    const expiryDateSecs = Math.floor(Date.now() / 1000) + 3600; // 1 hour (as number for TypeScript)
    const expiryDateSecsBigInt = BigInt(expiryDateSecs); // BigInt version for EphemeralKeyPair
    const ephemeralKeyPair = EphemeralKeyPair.generate({
      expiryDateSecs: expiryDateSecsBigInt as any, // Type assertion needed
    });

    logInfo(`Ephemeral key pair generated with nonce: ${ephemeralKeyPair.nonce}`);

    // Get public key in correct formats
    const publicKey = ephemeralKeyPair.getPublicKey();
    const fullPublicKeyBytes = publicKey.toUint8Array();

    logDebug("Full public key length", fullPublicKeyBytes.length);
    logDebug("First few bytes", Array.from(fullPublicKeyBytes.slice(0, 4)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));

    // Handle both 33 and 34 byte formats
    let rawPublicKeyBytes: number[];

    if (fullPublicKeyBytes.length === 33 && fullPublicKeyBytes[0] === 0x00) {
      // Standard Ed25519 with scheme byte (33 bytes total: 0x00 + 32 bytes)
      logInfo("Standard Ed25519 format detected (33 bytes with scheme byte 0x00)");
      rawPublicKeyBytes = Array.from(fullPublicKeyBytes.slice(1));
    } else if (fullPublicKeyBytes.length === 34) {
      // Extended format (might have extra byte)
      logInfo("Extended format detected (34 bytes) - removing first 2 bytes");
      rawPublicKeyBytes = Array.from(fullPublicKeyBytes.slice(2));
    } else if (fullPublicKeyBytes.length === 32) {
      // Already raw 32 bytes
      logInfo("Raw 32-byte format detected");
      rawPublicKeyBytes = Array.from(fullPublicKeyBytes);
    } else {
      throw new Error(`Unexpected public key length: ${fullPublicKeyBytes.length}`);
    }

    logSuccess(`Public key processed: ${rawPublicKeyBytes.length} bytes for contract`);
    logDebug("Raw public key (hex)", "0x" + Buffer.from(rawPublicKeyBytes).toString("hex"));

    // Create session on-chain
    const maxAmountPerTrade = "1000000"; // 0.01 APT
    const durationSeconds = 3600; // 1 hour

    logInfo("Submitting session creation transaction...");

    const txn = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::session_key_mockup::create_session`,
        functionArguments: [
          rawPublicKeyBytes, // 32 bytes for Move
          maxAmountPerTrade,
          durationSeconds,
        ],
      },
    });

    const pendingTx = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: txn,
    });

    const txResult = await aptos.waitForTransaction({
      transactionHash: pendingTx.hash,
    });

    if (txResult.success) {
      logSuccess(`Session created on-chain: ${pendingTx.hash}`);

      // Store session info (simulate localStorage)
      const sessionInfo = {
        nonce: ephemeralKeyPair.nonce,
        publicKey: "0x" + Buffer.from(fullPublicKeyBytes).toString("hex"),
        publicKeyRaw: "0x" + Buffer.from(rawPublicKeyBytes).toString("hex"),
        expiresAt: Number(expiryDateSecsBigInt), // Convert back to number for storage
        maxAmountPerTrade,
        userAddress: account.accountAddress.toString(),
      };

      logInfo("Session info stored (simulating localStorage)");
      logDebug("Session info", sessionInfo);

      addResult("Session Key Creation", "pass", undefined, {
        txHash: pendingTx.hash,
        nonce: ephemeralKeyPair.nonce,
        expiresAt: new Date(Number(expiryDateSecsBigInt) * 1000).toISOString(),
      });

      return { success: true, ephemeralKeyPair, sessionInfo };
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error: any) {
    logError(`Session key creation failed: ${error.message}`);
    addResult("Session Key Creation", "fail", error.message);
    return { success: false };
  }
}

// Test 4: Verify Session Exists
async function testVerifySession(aptos: Aptos, account: any) {
  logTest("Verify Session Exists");

  try {
    const result = await aptos.view<[boolean, string, string, string, string]>({
      payload: {
        function: `${MODULE_ADDRESS}::session_key_mockup::get_session`,
        functionArguments: [account.accountAddress.toString()],
      },
    });

    const [isActive, publicKey, maxAmount, expiresAt, totalSpent] = result;

    if (isActive) {
      logSuccess("Session verified on-chain");
      logInfo(`Max amount per trade: ${maxAmount}`);
      logInfo(`Expires at: ${new Date(Number(expiresAt) * 1000).toISOString()}`);
      logInfo(`Total spent: ${totalSpent}`);
      logDebug("Session data", { isActive, publicKey, maxAmount, expiresAt, totalSpent });

      addResult("Verify Session", "pass", undefined, {
        isActive,
        maxAmount,
        expiresAt: new Date(Number(expiresAt) * 1000).toISOString(),
        totalSpent,
      });

      return { success: true, sessionData: { publicKey, maxAmount, expiresAt } };
    } else {
      throw new Error("Session not active");
    }
  } catch (error: any) {
    logError(`Session verification failed: ${error.message}`);
    addResult("Verify Session", "fail", error.message);
    return { success: false };
  }
}

// Test 5: Execute Transaction with Session Key
async function testSessionTransaction(aptos: Aptos, account: any, ephemeralKeyPair?: EphemeralKeyPair) {
  logTest("Session-Based Transaction");

  if (!ephemeralKeyPair) {
    logError("No ephemeral key pair provided");
    addResult("Session Transaction", "fail", "No ephemeral key pair");
    return false;
  }

  try {
    // Prepare transaction parameters
    const amount = "100000"; // 0.001 APT
    const isBuy = true;
    const nonce = Date.now();

    // Construct BCS message (must match contract)
    const serializer = new Serializer();
    AccountAddress.fromString(account.accountAddress.toString()).serialize(serializer);
    serializer.serializeU64(BigInt(amount));
    serializer.serializeBool(isBuy);
    serializer.serializeU64(BigInt(nonce));

    const message = serializer.toUint8Array();

    logInfo("Message constructed for signing");
    logDebug("Message params", { userAddress: account.accountAddress.toString(), amount, isBuy, nonce });

    // Sign with ephemeral key
    const signature = ephemeralKeyPair.sign(message);
    const signatureUint8Array = signature.toUint8Array();

    logInfo("Message signed with session key");
    logDebug("Raw signature length", signatureUint8Array.length);
    logDebug("First few signature bytes", Array.from(signatureUint8Array.slice(0, 4)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));

    // Aptos Ed25519 requires EXACTLY 64 bytes (no scheme byte, no prefix)
    let signatureBytes: number[];

    if (signatureUint8Array.length === 64) {
      // Perfect - raw Ed25519 signature (standard format)
      signatureBytes = Array.from(signatureUint8Array);
      logSuccess("Raw 64-byte Ed25519 signature (correct format)");
    } else if (signatureUint8Array.length === 65) {
      // Has scheme byte prefix (0x00 for Ed25519) - remove it
      signatureBytes = Array.from(signatureUint8Array.slice(1));
      logInfo(`Removed scheme byte (0x${signatureUint8Array[0].toString(16)}) from 65-byte signature`);
    } else if (signatureUint8Array.length > 64) {
      // Has extra bytes - try to extract the 64-byte signature
      const offset = signatureUint8Array.length - 64;
      signatureBytes = Array.from(signatureUint8Array.slice(offset));
      logInfo(`Extracted 64 bytes from ${signatureUint8Array.length}-byte signature (offset: ${offset})`);
    } else {
      // Less than 64 bytes - this is an error
      throw new Error(`Signature too short: ${signatureUint8Array.length} bytes, need exactly 64`);
    }

    // Validate final signature length
    if (signatureBytes.length !== 64) {
      throw new Error(`Invalid signature length: ${signatureBytes.length}, must be exactly 64 bytes for Ed25519`);
    }

    logDebug("Final signature length", signatureBytes.length);
    logDebug("First 8 signature bytes", Array.from(signatureBytes.slice(0, 8)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));

    // Execute trade with session
    logInfo("Submitting session-based transaction...");

    const txn = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::session_key_mockup::execute_trade_with_session`,
        functionArguments: [
          account.accountAddress.toString(),
          amount,
          isBuy,
          nonce,
          signatureBytes,
        ],
      },
    });

    const pendingTx = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: txn,
    });

    const txResult = await aptos.waitForTransaction({
      transactionHash: pendingTx.hash,
    });

    if (txResult.success) {
      logSuccess(`Session transaction executed: ${pendingTx.hash}`);

      addResult("Session Transaction", "pass", undefined, {
        txHash: pendingTx.hash,
        amount,
        isBuy,
        nonce,
      });

      return true;
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error: any) {
    logError(`Session transaction failed: ${error.message}`);
    logDebug("Error details", error);
    addResult("Session Transaction", "fail", error.message);
    return false;
  }
}

// Test 6: Revoke Session
async function testRevokeSession(aptos: Aptos, account: any) {
  logTest("Session Revocation");

  try {
    logInfo("Submitting session revocation...");

    const txn = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::session_key_mockup::revoke_session`,
        functionArguments: [],
      },
    });

    const pendingTx = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction: txn,
    });

    const txResult = await aptos.waitForTransaction({
      transactionHash: pendingTx.hash,
    });

    if (txResult.success) {
      logSuccess(`Session revoked: ${pendingTx.hash}`);

      // Verify session is revoked
      const result = await aptos.view<[boolean, string, string, string, string]>({
        payload: {
          function: `${MODULE_ADDRESS}::session_key_mockup::get_session`,
          functionArguments: [account.accountAddress.toString()],
        },
      });

      const [isActive] = result;

      if (!isActive) {
        logSuccess("Session successfully revoked and verified");
        addResult("Session Revocation", "pass", undefined, { txHash: pendingTx.hash });
        return true;
      } else {
        throw new Error("Session still active after revocation");
      }
    } else {
      throw new Error("Revocation transaction failed");
    }
  } catch (error: any) {
    logError(`Session revocation failed: ${error.message}`);
    addResult("Session Revocation", "fail", error.message);
    return false;
  }
}

// Print test summary
function printSummary() {
  console.log(`${colors.bold}${colors.blue}\n📊 Test Summary\n${colors.reset}`);

  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const total = results.length;

  console.log(`${colors.gray}${"─".repeat(60)}${colors.reset}`);

  results.forEach(result => {
    const icon = result.status === "pass" ? "✅" : "❌";
    const color = result.status === "pass" ? colors.green : colors.red;
    console.log(`${color}${icon} ${result.test}${colors.reset}`);
    if (result.error) {
      console.log(`${colors.gray}   Error: ${result.error}${colors.reset}`);
    }
    if (result.data) {
      Object.entries(result.data).forEach(([key, value]) => {
        console.log(`${colors.gray}   ${key}: ${value}${colors.reset}`);
      });
    }
  });

  console.log(`${colors.gray}${"─".repeat(60)}${colors.reset}`);

  const scoreColor = passed === total ? colors.green : failed === 0 ? colors.yellow : colors.red;
  console.log(`${scoreColor}\nScore: ${passed}/${total} tests passed${colors.reset}`);

  if (failed > 0) {
    console.log(`${colors.red}${failed} test(s) failed${colors.reset}`);
  }

  // Save results to file
  const resultsFile = path.join(process.cwd(), "test-auth-results.json");
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    network: networkName,
    account: trader1Account.accountAddress.toString(),
    summary: { passed, failed, total },
    results,
  }, null, 2));

  console.log(`${colors.gray}\nResults saved to: ${resultsFile}${colors.reset}`);
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}\n💥 Unexpected error:${colors.reset}`, error);
  process.exit(1);
});