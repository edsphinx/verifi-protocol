"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useTappMode } from "../context/TappModeContext";
import { calculateSwapOutput } from "../cpmm";
import { toast } from "sonner";
import { Serializer } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/aptos/client";
import { TAPP_PROTOCOL_ADDRESS } from "../constants";

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

  // Get pool address (for now, using marketId)
  // TODO: Implement proper pool address derivation from Tapp
  const poolAddress = params.marketId;

  // Serialize swap parameters using BCS
  const serializer = new Serializer();
  serializer.serializeU64(BigInt(Math.floor(params.amountIn)));
  serializer.serializeBool(params.yesToNo);
  serializer.serializeU64(BigInt(Math.floor(params.minAmountOut)));
  const bcsStream = serializer.toUint8Array();

  // Build transaction payload
  const payload = {
    function: `${TAPP_PROTOCOL_ADDRESS}::pool::swap`,
    typeArguments: [], // YES and NO token types would go here
    functionArguments: [poolAddress, Array.from(bcsStream)],
  };

  // Sign and submit transaction
  const response = await signAndSubmitTransaction({
    sender: account.address,
    data: payload,
  });

  // Wait for transaction confirmation
  const txResponse = await aptosClient().waitForTransaction({
    transactionHash: response.hash,
    options: {
      timeoutSecs: 60,
      waitForIndexer: true,
    },
  });

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
      toast.success("Swap successful!", {
        description: `Transaction hash: ${data.txHash.slice(0, 10)}...`,
      });

      // Invalidate pool data to refetch
      queryClient.invalidateQueries({
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
 * Hook to calculate swap output (preview)
 */
export function useSwapPreview(
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
