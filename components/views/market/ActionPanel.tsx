"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { aptosClient } from "@/aptos/client";
import { NETWORK } from "@/aptos/constants";
import { getTxExplorerLink, truncateHash } from "@/aptos/helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight } from "lucide-react";
import { getBuySharesPayload, getSellSharesPayload } from "@/lib/api/market";
import type { ActionPanelProps } from "@/lib/types";
import { recordActivity } from "@/lib/services/activity-client.service";
import { calculateMarketPsychology } from "@/lib/services/market-psychology.service";
import { cn } from "@/lib/utils";
import { getAnimationConfig, type AnimationStyle } from "@/lib/animations/panel-transitions";

type TradeMode = "buy" | "sell";

// Change this to try different animations:
// "smooth-3d-flip" | "magnetic-slide" | "scale-morph" | "dissolve-zoom" | "card-flip" | "cube-rotate" | "elastic-bounce" | "ultra-degen"
const ANIMATION_STYLE: AnimationStyle = "ultra-degen"; // 🚀💎🙌 MAXIMUM DEGEN MODE

export function ActionPanel({ marketId, dynamicData }: ActionPanelProps) {
  const [tradeMode, setTradeMode] = useState<TradeMode>("buy");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellYesAmount, setSellYesAmount] = useState("");
  const [sellNoAmount, setSellNoAmount] = useState("");
  const { signAndSubmitTransaction, account } = useWallet();
  const queryClient = useQueryClient();

  const handleTransactionSuccess = (
    hash: string,
    title: string,
    description: string,
  ) => {
    const explorerLink = getTxExplorerLink(hash, NETWORK);

    toast.success(title, {
      description: `${description}\n\nView transaction: ${truncateHash(hash)}`,
      action: {
        label: "View TX",
        onClick: () => window.open(explorerLink, "_blank"),
      },
      duration: 15000,
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

        await recordActivity({
          txHash: hash,
          marketAddress: marketId,
          userAddress: account.address.toString(),
          action: "BUY",
          outcome: tokenType,
          amount: parseFloat(buyAmount),
          price: null,
          totalValue: parseFloat(buyAmount),
        });

        setBuyAmount("");

        queryClient.invalidateQueries({
          queryKey: ["marketDetails"],
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

        await recordActivity({
          txHash: hash,
          marketAddress: marketId,
          userAddress: account.address.toString(),
          action: "SELL",
          outcome: tokenType,
          amount: parseFloat(amount),
          price: null,
          totalValue: parseFloat(amount),
        });

        if (variables.sellsYesShares) {
          setSellYesAmount("");
        } else {
          setSellNoAmount("");
        }

        queryClient.invalidateQueries({
          queryKey: ["marketDetails"],
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

  const psychology = useMemo(
    () => calculateMarketPsychology(dynamicData),
    [dynamicData]
  );

  const primaryIsYes = psychology.primaryOutcome.name === "YES";

  // Get selected animation configuration
  const animationConfig = getAnimationConfig(ANIMATION_STYLE);

  return (
    <div className="space-y-3">
      {/* Compact Balances Strip with Mode Toggle */}
      <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-background via-primary/5 to-background rounded-lg border border-primary/20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            <span className="font-medium">Holdings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-[9px] text-muted-foreground/70 uppercase tracking-wider font-medium">APT</div>
              <div className="font-mono font-bold text-sm">{userAptBalance}</div>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="text-center">
              <div className="text-[9px] text-green-400/80 uppercase tracking-wider font-medium">YES</div>
              <div className="font-mono font-bold text-sm text-green-400">{userYesBalance}</div>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="text-center">
              <div className="text-[9px] text-red-400/80 uppercase tracking-wider font-medium">NO</div>
              <div className="font-mono font-bold text-sm text-red-400">{userNoBalance}</div>
            </div>
          </div>
        </div>

        {/* Trade Mode Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTradeMode(tradeMode === "buy" ? "sell" : "buy")}
          disabled={isProcessing}
          className={cn(
            "h-8 px-3 text-xs font-bold transition-all relative overflow-hidden group",
            tradeMode === "buy"
              ? "border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300"
              : "border-green-500/30 hover:border-green-500/50 text-green-400 hover:text-green-300"
          )}
        >
          <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
          <span>{tradeMode === "buy" ? "Switch to SELL" : "Switch to BUY"}</span>
        </Button>
      </div>

      {/* Dynamic Trading Panels - Satisfying Animations */}
      <div className="relative min-h-[400px]" style={animationConfig.containerStyle}>
        <AnimatePresence mode="wait">
          {tradeMode === "buy" ? (
            <motion.div
              key="buy"
              initial={animationConfig.initial}
              animate={animationConfig.animate}
              exit={animationConfig.exit}
              transition={animationConfig.transition}
              style={{ transformStyle: "preserve-3d" }}
              className="absolute inset-0"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* BUY YES Card */}
                <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 via-background to-background shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-bold">Buy YES</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="buy-yes-amount">Amount (in APT)</Label>
                      <Input
                        id="buy-yes-amount"
                        type="number"
                        placeholder="0.0"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        disabled={isProcessing}
                      />
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
                          ALL IN
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleBuyShares(true)}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {buyMutation.isPending ? "Processing..." : "BUY YES"}
                    </Button>
                  </CardContent>
                </Card>

                {/* BUY NO Card */}
                <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 via-background to-background shadow-lg hover:shadow-red-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="text-red-400 font-bold">Buy NO</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="buy-no-amount">Amount (in APT)</Label>
                      <Input
                        id="buy-no-amount"
                        type="number"
                        placeholder="0.0"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        disabled={isProcessing}
                      />
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
                          ALL IN
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleBuyShares(false)}
                      disabled={isProcessing}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {buyMutation.isPending ? "Processing..." : "BUY NO"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sell"
              initial={animationConfig.initial}
              animate={animationConfig.animate}
              exit={animationConfig.exit}
              transition={animationConfig.transition}
              style={{ transformStyle: "preserve-3d" }}
              className="absolute inset-0"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SELL YES Card */}
                <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 via-background to-background shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-bold">Sell YES</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sell-yes-amount">Amount (in YES)</Label>
                      <Input
                        id="sell-yes-amount"
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
                            {percentage === 100 ? "MAX" : `${percentage}%`}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSellShares(true)}
                      disabled={isProcessing || dynamicData.userYesBalance === 0}
                      variant="destructive"
                      className="w-full"
                    >
                      {sellMutation.isPending ? "Processing..." : "SELL YES"}
                    </Button>
                  </CardContent>
                </Card>

                {/* SELL NO Card */}
                <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 via-background to-background shadow-lg hover:shadow-red-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="text-red-400 font-bold">Sell NO</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sell-no-amount">Amount (in NO)</Label>
                      <Input
                        id="sell-no-amount"
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
                            {percentage === 100 ? "MAX" : `${percentage}%`}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSellShares(false)}
                      disabled={isProcessing || dynamicData.userNoBalance === 0}
                      variant="destructive"
                      className="w-full"
                    >
                      {sellMutation.isPending ? "Processing..." : "SELL NO"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
