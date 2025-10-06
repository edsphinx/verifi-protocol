"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSIWAAuth } from "@/lib/hooks/use-siwa-auth";
import { useSessionAuth } from "@/lib/hooks/use-session-auth";
import { Loader2 } from "lucide-react";

const DEFAULT_MAX_AMOUNT = "10000000"; // 0.1 APT
const DEFAULT_DURATION = 86400 * 7; // 7 days

export function UnifiedAuthButton() {
  const { connected, account } = useWallet();
  const { signIn, isAuthenticating, isAuthenticated } = useSIWAAuth();
  const {
    hasSession,
    createSession,
    isCreatingSession,
    checkLocalSession,
    checkOnChainSession,
  } = useSessionAuth();

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [maxAmount, setMaxAmount] = useState(DEFAULT_MAX_AMOUNT);
  const [durationDays, setDurationDays] = useState("7");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAttemptedSessionCreation, setHasAttemptedSessionCreation] = useState(false);

  // Check session status on mount and when connection changes
  useEffect(() => {
    if (connected && account?.address) {
      checkLocalSession();
    }
  }, [connected, account?.address, checkLocalSession]);

  // Auto-create session key after successful SIWA authentication
  useEffect(() => {
    console.log("🔍 UnifiedAuthButton state:", {
      isAuthenticated,
      hasSession,
      isCreatingSession,
      hasAttemptedSessionCreation,
      connected,
      hasAddress: !!account?.address,
    });

    // Session auto-creation disabled
    // const autoCreateSession = async () => {
    //   if (
    //     isAuthenticated &&
    //     !hasSession &&
    //     !isCreatingSession &&
    //     !hasAttemptedSessionCreation &&
    //     connected &&
    //     account?.address
    //   ) {
    //     setHasAttemptedSessionCreation(true);
    //     console.log("🔑 Auto-creating session key after SIWA authentication...");

    //     try {
    //       const durationSeconds = Number.parseInt(durationDays) * 86400;
    //       const success = await createSession(maxAmount, durationSeconds);

    //       if (success) {
    //         toast.success("Session key created! You can now trade without signing each transaction.");
    //       } else {
    //         console.warn("Session creation returned false");
    //       }
    //     } catch (error) {
    //       console.error("Auto session creation failed:", error);
    //       // Don't show error toast - user can manually create later
    //     }
    //   }
    // };

    // autoCreateSession();

    // Reset attempt flag when disconnected
    if (!connected || !isAuthenticated) {
      setHasAttemptedSessionCreation(false);
    }
  }, [
    isAuthenticated,
    hasSession,
    isCreatingSession,
    hasAttemptedSessionCreation,
    connected,
    account?.address,
    createSession,
    maxAmount,
    durationDays,
  ]);

  const handleUnifiedAuth = async () => {
    if (!connected || !account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: SIWA Sign In
      if (!isAuthenticated) {
        const signInSuccess = await signIn();
        if (!signInSuccess) {
          toast.error("Sign-in failed");
          setIsProcessing(false);
          return;
        }
      }

      // Step 2: Check if session already exists
      const hasLocalSession = checkLocalSession();
      if (hasLocalSession) {
        const onChainValid = await checkOnChainSession();
        if (onChainValid) {
          toast.success("You already have an active session!");
          setIsProcessing(false);
          return;
        }
      }

      // Step 3: Create session key
      const durationSeconds = Number.parseInt(durationDays) * 86400;
      const sessionCreated = await createSession(maxAmount, durationSeconds);

      if (sessionCreated) {
        toast.success("Full authentication complete! 🎉");
        setShowConfigDialog(false);
      }
    } catch (error: any) {
      console.error("Unified auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't show anything if not connected
  if (!connected || !account?.address) {
    return null;
  }

  // Show status based on authentication state
  if (isAuthenticating || isCreatingSession) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Setting up...</span>
      </div>
    );
  }

  if (isAuthenticated && hasSession) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span>Ready to trade</span>
      </div>
    );
  }

  // Everything happens automatically now, just show status
  return null;
}
