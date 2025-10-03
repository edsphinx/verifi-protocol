"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useTappMode } from "../context/TappModeContext";
import { calculateAddLiquidity, calculateRemoveLiquidity } from "../cpmm";
import { toast } from "sonner";
import { Serializer } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/aptos/client";
import { TAPP_PROTOCOL_ADDRESS } from "../constants";
import { NETWORK } from "@/aptos/constants";
import { getTxExplorerLink, truncateHash } from "@/aptos/helpers";

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
 * Serializes add liquidity arguments for Tapp router
 */
function serializeAddLiquidityArgs(
  poolAddr: string,
  amountYes: number,
  amountNo: number,
  minLpTokens: number,
): Uint8Array {
  const parts: Uint8Array[] = [];

  // 1. Serialize pool address (32 bytes)
  const AccountAddress = require("@aptos-labs/ts-sdk").AccountAddress;
  parts.push(AccountAddress.from(poolAddr).toUint8Array());

  // 2. Serialize Option<address> = None (0 = None, 1 = Some)
  parts.push(new Uint8Array([0])); // None - no existing position

  // 3. Serialize amount_yes as u64 (little-endian)
  const yesBytes = new ArrayBuffer(8);
  new DataView(yesBytes).setBigUint64(0, BigInt(Math.floor(amountYes)), true);
  parts.push(new Uint8Array(yesBytes));

  // 4. Serialize amount_no as u64 (little-endian)
  const noBytes = new ArrayBuffer(8);
  new DataView(noBytes).setBigUint64(0, BigInt(Math.floor(amountNo)), true);
  parts.push(new Uint8Array(noBytes));

  // 5. Serialize min_lp_tokens as u64 (little-endian)
  const minBytes = new ArrayBuffer(8);
  new DataView(minBytes).setBigUint64(0, BigInt(Math.floor(minLpTokens)), true);
  parts.push(new Uint8Array(minBytes));

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

  console.log('[useAddLiquidity] Executing add liquidity with params:', params);

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
  console.log('[useAddLiquidity] Using pool address:', poolAddress);

  // Calculate minimum LP tokens (allow 0.5% slippage)
  const minLpTokens = Math.floor(Math.sqrt(params.yesAmount * params.noAmount) * 0.995);

  // Serialize add liquidity arguments
  const liquidityArgs = serializeAddLiquidityArgs(
    poolAddress,
    params.yesAmount,
    params.noAmount,
    minLpTokens
  );

  console.log('[useAddLiquidity] Serialized args length:', liquidityArgs.length);

  // Build transaction payload
  const payload = {
    function: `${TAPP_PROTOCOL_ADDRESS}::router::add_liquidity`,
    functionArguments: [liquidityArgs],
  };

  console.log('[useAddLiquidity] Submitting transaction...');

  // Sign and submit
  const response = await signAndSubmitTransaction({
    sender: account.address,
    data: payload,
  });

  console.log('[useAddLiquidity] Transaction submitted:', response.hash);

  // Wait for confirmation
  const txResponse = await aptosClient().waitForTransaction({
    transactionHash: response.hash,
    options: {
      timeoutSecs: 60,
      waitForIndexer: true,
    },
  });

  console.log('[useAddLiquidity] Transaction confirmed');

  // Parse LiquidityAdded event to get actual values
  // For now, using expected values
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
      const explorerLink = getTxExplorerLink(data.txHash, NETWORK);
      const message = `Position: ${data.positionIdx}, LP Tokens: ${data.lpTokens.toFixed(2)}`;

      toast.success("Liquidity added successfully!", {
        description: `${message}\n\nView transaction: ${truncateHash(data.txHash)}`,
        action: {
          label: "View TX",
          onClick: () => window.open(explorerLink, "_blank"),
        },
        duration: 10000,
      });

      // Force refetch immediately after adding liquidity
      queryClient.refetchQueries({
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
 * Calculate add liquidity preview
 * NOTE: This is NOT a React hook, just a helper function
 */
export function calculateAddLiquidityPreview(
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
 * Calculate remove liquidity preview
 * NOTE: This is NOT a React hook, just a helper function
 */
export function calculateRemoveLiquidityPreview(
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
