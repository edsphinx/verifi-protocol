"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useTappMode } from "../context/TappModeContext";
import { calculateSwapOutput } from "../cpmm";
import { toast } from "sonner";
import { Serializer } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/aptos/client";
import { TAPP_PROTOCOL_ADDRESS } from "../constants";
import { NETWORK } from "@/aptos/constants";
import { getTxExplorerLink, truncateHash } from "@/aptos/helpers";

interface SwapParams {
  marketId: string;
  amountIn: number;
  yesToNo: boolean;
  minAmountOut: number;
}

/**
 * Simulates a swap in DEMO mode
 */
async function simulateSwap(params: SwapParams) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In demo mode, we just return success
  // In reality, this would update the mock data
  return {
    success: true,
    amountOut: params.amountIn * 0.997, // Simulate 0.3% fee
    txHash: `0xdemo_${Date.now()}`,
  };
}

/**
 * Serializes swap arguments for Tapp router
 */
function serializeSwapArgs(
  poolAddr: string,
  yesToNo: boolean,
  amountIn: number,
  minAmountOut: number,
): Uint8Array {
  const parts: Uint8Array[] = [];

  // 1. Serialize pool address (32 bytes)
  const AccountAddress = require("@aptos-labs/ts-sdk").AccountAddress;
  parts.push(AccountAddress.from(poolAddr).toUint8Array());

  // 2. Serialize a2b (YES to NO) as bool
  parts.push(new Uint8Array([yesToNo ? 1 : 0]));

  // 3. Serialize amount_in as u64 (little-endian)
  // YES/NO tokens have 6 decimals, so multiply by 10^6
  const inBytes = new ArrayBuffer(8);
  new DataView(inBytes).setBigUint64(0, BigInt(Math.floor(amountIn * 1_000_000)), true);
  parts.push(new Uint8Array(inBytes));

  // 4. Serialize min_amount_out as u64 (little-endian)
  // YES/NO tokens have 6 decimals, so multiply by 10^6
  const outBytes = new ArrayBuffer(8);
  new DataView(outBytes).setBigUint64(0, BigInt(Math.floor(minAmountOut * 1_000_000)), true);
  parts.push(new Uint8Array(outBytes));

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
 * Executes a real swap on-chain
 */
async function executeSwap(
  params: SwapParams,
  signAndSubmitTransaction: any,
  account: any,
) {

  if (!account?.address) {
    throw new Error("Wallet not connected");
  }

  console.log('[useSwap] Executing swap with params:', params);

  // Get pool address from API
  const poolResponse = await fetch(`/api/tapp/pools/by-market/${params.marketId}`);
  if (!poolResponse.ok) {
    throw new Error("No AMM pool found for this market. Create a pool first.");
  }

  const poolData = await poolResponse.json();
  if (!poolData || !poolData.poolAddress) {
    throw new Error("Invalid pool data received");
  }

  const poolAddress = poolData.poolAddress;
  console.log('[useSwap] Using pool address:', poolAddress);

  // Serialize swap arguments
  const swapArgs = serializeSwapArgs(
    poolAddress,
    params.yesToNo,
    params.amountIn,
    params.minAmountOut
  );

  console.log('[useSwap] Serialized args length:', swapArgs.length);

  // Build transaction payload
  const payload = {
    function: `${TAPP_PROTOCOL_ADDRESS}::router::swap`,
    functionArguments: [swapArgs],
  };

  console.log('[useSwap] Submitting transaction...');

  // Sign and submit transaction
  const response = await signAndSubmitTransaction({
    sender: account.address,
    data: payload,
  });

  console.log('[useSwap] Transaction submitted:', response.hash);

  // Wait for transaction confirmation
  const txResponse = await aptosClient().waitForTransaction({
    transactionHash: response.hash,
    options: {
      timeoutSecs: 60,
      waitForIndexer: true,
    },
  });

  console.log('[useSwap] Transaction confirmed');

  // Parse swap event to get actual output amount
  // For now, using expected amount
  return {
    success: true,
    amountOut: params.amountIn * 0.997, // Will be parsed from event
    txHash: response.hash,
  };
}

/**
 * Hook for executing swaps (demo or live)
 */
export function useSwap() {
  const { isDemo } = useTappMode();
  const { signAndSubmitTransaction, account } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SwapParams) => {
      if (isDemo) {
        return await simulateSwap(params);
      } else {
        return await executeSwap(params, signAndSubmitTransaction, account);
      }
    },
    onSuccess: (data, variables) => {
      const explorerLink = getTxExplorerLink(data.txHash, NETWORK);
      const direction = variables.yesToNo ? "YES → NO" : "NO → YES";

      toast.success("Swap successful!", {
        description: `Swapped ${direction}: received ${data.amountOut.toFixed(4)} tokens\n\nView transaction: ${truncateHash(data.txHash)}`,
        action: {
          label: "View TX",
          onClick: () => window.open(explorerLink, "_blank"),
        },
        duration: 15000, // 15 seconds to give time to click
      });

      // Force refetch immediately after swap
      queryClient.refetchQueries({
        queryKey: ["pool-data", variables.marketId],
      });
    },
    onError: (error: Error) => {
      toast.error("Swap failed", {
        description: error.message,
      });
    },
  });
}

/**
 * Calculate swap output (preview)
 * NOTE: This is NOT a React hook, just a helper function
 */
export function calculateSwapPreview(
  marketId: string,
  amountIn: number,
  yesToNo: boolean,
  yesReserve: number,
  noReserve: number,
) {
  if (amountIn <= 0) {
    return null;
  }

  try {
    const inputReserve = yesToNo ? yesReserve : noReserve;
    const outputReserve = yesToNo ? noReserve : yesReserve;

    const result = calculateSwapOutput(amountIn, inputReserve, outputReserve);

    return {
      outputAmount: result.outputAmount,
      priceImpact: result.priceImpact,
      effectivePrice: result.effectivePrice,
      fee: result.fee,
    };
  } catch (error) {
    console.error("Swap preview error:", error);
    return null;
  }
}
