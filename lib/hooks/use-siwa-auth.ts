"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AuthResult {
  success: boolean;
  address?: string;
  userId?: string;
  error?: string;
}

export function useSIWAAuth() {
  const { account, signIn: walletSignIn, connected, wallet } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/status", {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const { authenticated } = await response.json();
          setIsAuthenticated(authenticated);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };

    if (connected && account?.address) {
      checkAuth();
    }
  }, [connected, account?.address]);

  // Listen for authentication events from other components
  useEffect(() => {
    const handleAuthEvent = () => {
      setIsAuthenticated(true);
    };

    window.addEventListener("siwa-authenticated", handleAuthEvent);
    return () => window.removeEventListener("siwa-authenticated", handleAuthEvent);
  }, []);

  // Reset authentication state when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setIsAuthenticated(false);
      window.dispatchEvent(new Event("siwa-unauthenticated"));
    }
  }, [connected]);

  const signIn = async () => {
    if (!account || !walletSignIn) {
      toast.error("Please connect your wallet first");
      return false;
    }

    if (!wallet) {
      toast.error("No wallet detected");
      return false;
    }

    // Prevent concurrent sign-in attempts
    if (isAuthenticating) {
      console.warn("Sign-in already in progress");
      return false;
    }

    setIsAuthenticating(true);

    try {
      // 1. Get SIWA input from backend
      const inputResponse = await fetch("/api/auth/siwa/input", {
        method: "GET",
        credentials: "include", // Important: send cookies
      });

      if (!inputResponse.ok) {
        throw new Error("Failed to get sign-in input");
      }

      const { data: input } = await inputResponse.json();

      console.log("=== SIWA One-Click Flow ===");
      console.log("Input:", input);
      console.log("Wallet object:", wallet);
      console.log("Wallet name:", wallet?.name);

      // 2. Call wallet's native signIn() method (one click!)
      // The wallet adapter's signIn needs the wallet name
      const walletName = wallet?.name;
      if (!walletName) {
        throw new Error("Wallet name not found");
      }

      const output = await walletSignIn({
        walletName,
        input
      });

      console.log("Output:", output);

      if (typeof output !== "object") {
        throw new Error("Invalid sign-in response from wallet");
      }

      // 3. Serialize the output properly (wallet adapter returns objects with .toString() methods)
      const outputAny = output as any; // Type compatibility between different wallet-standard versions
      const serializedOutput = {
        version: "2" as const,
        type: outputAny.type,
        signature: outputAny.signature?.toString() || outputAny.signature,
        publicKey: outputAny.account?.publicKey?.toString() || outputAny.publicKey?.toString(),
        input: {
          address: outputAny.input.address || outputAny.account?.address?.toString(),
          nonce: outputAny.input.nonce,
          domain: outputAny.input.domain,
          uri: outputAny.input.uri,
          statement: outputAny.input.statement,
          version: outputAny.input.version,
          chainId: outputAny.input.chainId,
        },
      };

      console.log("Serialized output:", serializedOutput);

      // 4. Send output to backend for verification
      const callbackResponse = await fetch("/api/auth/siwa/callback", {
        method: "POST",
        credentials: "include", // Important: receive cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output: serializedOutput }),
      });

      if (!callbackResponse.ok) {
        const errorData = await callbackResponse.json();
        console.error("SIWA callback failed:", errorData);
        throw new Error(errorData.error || "Failed to verify sign-in");
      }

      const result: AuthResult = await callbackResponse.json();

      if (result.success) {
        setIsAuthenticated(true);
        // Dispatch event so other components can react
        window.dispatchEvent(new Event("siwa-authenticated"));
        toast.success("Successfully signed in!");
        setIsAuthenticating(false);
        return true;
      } else {
        setIsAuthenticating(false);
        throw new Error(result.error || "Authentication failed");
      }
    } catch (error) {
      console.error("SIWA authentication error:", error);
      toast.error(
        error instanceof Error ? error.message : "Authentication failed",
      );
      setIsAuthenticating(false);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setIsAuthenticated(false);
      window.dispatchEvent(new Event("siwa-unauthenticated"));
      toast.success("Signed out");
    } catch (error) {
      console.error("Sign out error:", error);
      setIsAuthenticated(false);
      window.dispatchEvent(new Event("siwa-unauthenticated"));
    }
  };

  return {
    signIn,
    signOut,
    isAuthenticating,
    isAuthenticated,
    connected,
  };
}
