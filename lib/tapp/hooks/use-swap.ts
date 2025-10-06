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
import { recordActivity } from "@/lib/services/activity-client.service";

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
 * CRITICAL: Hook expects amount_in FIRST, then yes_to_no boolean
 * Format: pool_addr + [amount_in, yes_to_no, min_amount_out] for hook
 */
function serializeSwapArgs(
  poolAddr: string,
  yesToNo: boolean,
  amountIn: number,
  minAmountOut: number,
): Uint8Array {
  const { AccountAddress } = require("@aptos-labs/ts-sdk");
  const serializer = new Serializer();

  // 1. Argument for router: pool address (32 bytes)
  serializer.serializeFixedBytes(AccountAddress.from(poolAddr).toUint8Array());

  // 2. Arguments for hook (CORRECT ORDER!)
  // Hook expects: amount_in (u64), yes_to_no (bool), min_amount_out (u64)

  // 2a. Serialize amount_in as u64
  // YES/NO tokens have 6 decimals, so multiply by 10^6
  serializer.serializeU64(BigInt(Math.floor(amountIn * 1_000_000)));

  // 2b. Serialize yes_to_no as bool
  // CRITICAL FIX: Invert the boolean because the router interprets it opposite to our UI
  // When UI shows YES → NO (yesToNo = true), router needs false to swap assets[0] → assets[1]
  serializer.serializeBool(!yesToNo);

  // 2c. Serialize min_amount_out as u64
  // YES/NO tokens have 6 decimals, so multiply by 10^6
  serializer.serializeU64(BigInt(Math.floor(minAmountOut * 1_000_000)));

  return serializer.toUint8Array();
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

  console.log("[useSwap] Executing swap with params:", params);
  console.log(
    "[useSwap] yesToNo flag:",
    params.yesToNo,
    "| Meaning:",
    params.yesToNo ? "YES → NO" : "NO → YES",
  );

  // Get pool address from API
  const poolResponse = await fetch(
    `/api/tapp/pools/by-market/${params.marketId}`,
  );
  if (!poolResponse.ok) {
    throw new Error("No AMM pool found for this market. Create a pool first.");
  }

  const poolData = await poolResponse.json();
  if (!poolData || !poolData.poolAddress) {
    throw new Error("Invalid pool data received");
  }

  const poolAddress = poolData.poolAddress;
  console.log("[useSwap] Using pool address:", poolAddress);

  // Serialize swap arguments
  const swapArgs = serializeSwapArgs(
    poolAddress,
    params.yesToNo,
    params.amountIn,
    params.minAmountOut,
  );

  console.log("[useSwap] Serialized args length:", swapArgs.length);

  // Build transaction payload
  const payload = {
    function: `${TAPP_PROTOCOL_ADDRESS}::router::swap`,
    functionArguments: [swapArgs],
  };

  console.log("[useSwap] Submitting transaction...");

  // Sign and submit transaction
  const response = await signAndSubmitTransaction({
    sender: account.address,
    data: payload,
  });

  console.log("[useSwap] Transaction submitted:", response.hash);

  // Wait for transaction confirmation
  const txResponse = await aptosClient().waitForTransaction({
    transactionHash: response.hash,
    options: {
      timeoutSecs: 60,
      waitForIndexer: true,
    },
  });

  console.log("[useSwap] Transaction confirmed");

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
    onSuccess: async (data, variables) => {
      const explorerLink = getTxExplorerLink(data.txHash, NETWORK);
      const direction = variables.yesToNo ? "YES → NO" : "NO → YES";

      toast.success("Swap successful!", {
        description: `Swapped ${direction}: received ${data.amountOut.toFixed(4)} tokens\n\nView transaction: ${truncateHash(data.txHash)}`,
        action: {
          label: "View TX",
          onClick: () => window.open(explorerLink, "_blank"),
        },
        duration: 15000,
      });

      if (!isDemo && account?.address) {
        await recordActivity({
          txHash: data.txHash,
          marketAddress: variables.marketId,
          userAddress: account.address.toString(),
          action: "SWAP",
          outcome: direction,
          amount: variables.amountIn,
          price: data.amountOut / variables.amountIn,
          totalValue: variables.amountIn,
        });
      }

      // Wait a bit for indexer to catch up
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refetch pool data to update reserves
      queryClient.refetchQueries({
        queryKey: ["pool-data", variables.marketId],
      });

      // Refetch market data to update user's YES/NO token balances
      // CRITICAL: Must use "marketData" key, not "marketDetails"
      queryClient.invalidateQueries({
        queryKey: ["marketData"],
      });

      console.log("[useSwap] Refetched pool and market data after swap");
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

    console.log("[calculateSwapPreview] Swap calculation:", {
      direction: yesToNo ? "YES → NO" : "NO → YES",
      amountIn,
      inputReserve,
      outputReserve,
      reserveRatio: `${inputReserve.toFixed(2)} : ${outputReserve.toFixed(2)}`,
    });

    const result = calculateSwapOutput(amountIn, inputReserve, outputReserve);

    console.log("[calculateSwapPreview] Result:", {
      outputAmount: result.outputAmount,
      priceImpact: result.priceImpact.toFixed(2) + "%",
      outputVsReserve: `${result.outputAmount.toFixed(6)} / ${outputReserve.toFixed(6)} = ${((result.outputAmount / outputReserve) * 100).toFixed(2)}%`,
    });

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
