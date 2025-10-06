"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { aptosClient } from "@/aptos/client";
import { useSessionAuth } from "@/lib/hooks/use-session-auth";
import type { InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";
import { AccountAuthenticatorEd25519, Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature, Serializer, AccountAddress } from "@aptos-labs/ts-sdk";

interface SessionTradeParams {
  amount: string;
  isBuy: boolean;
  nonce?: number;
}

export function useSessionTransaction() {
  const { account, signAndSubmitTransaction } = useWallet();
  const { hasSession, getEphemeralKeyPair } = useSessionAuth();

  /**
   * Construct BCS-serialized message for session signature
   * Must match contract's construct_session_message function
   */
  const constructSessionMessage = useCallback(
    (userAddress: string, amount: string, isBuy: boolean, nonce: number): Uint8Array => {
      const serializer = new Serializer();

      // Serialize user_address (address)
      AccountAddress.fromString(userAddress).serialize(serializer);

      // Serialize amount (u64)
      serializer.serializeU64(BigInt(amount));

      // Serialize is_buy (bool)
      serializer.serializeBool(isBuy);

      // Serialize nonce (u64)
      serializer.serializeU64(BigInt(nonce));

      return serializer.toUint8Array();
    },
    []
  );

  /**
   * Sign a message using the ephemeral key pair
   */
  const signWithSessionKey = useCallback(
    (message: Uint8Array): Uint8Array | null => {
      const ephemeralKeyPair = getEphemeralKeyPair();
      if (!ephemeralKeyPair) {
        toast.error("Ephemeral key pair not found");
        return null;
      }

      const signature = ephemeralKeyPair.sign(message);
      return signature.toUint8Array();
    },
    [getEphemeralKeyPair]
  );

  /**
   * Submit a transaction using normal wallet signature
   */
  const submitTransaction = useCallback(
    async (
      payload: InputGenerateTransactionPayloadData
    ): Promise<{ hash: string }> => {
      if (!account?.address) {
        throw new Error("Wallet not connected");
      }

      // Use normal wallet signing
      return await signAndSubmitTransaction({
        sender: account.address,
        data: payload,
      });
    },
    [account, signAndSubmitTransaction]
  );

  /**
   * Execute a trade using session key signature
   * NOTE: In production, this would be called by a backend/relayer
   * Here we still need user signature for the transaction itself
   */
  const executeTradeWithSession = useCallback(
    async (
      moduleAddress: string,
      params: SessionTradeParams
    ): Promise<{ success: boolean; hash?: string; error?: string }> => {
      if (!account?.address) {
        return { success: false, error: "Wallet not connected" };
      }

      if (!hasSession) {
        return { success: false, error: "No active session" };
      }

      try {
        // Generate nonce (in production, backend would manage this)
        const nonce = params.nonce ?? Date.now();

        // Construct message using BCS serialization
        const message = constructSessionMessage(
          account.address.toString(),
          params.amount,
          params.isBuy,
          nonce
        );

        // Sign with session private key
        const signatureBytes = signWithSessionKey(message);
        if (!signatureBytes) {
          return { success: false, error: "Failed to sign with session key" };
        }

        // Execute trade
        const response = await signAndSubmitTransaction({
          sender: account.address,
          data: {
            function: `${moduleAddress}::session_key_mockup::execute_trade_with_session`,
            functionArguments: [
              account.address.toString(),
              params.amount,
              params.isBuy,
              nonce,
              Array.from(signatureBytes),
            ],
          },
        });

        await aptosClient().waitForTransaction({
          transactionHash: response.hash,
        });

        return { success: true, hash: response.hash };
      } catch (error: any) {
        console.error("Session trade execution error:", error);
        return { success: false, error: error.message || "Transaction failed" };
      }
    },
    [account, hasSession, constructSessionMessage, signWithSessionKey, signAndSubmitTransaction]
  );

  /**
   * Generic function to execute any transaction with session signature
   * Useful for extending to other session-based operations
   */
  const executeWithSession = useCallback(
    async <T extends Record<string, any>>(
      moduleAddress: string,
      functionName: string,
      messageParams: T,
      txParams: any[]
    ): Promise<{ success: boolean; hash?: string; error?: string }> => {
      if (!account?.address) {
        return { success: false, error: "Wallet not connected" };
      }

      if (!hasSession) {
        return { success: false, error: "No active session" };
      }

      try {
        // Construct message for signing
        const serializer = new Serializer();

        // Serialize each parameter according to its type
        for (const [key, value] of Object.entries(messageParams)) {
          if (typeof value === "string" && value.startsWith("0x")) {
            // Address type
            AccountAddress.fromString(value).serialize(serializer);
          } else if (typeof value === "number" || typeof value === "bigint") {
            // u64 type
            serializer.serializeU64(BigInt(value));
          } else if (typeof value === "boolean") {
            // bool type
            serializer.serializeBool(value);
          }
          // Add more types as needed
        }

        const message = serializer.toUint8Array();

        // Sign with session key
        const signatureBytes = signWithSessionKey(message);
        if (!signatureBytes) {
          return { success: false, error: "Failed to sign with session key" };
        }

        // Execute transaction
        const response = await signAndSubmitTransaction({
          sender: account.address,
          data: {
            function: `${moduleAddress}::${functionName}` as `${string}::${string}::${string}`,
            functionArguments: [...txParams, Array.from(signatureBytes)],
          },
        });

        await aptosClient().waitForTransaction({
          transactionHash: response.hash,
        });

        return { success: true, hash: response.hash };
      } catch (error: any) {
        console.error("Session transaction error:", error);
        return { success: false, error: error.message || "Transaction failed" };
      }
    },
    [account, hasSession, signWithSessionKey, signAndSubmitTransaction]
  );

  return {
    submitTransaction,
    executeTradeWithSession,
    executeWithSession,
    constructSessionMessage,
    signWithSessionKey,
    hasSession,
  };
}
