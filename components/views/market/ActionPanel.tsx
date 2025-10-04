"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { aptosClient } from "@/aptos/client";
import { NETWORK } from "@/aptos/constants";
import { getTxExplorerLink, truncateHash } from "@/aptos/helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { getBuySharesPayload, getSellSharesPayload } from "@/lib/api/market";
import type { ActionPanelProps } from "@/lib/types";

export function ActionPanel({ marketId, dynamicData }: ActionPanelProps) {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellYesAmount, setSellYesAmount] = useState("");
  const [sellNoAmount, setSellNoAmount] = useState("");
  const { signAndSubmitTransaction, account } = useWallet();
  const queryClient = useQueryClient();

  const handleTransactionSuccess = (hash: string, title: string, description: string) => {
    const explorerLink = getTxExplorerLink(hash, NETWORK);

    toast.success(title, {
      description: `${description}\n\nView transaction: ${truncateHash(hash)}`,
      action: {
        label: "View TX",
        onClick: () => window.open(explorerLink, "_blank"),
      },
      duration: 15000, // 15 seconds to give time to click
    });
  };

  const handleTransactionError = (e: any) => {
    if (e.message?.includes("User rejected the request")) {
      toast.info("Transaction cancelled by user.");
    } else {
      toast.error("Transaction Failed", { description: e.message });
    }
  };

  const buyMutation = useMutation({
    mutationFn: getBuySharesPayload,
    onSuccess: async (payload, variables) => {
      if (!account?.address) return;
      try {
        const { hash } = await signAndSubmitTransaction({
          sender: account.address,
          data: payload,
        });

        // Wait for transaction confirmation
        await aptosClient().waitForTransaction({
          transactionHash: hash,
          options: {
            timeoutSecs: 60,
            waitForIndexer: true,
          },
        });

        const tokenType = variables.buysYesShares ? "YES" : "NO";
        handleTransactionSuccess(
          hash,
          "Shares purchased successfully!",
          `Bought ${buyAmount} ${tokenType} tokens`,
        );
        setBuyAmount("");

        // Invalidate market details to refresh balances
        queryClient.invalidateQueries({
          queryKey: ["market-details", marketId],
        });
      } catch (e) {
        handleTransactionError(e);
      }
    },
    onError: (e: Error) =>
      toast.error("Error building transaction", { description: e.message }),
  });

  const sellMutation = useMutation({
    mutationFn: getSellSharesPayload,
    onSuccess: async (payload, variables) => {
      if (!account?.address) return;
      try {
        const { hash } = await signAndSubmitTransaction({
          sender: account.address,
          data: payload,
        });

        // Wait for transaction confirmation
        await aptosClient().waitForTransaction({
          transactionHash: hash,
          options: {
            timeoutSecs: 60,
            waitForIndexer: true,
          },
        });

        const tokenType = variables.sellsYesShares ? "YES" : "NO";
        const amount = variables.sellsYesShares ? sellYesAmount : sellNoAmount;
        handleTransactionSuccess(
          hash,
          "Shares sold successfully!",
          `Sold ${amount} ${tokenType} tokens`,
        );
        if (variables.sellsYesShares) {
          setSellYesAmount("");
        } else {
          setSellNoAmount("");
        }

        // Invalidate market details to refresh balances
        queryClient.invalidateQueries({
          queryKey: ["market-details", marketId],
        });
      } catch (e) {
        handleTransactionError(e);
      }
    },
    onError: (e: Error) =>
      toast.error("Error building transaction", { description: e.message }),
  });

  const handleBuyShares = (buysYesShares: boolean) => {
    const amountFloat = parseFloat(buyAmount);
    if (!buyAmount || amountFloat <= 0) {
      toast.error("Please enter a valid amount to buy.");
      return;
    }

    const amountOctas = Math.floor(amountFloat * 10 ** 8);
    const userAptBalanceOctas = dynamicData.userAptBalance;

    console.log('[ActionPanel] Buy shares:', {
      amountInput: buyAmount,
      amountFloat,
      amountOctas,
      userAptBalance: userAptBalanceOctas,
      userAptBalanceAPT: userAptBalanceOctas / 10 ** 8,
      hasEnough: amountOctas <= userAptBalanceOctas,
    });

    if (amountOctas > userAptBalanceOctas) {
      toast.error("Insufficient APT balance", {
        description: `You need ${amountFloat} APT but only have ${(userAptBalanceOctas / 10 ** 8).toFixed(4)} APT`,
      });
      return;
    }

    buyMutation.mutate({
      marketObjectAddress: marketId,
      amountOctas,
      buysYesShares,
    });
  };

  const handleSellShares = (sellsYesShares: boolean) => {
    const amount = sellsYesShares ? sellYesAmount : sellNoAmount;
    const amountFloat = parseFloat(amount);
    if (!amount || amountFloat <= 0) {
      toast.error("Please enter a valid amount to sell.");
      return;
    }
    sellMutation.mutate({
      marketObjectAddress: marketId,
      amountOctas: Math.floor(amountFloat * 10 ** 6),
      sellsYesShares,
    });
  };

  const isProcessing = buyMutation.isPending || sellMutation.isPending;

  const userAptBalance = (dynamicData.userAptBalance / 10 ** 8).toFixed(4);
  const userYesBalance = (dynamicData.userYesBalance / 10 ** 6).toFixed(2);
  const userNoBalance = (dynamicData.userNoBalance / 10 ** 6).toFixed(2);

  return (
    <div className="space-y-6">
      {/* User Balances Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Your Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/40 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">APT</div>
              <div className="font-mono font-bold text-sm">{userAptBalance}</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-xs text-green-400/70 mb-1">YES</div>
              <div className="font-mono font-bold text-sm text-green-400">{userYesBalance}</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="text-xs text-red-400/70 mb-1">NO</div>
              <div className="font-mono font-bold text-sm text-red-400">{userNoBalance}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy Section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Buy Shares
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buy-amount">Amount (in APT)</Label>
            <Input
              id="buy-amount"
              type="number"
              placeholder="0.0"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              disabled={isProcessing}
            />

            {/* Quick Amount Buttons */}
            <div className="flex items-center gap-2">
              {[25, 50, 75].map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const amount = (parseFloat(userAptBalance) * percentage) / 100;
                    setBuyAmount(amount.toFixed(4));
                  }}
                  disabled={isProcessing}
                  className="flex-1 text-xs"
                >
                  {percentage}%
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBuyAmount(userAptBalance)}
                disabled={isProcessing}
                className="flex-1 text-xs font-semibold"
              >
                MAX
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleBuyShares(true)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {buyMutation.isPending ? "Processing..." : "Buy YES"}
            </Button>
            <Button
              onClick={() => handleBuyShares(false)}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {buyMutation.isPending ? "Processing..." : "Buy NO"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sell Section */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-red-400" />
            Sell Shares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Sell YES */}
            <div className="space-y-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Sell YES Shares</div>
                <div className="text-sm font-mono font-semibold text-green-400">
                  Balance: {userYesBalance}
                </div>
              </div>

              <Input
                type="number"
                placeholder="0.0"
                value={sellYesAmount}
                onChange={(e) => setSellYesAmount(e.target.value)}
                disabled={isProcessing || dynamicData.userYesBalance === 0}
              />

              <div className="flex items-center gap-2">
                {[50, 100].map((percentage) => (
                  <Button
                    key={`yes-${percentage}`}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const amount = (parseFloat(userYesBalance) * percentage) / 100;
                      setSellYesAmount(amount.toFixed(2));
                    }}
                    disabled={isProcessing || dynamicData.userYesBalance === 0}
                    className="flex-1 text-xs"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>

              <Button
                variant="destructive"
                onClick={() => handleSellShares(true)}
                disabled={isProcessing || dynamicData.userYesBalance === 0}
                className="w-full"
                size="sm"
              >
                {sellMutation.isPending ? "Processing..." : "Sell YES"}
              </Button>
            </div>

            {/* Sell NO */}
            <div className="space-y-3 p-4 bg-red-500/5 rounded-lg border border-red-500/20">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Sell NO Shares</div>
                <div className="text-sm font-mono font-semibold text-red-400">
                  Balance: {userNoBalance}
                </div>
              </div>

              <Input
                type="number"
                placeholder="0.0"
                value={sellNoAmount}
                onChange={(e) => setSellNoAmount(e.target.value)}
                disabled={isProcessing || dynamicData.userNoBalance === 0}
              />

              <div className="flex items-center gap-2">
                {[50, 100].map((percentage) => (
                  <Button
                    key={`no-${percentage}`}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const amount = (parseFloat(userNoBalance) * percentage) / 100;
                      setSellNoAmount(amount.toFixed(2));
                    }}
                    disabled={isProcessing || dynamicData.userNoBalance === 0}
                    className="flex-1 text-xs"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>

              <Button
                variant="destructive"
                onClick={() => handleSellShares(false)}
                disabled={isProcessing || dynamicData.userNoBalance === 0}
                className="w-full"
                size="sm"
              >
                {sellMutation.isPending ? "Processing..." : "Sell NO"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
