"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useTappMode } from "../context/TappModeContext";
import { calculateAddLiquidity, calculateRemoveLiquidity } from "../cpmm";
import { toast } from "sonner";
import { Serializer } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/aptos/client";
import {
  TAPP_PROTOCOL_ADDRESS,
  TAPP_HOOK_MODULE,
  TAPP_FUNCTIONS,
} from "../constants";
import { NETWORK } from "@/aptos/constants";
import { getTxExplorerLink, truncateHash } from "@/aptos/helpers";
import { recordActivity } from "@/lib/services/activity-client.service";

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
    poolAddress: `0xdemo_pool_${params.marketId}`,
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
  // YES/NO tokens have 6 decimals, so multiply by 10^6
  const yesBytes = new ArrayBuffer(8);
  new DataView(yesBytes).setBigUint64(
    0,
    BigInt(Math.floor(amountYes * 1_000_000)),
    true,
  );
  parts.push(new Uint8Array(yesBytes));

  // 4. Serialize amount_no as u64 (little-endian)
  // YES/NO tokens have 6 decimals, so multiply by 10^6
  const noBytes = new ArrayBuffer(8);
  new DataView(noBytes).setBigUint64(
    0,
    BigInt(Math.floor(amountNo * 1_000_000)),
    true,
  );
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

  console.log("[useAddLiquidity] Executing add liquidity with params:", params);

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
  console.log("[useAddLiquidity] Using pool address:", poolAddress);

  // Calculate minimum LP tokens (allow 0.5% slippage)
  // LP tokens also have 6 decimals
  const minLpTokens = Math.floor(
    Math.sqrt(params.yesAmount * params.noAmount) * 0.995 * 1_000_000,
  );

  // Serialize add liquidity arguments
  const liquidityArgs = serializeAddLiquidityArgs(
    poolAddress,
    params.yesAmount,
    params.noAmount,
    minLpTokens,
  );

  console.log(
    "[useAddLiquidity] Serialized args length:",
    liquidityArgs.length,
  );

  // Build transaction payload
  const payload = {
    function: `${TAPP_PROTOCOL_ADDRESS}::router::add_liquidity`,
    functionArguments: [liquidityArgs],
  };

  console.log("[useAddLiquidity] Submitting transaction...");

  // Sign and submit
  const response = await signAndSubmitTransaction({
    sender: account.address,
    data: payload,
  });

  console.log("[useAddLiquidity] Transaction submitted:", response.hash);

  // Wait for confirmation
  const txResponse = await aptosClient().waitForTransaction({
    transactionHash: response.hash,
    options: {
      timeoutSecs: 60,
      waitForIndexer: true,
    },
  });

  console.log("[useAddLiquidity] Transaction confirmed");

  // Parse LiquidityAdded event to get position index
  let positionIdx: number | null = null;
  const txData = txResponse as any;

  if (txData.events) {
    const liquidityAddedEvent = txData.events.find((event: any) =>
      event.type.includes("LiquidityAdded"),
    );

    if (liquidityAddedEvent?.data) {
      positionIdx = Number(liquidityAddedEvent.data.position_idx);
      console.log(
        `[useAddLiquidity] Position created with index: ${positionIdx}`,
      );

      // Store position ownership in localStorage
      try {
        const storageKey = `lp_positions_${poolAddress}`;
        const stored = localStorage.getItem(storageKey);
        const positions = stored ? JSON.parse(stored) : {};

        // Map position index to owner address
        positions[positionIdx] = account.address.toString();

        localStorage.setItem(storageKey, JSON.stringify(positions));
        console.log(
          `[useAddLiquidity] Stored position ${positionIdx} ownership for ${account.address}`,
        );
      } catch (error) {
        console.error(
          "[useAddLiquidity] Failed to store position ownership:",
          error,
        );
      }
    }
  }

  // Parse LiquidityAdded event to get actual values
  // For now, using expected values
  return {
    success: true,
    lpTokens: Math.sqrt(params.yesAmount * params.noAmount),
    positionIdx: positionIdx ?? Date.now() % 1000,
    txHash: response.hash,
    poolAddress, // Return pool address for activity recording
  };
}

/**
 * Simulates removing liquidity in DEMO mode
 */
