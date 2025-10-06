"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
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
import { aptosClient } from "@/aptos/client";
import { MODULE_ADDRESS } from "@/aptos/constants";

export function ApprovalMockupTest() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [isApproved, setIsApproved] = useState(false);
  const [approvalInfo, setApprovalInfo] = useState<any>(null);
  const [maxAmount, setMaxAmount] = useState("1000000"); // 0.01 APT in octas
  const [tradeAmount, setTradeAmount] = useState("500000"); // 0.005 APT
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has approval
  const checkApproval = async () => {
    if (!account?.address) return;

    try {
      const result = await aptosClient().view<
        [boolean, string, string, string]
      >({
        payload: {
          function: `${MODULE_ADDRESS}::approval_mockup::get_approval`,
          functionArguments: [account.address.toString()],
        },
      });

      const [isActive, maxPerTrade, expiresAt, totalSpent] = result;
      setIsApproved(isActive);
      setApprovalInfo({
        isActive,
        maxPerTrade,
        expiresAt,
        totalSpent,
      });
    } catch (error) {
      console.error("Error checking approval:", error);
    }
  };

  // Step 1: Approve the protocol (sign ONCE)
  const handleApprove = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::approval_mockup::approve`,
          functionArguments: [
            maxAmount, // max_amount_per_trade
            86400, // duration_seconds (24 hours)
          ],
        },
      });

      await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });

      toast.success(
        "Approved! You can now execute trades without signing each time",
      );
      await checkApproval();
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error(error.message || "Approval failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Execute trade WITHOUT signing (uses approved allowance)
  const handleExecuteTrade = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::approval_mockup::execute_approved_trade`,
          functionArguments: [
            account.address.toString(), // user_address
            tradeAmount, // amount
            true, // is_buy
          ],
        },
      });

      await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });

      toast.success(
        "Trade executed using approval - NO signature needed from user!",
      );
      await checkApproval();
    } catch (error: any) {
      console.error("Trade execution error:", error);
      toast.error(error.message || "Trade execution failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke approval
  const handleRevoke = async () => {
    if (!account?.address) return;

    setIsLoading(true);
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::approval_mockup::revoke_approval`,
          functionArguments: [],
        },
      });

      await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });

      toast.success("Approval revoked");
      await checkApproval();
    } catch (error: any) {
      console.error("Revoke error:", error);
      toast.error(error.message || "Revoke failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Approval Mockup Test</CardTitle>
        <CardDescription>
          Test approval-based trading: Approve ONCE, then execute trades WITHOUT
          signing each time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Approve */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Step 1: Approve Protocol
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign ONCE to allow the protocol to execute trades on your behalf
            </p>
          </div>

          <div className="space-y-2">
            <Label>Max Amount Per Trade (octas)</Label>
            <Input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="1000000"
            />
            <p className="text-xs text-muted-foreground">
              1 APT = 100,000,000 octas
            </p>
          </div>

          <Button
            onClick={handleApprove}
            disabled={isLoading || !account?.address}
            className="w-full"
          >
            {isLoading ? "Approving..." : "Approve Protocol (Sign Once)"}
          </Button>
        </div>

        {/* Approval Status */}
        {approvalInfo && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold">Approval Status</h4>
            <div className="text-sm space-y-1">
              <p>Active: {approvalInfo.isActive ? "✅ Yes" : "❌ No"}</p>
              <p>Max Per Trade: {approvalInfo.maxPerTrade} octas</p>
              <p>Total Spent: {approvalInfo.totalSpent} octas</p>
              <p>
                Expires:{" "}
                {new Date(
                  Number(approvalInfo.expiresAt) * 1000,
                ).toLocaleString()}
              </p>
            </div>
            <Button
              onClick={handleRevoke}
              disabled={isLoading || !approvalInfo.isActive}
              variant="destructive"
              size="sm"
              className="mt-2"
            >
              Revoke Approval
            </Button>
          </div>
        )}

        {/* Step 2: Execute Trade */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Step 2: Execute Trade
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Execute trades WITHOUT signing (uses your approval)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Trade Amount (octas)</Label>
            <Input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="500000"
            />
          </div>

          <Button
            onClick={handleExecuteTrade}
            disabled={isLoading || !isApproved || !account?.address}
            className="w-full"
            variant="secondary"
          >
            {isLoading ? "Executing..." : "Execute Trade (No Signature!)"}
          </Button>

          <Button
            onClick={checkApproval}
            disabled={isLoading || !account?.address}
            variant="outline"
            className="w-full"
          >
            Check Approval Status
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>
              Click "Approve Protocol" and sign the transaction (ONLY ONCE)
            </li>
            <li>Now you can execute trades without signing again</li>
            <li>The protocol uses your pre-approved allowance</li>
            <li>You can revoke approval anytime</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
