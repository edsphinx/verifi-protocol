"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessionAuth } from "@/lib/hooks/use-session-auth";
import { useSessionTransaction } from "@/lib/hooks/use-session-transaction";
import { aptosClient } from "@/aptos/client";
import { MODULE_ADDRESS } from "@/aptos/constants";
import { Loader2 } from "lucide-react";

export function SessionKeyMockupTest() {
  const { account } = useWallet();
  const {
    hasSession,
    sessionInfo,
    isCreatingSession,
    createSession,
    revokeSession,
    checkLocalSession,
  } = useSessionAuth();
  const { executeTradeWithSession } = useSessionTransaction();

  const [maxAmount, setMaxAmount] = useState("10000000"); // 0.1 APT
  const [durationDays, setDurationDays] = useState("7");
  const [tradeAmount, setTradeAmount] = useState("5000000"); // 0.05 APT
  const [isExecuting, setIsExecuting] = useState(false);
  const [onChainSession, setOnChainSession] = useState<any>(null);

  useEffect(() => {
    if (account?.address) {
      checkLocalSession();
      loadOnChainSession();
    }
  }, [account?.address, checkLocalSession]);

  const loadOnChainSession = async () => {
    if (!account?.address) return;

    try {
      const result = await aptosClient().view<
        [boolean, string, string, string, string]
      >({
        payload: {
          function: `${MODULE_ADDRESS}::session_key_mockup::get_session`,
          functionArguments: [account.address.toString()],
        },
      });

      const [isActive, publicKey, maxPerTrade, expiresAt, totalSpent] = result;
      setOnChainSession({
        isActive,
        publicKey,
        maxPerTrade,
        expiresAt,
        totalSpent,
      });
    } catch (error) {
      console.error("Error loading on-chain session:", error);
    }
  };

  const handleCreateSession = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    const durationSeconds = Number.parseInt(durationDays) * 86400;
    const success = await createSession(maxAmount, durationSeconds);

    if (success) {
      await loadOnChainSession();
    }
  };

  const handleRevoke = async () => {
    const success = await revokeSession();
    if (success) {
      await loadOnChainSession();
    }
  };

  const handleExecuteTradeWithSession = async () => {
    if (!MODULE_ADDRESS) {
      toast.error("Module address not configured");
      return;
    }
    setIsExecuting(true);
    try {
      const result = await executeTradeWithSession(MODULE_ADDRESS, {
        amount: tradeAmount,
        isBuy: true,
      });

      if (result.success) {
        toast.success(
          "Trade executed using session key! (Note: Still requires executor signature in this demo)"
        );
        await loadOnChainSession();
      } else {
        toast.error(result.error || "Trade execution failed");
      }
    } catch (error: any) {
      console.error("Trade execution error:", error);
      toast.error(error.message || "Trade execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Session Key Mockup Test</CardTitle>
        <CardDescription>
          Create a session key ONCE, then execute trades with session signatures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Create Session */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Step 1: Create Session Key
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a session key and store it on-chain (sign ONCE)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Max Amount Per Trade (octas)</Label>
            <Input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="10000000"
            />
            <p className="text-xs text-muted-foreground">
              1 APT = 100,000,000 octas
            </p>
          </div>

          <div className="space-y-2">
            <Label>Session Duration (days)</Label>
            <Input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="7"
              min="1"
              max="365"
            />
          </div>

          <Button
            onClick={handleCreateSession}
            disabled={isCreatingSession || !account?.address || hasSession}
            className="w-full"
          >
            {isCreatingSession ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Session...
              </>
            ) : (
              "Create Session Key"
            )}
          </Button>
        </div>

        {/* Session Status */}
        {hasSession && sessionInfo && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold">Local Session Info</h4>
            <div className="text-sm space-y-1 font-mono">
              <p>Public Key: {sessionInfo.publicKey.slice(0, 20)}...</p>
              <p>Max Per Trade: {sessionInfo.maxAmountPerTrade} octas</p>
              <p>
                Expires:{" "}
                {new Date(sessionInfo.expiresAt * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* On-chain Session Status */}
        {onChainSession && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold">On-Chain Session Status</h4>
            <div className="text-sm space-y-1">
              <p>Active: {onChainSession.isActive ? "✅ Yes" : "❌ No"}</p>
              {onChainSession.isActive && (
                <>
                  <p>Max Per Trade: {onChainSession.maxPerTrade} octas</p>
                  <p>Total Spent: {onChainSession.totalSpent} octas</p>
                  <p>
                    Expires:{" "}
                    {new Date(
                      Number(onChainSession.expiresAt) * 1000
                    ).toLocaleString()}
                  </p>
                </>
              )}
            </div>
            <Button
              onClick={handleRevoke}
              disabled={!onChainSession.isActive}
              variant="destructive"
              size="sm"
              className="mt-2"
            >
              Revoke Session
            </Button>
          </div>
        )}

        {/* Step 2: Execute Trade */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Step 2: Execute Trade with Session
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Trade using session signature (backend would execute this in
              production)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Trade Amount (octas)</Label>
            <Input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="5000000"
            />
          </div>

          <Button
            onClick={handleExecuteTradeWithSession}
            disabled={isExecuting || !hasSession || !account?.address}
            className="w-full"
            variant="secondary"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Executing...
              </>
            ) : (
              "Execute Trade (Session Signature)"
            )}
          </Button>

          <Button
            onClick={() => {
              checkLocalSession();
              loadOnChainSession();
            }}
            variant="outline"
            className="w-full"
          >
            Refresh Session Status
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Click "Create Session Key" and sign the transaction (ONCE)</li>
            <li>Session key pair is generated and stored (private key in localStorage)</li>
            <li>Execute trades by signing with session private key</li>
            <li>Contract verifies session signature instead of user signature</li>
            <li>In production, backend/relayer would execute without user interaction</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
