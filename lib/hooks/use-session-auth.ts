"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { aptosClient } from "@/aptos/client";
import { MODULE_ADDRESS } from "@/aptos/constants";
import { EphemeralKeyPair } from "@aptos-labs/ts-sdk";
import {
  getLocalEphemeralKeyPair,
  storeEphemeralKeyPair,
  removeEphemeralKeyPair,
  getLocalEphemeralKeyPairs,
} from "./use-ephemeral-keypair";

const SESSION_INFO_STORAGE_KEY = "verifi_session_info";

interface SessionInfo {
  nonce: string;
  publicKey: string; // Full public key bytes from SDK (hex string with 0x prefix) - may be 32, 33, or 34 bytes
  publicKeyRaw: string; // Raw 32-byte Ed25519 public key (hex string with 0x prefix) - used for contract
  expiresAt: number;
  maxAmountPerTrade: string;
  userAddress: string;
}

export function useSessionAuth() {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [hasSession, setHasSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Check if session exists in localStorage and is valid
  const checkLocalSession = useCallback(() => {
    if (!account?.address) return false;

    try {
      const storedInfo = localStorage.getItem(SESSION_INFO_STORAGE_KEY);
      if (!storedInfo) {
        setHasSession(false);
        setSessionInfo(null);
        return false;
      }

      const info: SessionInfo = JSON.parse(storedInfo);

      // Check if session is expired
      if (Date.now() / 1000 > info.expiresAt) {
        localStorage.removeItem(SESSION_INFO_STORAGE_KEY);
        removeEphemeralKeyPair(info.nonce);
        setHasSession(false);
        setSessionInfo(null);
        return false;
      }

      // Check if session belongs to current user
      if (info.userAddress !== account.address.toString()) {
        localStorage.removeItem(SESSION_INFO_STORAGE_KEY);
        removeEphemeralKeyPair(info.nonce);
        setHasSession(false);
        setSessionInfo(null);
        return false;
      }

      // Validate ephemeral key pair exists
      const ephemeralKeyPair = getLocalEphemeralKeyPair(info.nonce);
      if (!ephemeralKeyPair) {
        localStorage.removeItem(SESSION_INFO_STORAGE_KEY);
        setHasSession(false);
        setSessionInfo(null);
        return false;
      }

      setHasSession(true);
      setSessionInfo(info);
      return true;
    } catch (error) {
      console.error("Error checking local session:", error);
      setHasSession(false);
      setSessionInfo(null);
      return false;
    }
  }, [account?.address]);

  // Check on-chain session status
  const checkOnChainSession = useCallback(async () => {
    if (!account?.address) return false;

    try {
      const result = await aptosClient().view<
        [boolean, string, string, string, string]
      >({
        payload: {
          function: `${MODULE_ADDRESS}::session_key_mockup::get_session`,
          functionArguments: [account.address.toString()],
        },
      });

      const [isActive, publicKey, maxAmount, expiresAt, _totalSpent] = result;

      if (!isActive) {
        return false;
      }

      // Verify localStorage session matches on-chain
      const storedInfo = localStorage.getItem(SESSION_INFO_STORAGE_KEY);
      if (storedInfo) {
        const info: SessionInfo = JSON.parse(storedInfo);
        // Compare with raw public key (32 bytes) that's stored on-chain
        if (info.publicKeyRaw === publicKey) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking on-chain session:", error);
      return false;
    }
  }, [account?.address]);

  // Create new session using EphemeralKeyPair
  const createSession = useCallback(
    async (maxAmountPerTrade: string, durationSeconds: number) => {
      if (!account?.address) {
        toast.error("Please connect your wallet first");
        return false;
      }

      setIsCreatingSession(true);
      try {
        // Generate new ephemeral key pair with expiry
        const expiryDateSecs = BigInt(
          Math.floor(Date.now() / 1000) + durationSeconds
        );
        const ephemeralKeyPair = EphemeralKeyPair.generate({
          expiryDateSecs: Number(expiryDateSecs),
        });

        // Store ephemeral key pair in localStorage
        storeEphemeralKeyPair(ephemeralKeyPair);

        // Get public key in correct formats (matches working test pattern)
        const publicKey = ephemeralKeyPair.getPublicKey();
        const fullPublicKeyBytes = publicKey.toUint8Array();

        // Handle both 33 and 34 byte formats
        let rawPublicKeyBytes: number[];

        if (fullPublicKeyBytes.length === 33 && fullPublicKeyBytes[0] === 0x00) {
          // Standard Ed25519 with scheme byte (33 bytes total: 0x00 + 32 bytes)
          rawPublicKeyBytes = Array.from(fullPublicKeyBytes.slice(1));
        } else if (fullPublicKeyBytes.length === 34) {
          // Extended format (might have extra byte)
          rawPublicKeyBytes = Array.from(fullPublicKeyBytes.slice(2));
        } else if (fullPublicKeyBytes.length === 32) {
          // Already raw 32 bytes
          rawPublicKeyBytes = Array.from(fullPublicKeyBytes);
        } else {
          throw new Error(`Invalid Ed25519 public key length: ${fullPublicKeyBytes.length}, expected 32, 33, or 34 bytes`);
        }

        // Submit transaction to store session on-chain with RAW 32 bytes
        const response = await signAndSubmitTransaction({
          sender: account.address,
          data: {
            function: `${MODULE_ADDRESS}::session_key_mockup::create_session`,
            functionArguments: [
              rawPublicKeyBytes, // 32 bytes for Move contract
              maxAmountPerTrade,
              durationSeconds,
            ],
          },
        });

        await aptosClient().waitForTransaction({
          transactionHash: response.hash,
        });

        // Store session info with public key (matches working test pattern)
        const sessionInfoData: SessionInfo = {
          nonce: ephemeralKeyPair.nonce,
          publicKey: "0x" + Buffer.from(fullPublicKeyBytes).toString("hex"), // Full key bytes for reference
          publicKeyRaw: "0x" + Buffer.from(rawPublicKeyBytes).toString("hex"), // Raw 32 bytes
          expiresAt: Number(expiryDateSecs),
          maxAmountPerTrade,
          userAddress: account.address.toString(),
        };

        localStorage.setItem(
          SESSION_INFO_STORAGE_KEY,
          JSON.stringify(sessionInfoData)
        );

        setHasSession(true);
        setSessionInfo(sessionInfoData);

        toast.success(
          "Session created! You can now execute trades without signing each time"
        );
        return true;
      } catch (error: any) {
        console.error("Session creation error:", error);
        toast.error(error.message || "Failed to create session");
        return false;
      } finally {
        setIsCreatingSession(false);
      }
    },
    [account, signAndSubmitTransaction]
  );

  // Revoke session
  const revokeSession = useCallback(async () => {
    if (!account?.address) return false;

    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::session_key_mockup::revoke_session`,
          functionArguments: [],
        },
      });

      await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });

      // Clear localStorage
      const storedInfo = localStorage.getItem(SESSION_INFO_STORAGE_KEY);
      if (storedInfo) {
        const info: SessionInfo = JSON.parse(storedInfo);
        removeEphemeralKeyPair(info.nonce);
      }
      localStorage.removeItem(SESSION_INFO_STORAGE_KEY);

      setHasSession(false);
      setSessionInfo(null);

      toast.success("Session revoked");
      return true;
    } catch (error: any) {
      console.error("Session revocation error:", error);
      toast.error(error.message || "Failed to revoke session");
      return false;
    }
  }, [account, signAndSubmitTransaction]);

  // Get ephemeral key pair for signing
  const getEphemeralKeyPair = useCallback((): EphemeralKeyPair | null => {
    try {
      const storedInfo = localStorage.getItem(SESSION_INFO_STORAGE_KEY);
      if (!storedInfo) return null;

      const info: SessionInfo = JSON.parse(storedInfo);
      return getLocalEphemeralKeyPair(info.nonce);
    } catch (error) {
      console.error("Error getting ephemeral key pair:", error);
      return null;
    }
  }, []);

  // Clear session on wallet disconnect
  useEffect(() => {
    if (!connected) {
      setHasSession(false);
      setSessionInfo(null);
    } else {
      checkLocalSession();
    }
  }, [connected, checkLocalSession]);

  return {
    hasSession,
    sessionInfo,
    isCreatingSession,
    createSession,
    revokeSession,
    checkLocalSession,
    checkOnChainSession,
    getEphemeralKeyPair,
  };
}
