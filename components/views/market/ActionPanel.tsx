"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { aptosClient } from "@/aptos/client";
import { NETWORK } from "@/aptos/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBuySharesPayload, getSellSharesPayload } from "@/lib/api/market";
import type { ActionPanelProps } from "@/lib/types";

export function ActionPanel({ marketId, dynamicData }: ActionPanelProps) {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const { signAndSubmitTransaction, account } = useWallet();

  const handleTransactionSuccess = (hash: string, message: string) => {
    toast.info("Transaction submitted, waiting for confirmation...");
    aptosClient()
      .waitForTransaction({
        transactionHash: hash,
        options: {
          timeoutSecs: 60,
          waitForIndexer: true,
        },
      })
      .then(() => {
        toast.success("Transaction confirmed!", {
          description: message,
          action: {
            label: "View on Explorer",
            onClick: () =>
              window.open(
                `https://explorer.aptoslabs.com/txn/${hash}?network=${NETWORK.toLowerCase()}`,
                "_blank",
              ),
          },
        });
      })
      .catch((error) => {
        console.error("Error waiting for transaction confirmation:", error);
        toast.error("Confirmation Timed Out", {
          description:
            "Your transaction may have succeeded, but we could not confirm it in time. Please check an explorer.",
        });
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
    onSuccess: async (payload) => {
      if (!account?.address) return;
      try {
        const { hash } = await signAndSubmitTransaction({
          sender: account.address,
          data: payload,
        });
        handleTransactionSuccess(
          hash,
          `Successfully bought ${buyAmount} shares.`,
        );
        setBuyAmount("");
      } catch (e) {
        handleTransactionError(e);
      }
    },
    onError: (e: Error) =>
      toast.error("Error building transaction", { description: e.message }),
  });

  const sellMutation = useMutation({
    mutationFn: getSellSharesPayload,
    onSuccess: async (payload) => {
      if (!account?.address) return;
      try {
        const { hash } = await signAndSubmitTransaction({
          sender: account.address,
          data: payload,
        });
        handleTransactionSuccess(
          hash,
          `Successfully sold ${sellAmount} shares.`,
        );
        setSellAmount("");
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
    buyMutation.mutate({
      marketObjectAddress: marketId,
      amountOctas: Math.floor(amountFloat * 10 ** 8),
      buysYesShares,
    });
  };

  const handleSellShares = (sellsYesShares: boolean) => {
    const amountFloat = parseFloat(sellAmount);
    if (!sellAmount || amountFloat <= 0) {
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
    <Card>
      <CardHeader>
        <CardTitle>Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-1 p-3 bg-muted/50 rounded-md mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">APT Coin:</span>
            <span className="font-mono">{userAptBalance} APT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">YES Shares:</span>
            <span className="font-mono">{userYesBalance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NO Shares:</span>
            <span className="font-mono">{userNoBalance}</span>
          </div>
        </div>

        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="buy-amount">Amount to Buy (in APT)</Label>
                <span className="text-xs text-muted-foreground">
                  Balance: {userAptBalance} APT
                </span>
              </div>
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

            <div className="grid grid-cols-2 gap-4">
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
          </TabsContent>

          <TabsContent value="sell" className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sell-amount">Amount to Sell (in Shares)</Label>
                <span className="text-xs text-muted-foreground">
                  YES: {userYesBalance} | NO: {userNoBalance}
                </span>
              </div>
              <Input
                id="sell-amount"
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* YES Sell Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {[25, 50, 75].map((percentage) => (
                    <Button
                      key={`yes-${percentage}`}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const amount = (parseFloat(userYesBalance) * percentage) / 100;
                        setSellAmount(amount.toFixed(2));
                      }}
                      disabled={isProcessing || dynamicData.userYesBalance === 0}
                      className="flex-1 text-xs"
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSellAmount(userYesBalance)}
                  disabled={isProcessing || dynamicData.userYesBalance === 0}
                  className="w-full text-xs font-semibold"
                >
                  MAX YES
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleSellShares(true)}
                  disabled={isProcessing || dynamicData.userYesBalance === 0}
                  className="w-full"
                >
                  {sellMutation.isPending ? "Processing..." : "Sell YES"}
                </Button>
              </div>

              {/* NO Sell Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {[25, 50, 75].map((percentage) => (
                    <Button
                      key={`no-${percentage}`}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const amount = (parseFloat(userNoBalance) * percentage) / 100;
                        setSellAmount(amount.toFixed(2));
                      }}
                      disabled={isProcessing || dynamicData.userNoBalance === 0}
                      className="flex-1 text-xs"
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSellAmount(userNoBalance)}
                  disabled={isProcessing || dynamicData.userNoBalance === 0}
                  className="w-full text-xs font-semibold"
                >
                  MAX NO
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleSellShares(false)}
                  disabled={isProcessing || dynamicData.userNoBalance === 0}
                  className="w-full"
                >
                  {sellMutation.isPending ? "Processing..." : "Sell NO"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
