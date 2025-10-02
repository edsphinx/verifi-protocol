/**
 * @file Transaction builder for creating Tapp AMM pools
 * @dev Builds transaction payloads for the Tapp router create_pool function
 */

import { AccountAddress } from "@aptos-labs/ts-sdk";
import type { CreatePoolTransactionArgs } from "@/lib/interfaces";

const TAPP_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
const HOOK_PREDICTION = 4; // Prediction market hook type

/**
 * Serializes create_pool arguments for Tapp router
 * @param yesTokenAddr YES token metadata address
 * @param noTokenAddr NO token metadata address
 * @param fee Fee in basis points (e.g., 3000 = 0.3%)
 * @returns Serialized bytes for create_pool call
 */
function serializeCreatePoolArgs(
  yesTokenAddr: string,
  noTokenAddr: string,
  fee: number
): Uint8Array {
  const parts: Uint8Array[] = [];

  // 1. Serialize hook_type as u8
  parts.push(new Uint8Array([HOOK_PREDICTION]));

  // 2. Serialize vector<address> length as uleb128 (2 items)
  parts.push(new Uint8Array([2]));

  // 3. Serialize YES token address (32 bytes)
  parts.push(AccountAddress.from(yesTokenAddr).toUint8Array());

  // 4. Serialize NO token address (32 bytes)
  parts.push(AccountAddress.from(noTokenAddr).toUint8Array());

  // 5. Serialize fee as u64 (little-endian, 8 bytes)
  const feeBytes = new ArrayBuffer(8);
  const feeView = new DataView(feeBytes);
  feeView.setBigUint64(0, BigInt(fee), true);
  parts.push(new Uint8Array(feeBytes));

  // Concatenate all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

/**
 * Builds a transaction to create a Tapp AMM pool for a prediction market
 * @param args Pool creation parameters
 * @returns Transaction payload for create_pool
 */
export function buildCreatePoolTransaction(args: CreatePoolTransactionArgs) {
  const fee = args.fee || 3000; // Default to 0.3%

  const poolArgs = serializeCreatePoolArgs(
    args.yesTokenAddress,
    args.noTokenAddress,
    fee
  );

  return {
    function: `${TAPP_ADDRESS}::router::create_pool` as `${string}::${string}::${string}`,
    functionArguments: [poolArgs],
  };
}
