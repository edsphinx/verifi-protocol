"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useTappMode } from "../context/TappModeContext";
import { calculateAddLiquidity, calculateRemoveLiquidity } from "../cpmm";
import { toast } from "sonner";
import { Serializer } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/aptos/client";
import { TAPP_PROTOCOL_ADDRESS } from "../constants";

interface AddLiquidityParams {
  marketId: string;
  yesAmount: number;
  noAmount: number;
  positionIdx?: number;
}

interface RemoveLiquidityParams {
  marketId: string;
  lpTokens: number;
  positionIdx: number;
}

/**
 * Simulates adding liquidity in DEMO mode
 */
async function simulateAddLiquidity(params: AddLiquidityParams) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    lpTokens: Math.sqrt(params.yesAmount * params.noAmount),
    positionIdx: params.positionIdx ?? Date.now() % 1000,
    txHash: `0xdemo_add_${Date.now()}`,
  };
}

/**
 * Executes real add liquidity on-chain
 */
async function executeAddLiquidity(
  params: AddLiquidityParams,
  signAndSubmitTransaction: any,
  account: any,
) {

  if (!account?.address) {
    throw new Error("Wallet not connected");
  }

  const poolAddress = params.marketId;

  // Serialize add liquidity parameters
  const serializer = new Serializer();
  serializer.serializeU64(BigInt(Math.floor(params.yesAmount)));
  serializer.serializeU64(BigInt(Math.floor(params.noAmount)));
  const bcsStream = serializer.toUint8Array();

  // Build transaction payload
  const payload = {
    function: `${TAPP_PROTOCOL_ADDRESS}::pool::add_liquidity`,
    typeArguments: [],
    functionArguments: [
      poolAddress,
      params.positionIdx !== undefined ? [params.positionIdx] : [],
      Array.from(bcsStream),
    ],
  };

  // Sign and submit
  const response = await signAndSubmitTransaction({
    sender: account.address,
    data: payload,
  });

  // Wait for confirmation
  const txResponse = await aptosClient().waitForTransaction({
    transactionHash: response.hash,
    options: {
      timeoutSecs: 60,
      waitForIndexer: true,
    },
  });

  // TODO: Parse LiquidityAdded event for actual values
  return {
    success: true,
    lpTokens: Math.sqrt(params.yesAmount * params.noAmount),
    positionIdx: params.positionIdx ?? Date.now() % 1000,
    txHash: response.hash,
  };
}

/**
 * Simulates removing liquidity in DEMO mode
 */
async function simulateRemoveLiquidity(params: RemoveLiquidityParams) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    yesAmount: params.lpTokens * 0.5, // Simplified
    noAmount: params.lpTokens * 0.5,
    txHash: `0xdemo_remove_${Date.now()}`,
  };
}

/**
 * Executes real remove liquidity on-chain
 */
async function executeRemoveLiquidity(
  params: RemoveLiquidityParams,
  signAndSubmitTransaction: any,
  account: any,
) {
  if (!account?.address) {
    throw new Error("Wallet not connected");
  }

  const poolAddress = params.marketId;

  // Serialize remove liquidity parameters
  const serializer = new Serializer();
  serializer.serializeU64(BigInt(Math.floor(params.lpTokens)));
  const bcsStream = serializer.toUint8Array();

  // Build transaction payload
  const payload = {
    function: `${TAPP_PROTOCOL_ADDRESS}::pool::remove_liquidity`,
    typeArguments: [],
    functionArguments: [poolAddress, params.positionIdx, Array.from(bcsStream)],
  };

  // Sign and submit
  const response = await signAndSubmitTransaction({
    sender: account.address,
    data: payload,
  });

  // Wait for confirmation
  const txResponse = await aptosClient().waitForTransaction({
    transactionHash: response.hash,
    options: {
      timeoutSecs: 60,
      waitForIndexer: true,
    },
  });

  // TODO: Parse LiquidityRemoved event for actual values
  return {
    success: true,
    yesAmount: params.lpTokens * 0.5,
    noAmount: params.lpTokens * 0.5,
    txHash: response.hash,
  };
}

/**
 * Hook for adding liquidity (demo or live)
 */
export function useAddLiquidity() {
  const { isDemo } = useTappMode();
  const { signAndSubmitTransaction, account } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddLiquidityParams) => {
      if (isDemo) {
        return await simulateAddLiquidity(params);
      } else {
        return await executeAddLiquidity(
          params,
          signAndSubmitTransaction,
          account,
        );
      }
    },
    onSuccess: (data, variables) => {
      toast.success("Liquidity added successfully!", {
        description: `Position: ${data.positionIdx}, LP Tokens: ${data.lpTokens.toFixed(2)}`,
      });

      queryClient.invalidateQueries({
        queryKey: ["pool-data", variables.marketId],
      });
    },
    onError: (error: Error) => {
      toast.error("Add liquidity failed", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook for removing liquidity (demo or live)
 */
export function useRemoveLiquidity() {
  const { isDemo } = useTappMode();
  const { signAndSubmitTransaction, account } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RemoveLiquidityParams) => {
      if (isDemo) {
        return await simulateRemoveLiquidity(params);
      } else {
        return await executeRemoveLiquidity(
          params,
          signAndSubmitTransaction,
          account,
        );
      }
    },
    onSuccess: (data, variables) => {
      toast.success("Liquidity removed successfully!", {
        description: `Received: ${data.yesAmount.toFixed(2)} YES + ${data.noAmount.toFixed(2)} NO`,
      });

      queryClient.invalidateQueries({
        queryKey: ["pool-data", variables.marketId],
      });
    },
    onError: (error: Error) => {
      toast.error("Remove liquidity failed", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to calculate add liquidity preview
 */
export function useAddLiquidityPreview(
  yesAmount: number,
  noAmount: number,
  yesReserve: number,
  noReserve: number,
  totalLpSupply: number,
) {
  if (yesAmount <= 0 || noAmount <= 0) {
    return null;
  }

  try {
    const result = calculateAddLiquidity(
      yesAmount,
      noAmount,
      yesReserve,
      noReserve,
      totalLpSupply,
    );

    return {
      lpTokens: result.lpTokens,
      shareOfPool: result.shareOfPool,
      finalYesAmount: result.yesAmount,
      finalNoAmount: result.noAmount,
    };
  } catch (error) {
    console.error("Add liquidity preview error:", error);
    return null;
  }
}

/**
 * Hook to calculate remove liquidity preview
 */
export function useRemoveLiquidityPreview(
  lpTokens: number,
  yesReserve: number,
  noReserve: number,
  totalLpSupply: number,
) {
  if (lpTokens <= 0) {
    return null;
  }

  try {
    const result = calculateRemoveLiquidity(
      lpTokens,
      yesReserve,
      noReserve,
      totalLpSupply,
    );

    return {
      yesAmount: result.yesAmount,
      noAmount: result.noAmount,
      shareOfPool: result.shareOfPool,
    };
  } catch (error) {
    console.error("Remove liquidity preview error:", error);
    return null;
  }
}