async function simulateRemoveLiquidity(params: RemoveLiquidityParams) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    yesAmount: params.lpTokens * 0.5,
    noAmount: params.lpTokens * 0.5,
    txHash: `0xdemo_remove_${Date.now()}`,
    poolAddress: `0xdemo_pool_${params.marketId}`,
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

  // Get pool address from API
  const poolResponse = await fetch(
    `/api/tapp/pools/by-market/${params.marketId}`,
  );
  if (!poolResponse.ok) {
    throw new Error("No AMM pool found for this market.");
  }

  const poolData = await poolResponse.json();
  const poolAddress = poolData.poolAddress;

  // LP tokens have 6 decimals, convert to smallest units
  const lpTokensAmount = Math.floor(params.lpTokens * 1_000_000);

  // Build transaction payload - using Tapp hook function
  const payload = {
    function:
      `${TAPP_HOOK_MODULE}::${TAPP_FUNCTIONS.REMOVE_LIQUIDITY}` as `${string}::${string}::${string}`,
    typeArguments: [],
    functionArguments: [poolAddress, params.positionIdx, lpTokensAmount],
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
    poolAddress, // Return pool address for activity recording
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
    onSuccess: async (data, variables) => {
      const explorerLink = getTxExplorerLink(data.txHash, NETWORK);

      toast.success("Liquidity added successfully!", {
        description: `Added ${variables.yesAmount.toFixed(2)} YES + ${variables.noAmount.toFixed(2)} NO tokens\n\nView transaction: ${truncateHash(data.txHash)}`,
        action: {
          label: "View TX",
          onClick: () => window.open(explorerLink, "_blank"),
        },
        duration: 15000, // 15 seconds to give time to click
      });

      // Record activity in database (only in live mode)
      if (!isDemo && account?.address && data.poolAddress) {
        const totalValue = variables.yesAmount + variables.noAmount;
        await recordActivity({
          txHash: data.txHash,
          marketAddress: variables.marketId,
          userAddress: account.address.toString(),
          action: "LIQUIDITY_ADD",
          outcome: null,
          amount: data.lpTokens,
          price: null,
          totalValue,
          poolAddress: data.poolAddress,
          yesAmount: variables.yesAmount,
          noAmount: variables.noAmount,
          lpTokens: data.lpTokens,
        });
      }

      // Optimistically update the query cache with the new position
      if (!isDemo && account?.address) {
        const userAddress = account.address.toString();

        // Update the query with userAddress included in the key
        queryClient.setQueryData(
          ["pool-data", variables.marketId, userAddress, "live"],
          (oldData: any) => {
            if (!oldData) return oldData;

            console.log(
              "[useAddLiquidity] Optimistically updating cache with new position",
            );
            console.log("[useAddLiquidity] Old positions:", oldData.positions);

            // Calculate new reserves (in on-chain format: multiply by 10^6)
            const newYesReserve =
              oldData.yesReserve + variables.yesAmount * 1_000_000;
            const newNoReserve =
              oldData.noReserve + variables.noAmount * 1_000_000;

            // Calculate total LP supply in display format for UI consistency
            const newTotalLpSupplyDisplay = Math.sqrt(
              (newYesReserve / 1_000_000) * (newNoReserve / 1_000_000),
            );

            // Create a new position object from the transaction result
            // Store lpTokens in display format to match how UI components expect it
            const newPosition = {
              positionId: data.positionIdx,
              owner: userAddress,
              lpTokens: data.lpTokens, // Keep in display format for UI
              yesAmount: variables.yesAmount,
              noAmount: variables.noAmount,
              shareOfPool: (data.lpTokens / newTotalLpSupplyDisplay) * 100,
              valueUSD: variables.yesAmount + variables.noAmount,
              createdAt: Date.now(),
            };

            console.log("[useAddLiquidity] New position:", newPosition);

            // Store position in localStorage for persistence across page reloads
            try {
              const storageKey = `tapp_positions_${variables.marketId}_${userAddress}`;
              const existingPositions = JSON.parse(
                localStorage.getItem(storageKey) || "[]",
              );
              existingPositions.push(newPosition);
              localStorage.setItem(
                storageKey,
                JSON.stringify(existingPositions),
              );
              console.log("[useAddLiquidity] Saved position to localStorage");
            } catch (error) {
              console.error(
                "[useAddLiquidity] Failed to save to localStorage:",
                error,
              );
            }

            // Add the new position to the positions array and update reserves
            const updatedData = {
              ...oldData,
              yesReserve: newYesReserve,
              noReserve: newNoReserve,
              totalLiquidity: newYesReserve + newNoReserve,
              positions: [...(oldData.positions || []), newPosition],
            };

            console.log(
              "[useAddLiquidity] Updated positions:",
              updatedData.positions,
            );

            return updatedData;
          },
        );
      }

      // Don't refetch immediately - let the optimistic update stay
      // The user will see their position immediately
      // We'll only refetch after a delay to get fresh reserves
      setTimeout(() => {
        if (!isDemo && account?.address) {
          const userAddress = account.address.toString();
          const currentData = queryClient.getQueryData([
            "pool-data",
            variables.marketId,
            userAddress,
            "live",
          ]) as any;

          // Refetch to get fresh reserves but preserve the optimistic positions
          queryClient
            .refetchQueries({
              queryKey: ["pool-data", variables.marketId, userAddress, "live"],
              exact: true,
            })
            .then(() => {
              // After refetch, merge back the optimistic position if it's not in the fetched data
              const newData = queryClient.getQueryData([
                "pool-data",
                variables.marketId,
                userAddress,
                "live",
              ]) as any;
              if (newData && currentData?.positions) {
                // If the refetched data has empty positions, keep our optimistic ones
                if (!newData.positions || newData.positions.length === 0) {
                  queryClient.setQueryData(
                    ["pool-data", variables.marketId, userAddress, "live"],
                    {
                      ...newData,
                      positions: currentData.positions,
                    },
                  );
                }
              }
            });
        }
      }, 2000);
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
    onSuccess: async (data, variables) => {
      const explorerLink = getTxExplorerLink(data.txHash, NETWORK);

      toast.success("Liquidity removed successfully!", {
        description: `Received ${data.yesAmount.toFixed(2)} YES + ${data.noAmount.toFixed(2)} NO tokens\n\nView transaction: ${truncateHash(data.txHash)}`,
        action: {
          label: "View TX",
          onClick: () => window.open(explorerLink, "_blank"),
        },
        duration: 15000, // 15 seconds to give time to click
      });

      // Record activity in database (only in live mode)
      if (!isDemo && account?.address && data.poolAddress) {
        const totalValue = data.yesAmount + data.noAmount;
        await recordActivity({
          txHash: data.txHash,
          marketAddress: variables.marketId,
          userAddress: account.address.toString(),
          action: "LIQUIDITY_REMOVE",
          outcome: null,
          amount: variables.lpTokens,
          price: null,
          totalValue,
          poolAddress: data.poolAddress,
          yesAmount: data.yesAmount,
          noAmount: data.noAmount,
          lpTokens: variables.lpTokens,
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["pool-data", variables.marketId],
        exact: false, // Match all queries with this prefix
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
