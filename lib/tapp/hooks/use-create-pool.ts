"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aptosClient } from "@/aptos/client";
import { TAPP_PROTOCOL_ADDRESS } from "../constants";
import { useTappMode } from "../context/TappModeContext";

interface CreatePoolParams {
  marketId: string;
  yesTokenAddress: string;
  noTokenAddress: string;
}

const HOOK_PREDICTION = 4; // VeriFi prediction market hook type
const BASE_FEE = 3000; // 0.3% (3000 basis points)

/**
 * Simulates pool creation in DEMO mode
 */
async function simulateCreatePool(params: CreatePoolParams) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    success: true,
    poolAddress: `0xdemo_pool_${Date.now()}`,
    txHash: `0xdemo_${Date.now()}`,
  };
}

/**
 * Serializes create_pool arguments for Tapp router
 * Format: [hook_type (u8), assets_length (uleb128), asset1 (32 bytes), asset2 (32 bytes), fee (u64)]
 */
function serializeCreatePoolArgs(
  hookType: number,
  yesTokenAddr: string,
  noTokenAddr: string,
  fee: number,
): Uint8Array {
  const parts: Uint8Array[] = [];

  // 1. Serialize hook_type as u8
  parts.push(new Uint8Array([hookType]));

  // 2. Serialize vector<address> length as uleb128 (2 items)
  parts.push(new Uint8Array([2])); // length = 2

  // 3. Serialize first address (YES token) - 32 bytes
  const AccountAddress = require("@aptos-labs/ts-sdk").AccountAddress;
  parts.push(AccountAddress.from(yesTokenAddr).toUint8Array());

  // 4. Serialize second address (NO token) - 32 bytes
  parts.push(AccountAddress.from(noTokenAddr).toUint8Array());

  // 5. Serialize fee as u64 (little-endian, 8 bytes)
  const feeBytes = new ArrayBuffer(8);
  const feeView = new DataView(feeBytes);
  feeView.setBigUint64(0, BigInt(fee), true); // little-endian
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
 * Executes real pool creation on-chain
 */
async function executeCreatePool(
  params: CreatePoolParams,
  signAndSubmitTransaction: any,
  account: any,
) {
  if (!account?.address) {
    throw new Error("Wallet not connected");
  }

  console.log("[useCreatePool] Creating pool with params:", params);

  // Validate token addresses
  if (!params.yesTokenAddress || !params.noTokenAddress) {
    throw new Error(
      "Invalid token addresses. Market may not have YES/NO tokens yet.",
    );
  }

  // Serialize pool creation arguments
  const poolArgs = serializeCreatePoolArgs(
    HOOK_PREDICTION,
    params.yesTokenAddress,
    params.noTokenAddress,
    BASE_FEE,
  );

  console.log("[useCreatePool] Serialized args length:", poolArgs.length);
  console.log("[useCreatePool] Hook type:", HOOK_PREDICTION);
  console.log("[useCreatePool] YES token:", params.yesTokenAddress);
  console.log("[useCreatePool] NO token:", params.noTokenAddress);
  console.log("[useCreatePool] Fee:", BASE_FEE, "basis points (0.3%)");

  // Build transaction payload
  const payload = {
    function: `${TAPP_PROTOCOL_ADDRESS}::router::create_pool`,
    functionArguments: [poolArgs],
  };

  console.log("[useCreatePool] Submitting transaction...");

  // Sign and submit transaction
  const response = await signAndSubmitTransaction({
    sender: account.address,
    data: payload,
  });

  console.log("[useCreatePool] Transaction submitted:", response.hash);

  // Wait for transaction confirmation
  const txResponse = await aptosClient().waitForTransaction({
    transactionHash: response.hash,
    options: {
      timeoutSecs: 60,
      waitForIndexer: true,
    },
  });

  console.log("[useCreatePool] Transaction confirmed");

  // Parse PoolCreated event to get pool address
  let poolAddress: string | undefined;

  if ("events" in txResponse && Array.isArray(txResponse.events)) {
    const poolCreatedEvent = txResponse.events.find(
      (e: any) => e.type === `${TAPP_PROTOCOL_ADDRESS}::router::PoolCreated`,
    );

    if (poolCreatedEvent && poolCreatedEvent.data) {
      poolAddress = poolCreatedEvent.data.pool_addr;
      console.log("[useCreatePool] Pool created at address:", poolAddress);
    }
  }

  if (!poolAddress) {
    console.warn("[useCreatePool] Could not extract pool address from events");
  }

  return {
    success: true,
    poolAddress: poolAddress || "unknown",
    txHash: response.hash,
  };
}

/**
 * Hook for creating AMM pools (demo or live)
 */
export function useCreatePool() {
  const { isDemo } = useTappMode();
  const { signAndSubmitTransaction, account } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePoolParams) => {
      if (isDemo) {
        return await simulateCreatePool(params);
      } else {
        return await executeCreatePool(
          params,
          signAndSubmitTransaction,
          account,
        );
      }
    },
    onSuccess: async (data, variables) => {
      toast.success("AMM Pool created successfully!", {
        description: `Pool address: ${data.poolAddress.slice(0, 10)}...`,
      });

      // Save pool to database
      try {
        const response = await fetch(
          `/api/tapp/pools/by-market/${variables.marketId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              poolAddress: data.poolAddress,
              yesTokenAddress: variables.yesTokenAddress,
              noTokenAddress: variables.noTokenAddress,
              creatorAddress: account?.address?.toString() || data.poolAddress,
            }),
          }
        );

        if (response.ok) {
          console.log("[useCreatePool] Pool saved to database");
        } else {
          console.warn("[useCreatePool] Failed to save pool to database");
        }
      } catch (error) {
        console.error("[useCreatePool] Error saving pool to database:", error);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["pool-data", variables.marketId],
      });

      // Invalidate market pools list
      queryClient.invalidateQueries({
        queryKey: ["market-pools"],
      });
    },
    onError: (error: Error) => {
      toast.error("Pool creation failed", {
        description: error.message,
      });
    },
  });
}
