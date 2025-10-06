import { NextResponse } from "next/server";
import { Account, Ed25519PrivateKey, Serializer, AccountAddress, generateRawTransaction } from "@aptos-labs/ts-sdk";
import { MODULE_ADDRESS } from "@/aptos/constants";

// Relayer account that sponsors transactions
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const NETWORK = process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet";
const APTOS_NODE_URL = NETWORK === "testnet"
  ? "https://api.testnet.aptoslabs.com/v1"
  : "https://api.devnet.aptoslabs.com/v1";

if (!RELAYER_PRIVATE_KEY) {
  console.warn("⚠️  RELAYER_PRIVATE_KEY not set - signless transactions will not work");
}

/**
 * Relay endpoint for signless session transactions
 * Frontend sends: user address, session signature, trade params
 * Backend signs and submits transaction on user's behalf
 *
 * Uses direct HTTP calls to Aptos RPC instead of SDK to avoid bundling issues
 */
export async function POST(req: Request) {
  try {
    const { userAddress, amount, isBuy, nonce, signature } = await req.json();

    if (!RELAYER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Relayer not configured" },
        { status: 500 }
      );
    }

    // Format private key to AIP-80 standard
    const formattedKey = RELAYER_PRIVATE_KEY.startsWith("0x")
      ? RELAYER_PRIVATE_KEY
      : `0x${RELAYER_PRIVATE_KEY}`;

    const relayer = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(formattedKey),
    });

    console.log("🔄 Relaying transaction for user:", userAddress);
    console.log("📝 Relayer address:", relayer.accountAddress.toString());

    // Get account sequence number
    const accountRes = await fetch(`${APTOS_NODE_URL}/accounts/${relayer.accountAddress.toString()}`);
    if (!accountRes.ok) {
      throw new Error(`Failed to fetch account: ${accountRes.statusText}`);
    }
    const accountData = await accountRes.json();
    const sequenceNumber = accountData.sequence_number;

    // Get chain ID
    const chainRes = await fetch(`${APTOS_NODE_URL}/`);
    if (!chainRes.ok) {
      throw new Error(`Failed to fetch chain info: ${chainRes.statusText}`);
    }
    const chainData = await chainRes.json();
    const chainId = chainData.chain_id;

    // Build entry function payload
    const payload = {
      type: "entry_function_payload",
      function: `${MODULE_ADDRESS}::session_key_mockup::execute_trade_with_session`,
      type_arguments: [],
      arguments: [
        userAddress,
        amount.toString(),
        isBuy,
        nonce.toString(),
        signature,
      ],
    };

    // Encode transaction
    const rawTxn = await fetch(`${APTOS_NODE_URL}/transactions/encode_submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: relayer.accountAddress.toString(),
        sequence_number: sequenceNumber,
        max_gas_amount: "200000",
        gas_unit_price: "100",
        expiration_timestamp_secs: (Math.floor(Date.now() / 1000) + 600).toString(),
        payload,
      }),
    });

    if (!rawTxn.ok) {
      const error = await rawTxn.text();
      throw new Error(`Failed to encode transaction: ${error}`);
    }

    const rawTxnData = await rawTxn.json();
    const txnToSign = rawTxnData as Uint8Array;

    // Sign transaction
    const signature_obj = relayer.sign(txnToSign);

    // Submit signed transaction
    const submitRes = await fetch(`${APTOS_NODE_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: relayer.accountAddress.toString(),
        sequence_number: sequenceNumber,
        max_gas_amount: "200000",
        gas_unit_price: "100",
        expiration_timestamp_secs: (Math.floor(Date.now() / 1000) + 600).toString(),
        payload,
        signature: {
          type: "ed25519_signature",
          public_key: relayer.publicKey.toString(),
          signature: signature_obj.toString(),
        },
      }),
    });

    if (!submitRes.ok) {
      const error = await submitRes.text();
      throw new Error(`Failed to submit transaction: ${error}`);
    }

    const txnData = await submitRes.json();
    const txHash = txnData.hash;

    console.log("✅ Relayed transaction successful:", txHash);

    return NextResponse.json({
      success: true,
      hash: txHash,
      relayerAddress: relayer.accountAddress.toString(),
    });
  } catch (error: any) {
    console.error("Relay error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Relay failed",
      },
      { status: 500 }
    );
  }
}
