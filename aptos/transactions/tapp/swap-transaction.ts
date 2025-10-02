/**
 * @file Transaction builder for swapping tokens in Tapp pools
 * @dev Builds transaction payloads for the Tapp router swap function
 */

import { AccountAddress } from "@aptos-labs/ts-sdk";
import type { SwapTransactionArgs } from "@/lib/interfaces";

const TAPP_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

/**
 * Serializes swap arguments for Tapp router
 * @param poolAddr Pool address
 * @param yesToNo True if swapping YES→NO, false for NO→YES
 * @param amountIn Amount of input tokens
 * @param minAmountOut Minimum output tokens (slippage protection)
 * @returns Serialized bytes for swap call
 */
function serializeSwapArgs(
  poolAddr: string,
  yesToNo: boolean,
  amountIn: number,
  minAmountOut: number
): Uint8Array {
  const parts: Uint8Array[] = [];

  // 1. Serialize pool address (32 bytes)
  parts.push(AccountAddress.from(poolAddr).toUint8Array());

  // 2. Serialize a2b as bool (YES→NO = true)
  parts.push(new Uint8Array([yesToNo ? 1 : 0]));

  // 3. Serialize amount_in as u64
  const inBytes = new ArrayBuffer(8);
  new DataView(inBytes).setBigUint64(0, BigInt(amountIn), true);
  parts.push(new Uint8Array(inBytes));

  // 4. Serialize min_amount_out as u64
  const outBytes = new ArrayBuffer(8);
  new DataView(outBytes).setBigUint64(0, BigInt(minAmountOut), true);
  parts.push(new Uint8Array(outBytes));

  // Concatenate
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
 * Builds a transaction to swap tokens in a Tapp pool
 * @param args Swap parameters
 * @returns Transaction payload for swap
 */
export function buildSwapTransaction(args: SwapTransactionArgs) {
  const minAmountOut = args.minAmountOut || 0;

  const swapArgs = serializeSwapArgs(
    args.poolAddress,
    args.fromYes,
    args.amountIn,
    minAmountOut
  );

  return {
    function: `${TAPP_ADDRESS}::router::swap` as `${string}::${string}::${string}`,
    functionArguments: [swapArgs],
  };
}
