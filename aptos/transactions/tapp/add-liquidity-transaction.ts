/**
 * @file Transaction builder for adding liquidity to Tapp pools
 * @dev Builds transaction payloads for the Tapp router add_liquidity function
 */

import { AccountAddress } from "@aptos-labs/ts-sdk";
import type { AddLiquidityTransactionArgs } from "@/lib/interfaces";

const TAPP_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

/**
 * Serializes add_liquidity arguments for Tapp router
 * @param poolAddr Pool address
 * @param amountYes Amount of YES tokens to add
 * @param amountNo Amount of NO tokens to add
 * @param minLpTokens Minimum LP tokens to receive (slippage protection)
 * @returns Serialized bytes for add_liquidity call
 */
function serializeAddLiquidityArgs(
  poolAddr: string,
  amountYes: number,
  amountNo: number,
  minLpTokens: number,
): Uint8Array {
  const parts: Uint8Array[] = [];

  // 1. Serialize pool address (32 bytes)
  parts.push(AccountAddress.from(poolAddr).toUint8Array());

  // 2. Serialize Option<address> for position_addr (None = 0x00)
  parts.push(new Uint8Array([0x00]));

  // 3. Serialize amount_yes as u64
  const yesBytes = new ArrayBuffer(8);
  new DataView(yesBytes).setBigUint64(0, BigInt(amountYes), true);
  parts.push(new Uint8Array(yesBytes));

  // 4. Serialize amount_no as u64
  const noBytes = new ArrayBuffer(8);
  new DataView(noBytes).setBigUint64(0, BigInt(amountNo), true);
  parts.push(new Uint8Array(noBytes));

  // 5. Serialize min_lp_tokens as u64
  const minBytes = new ArrayBuffer(8);
  new DataView(minBytes).setBigUint64(0, BigInt(minLpTokens), true);
  parts.push(new Uint8Array(minBytes));

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
 * Builds a transaction to add liquidity to a Tapp pool
 * @param args Liquidity parameters
 * @returns Transaction payload for add_liquidity
 */
export function buildAddLiquidityTransaction(
  args: AddLiquidityTransactionArgs,
) {
  const minLpTokens = args.minLpTokens || 0;

  const liquidityArgs = serializeAddLiquidityArgs(
    args.poolAddress,
    args.amountYes,
    args.amountNo,
    minLpTokens,
  );

  return {
    function:
      `${TAPP_ADDRESS}::router::add_liquidity` as `${string}::${string}::${string}`,
    functionArguments: [liquidityArgs],
  };
}
