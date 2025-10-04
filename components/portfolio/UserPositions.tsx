"use client";

/**
 * User Positions Component
 * Shows active positions in markets
 */

import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, ExternalLink, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getRedeemWinningsPayload } from "@/aptos/transactions/redeem-winnings-transaction";
import { aptosClient } from "@/aptos/client";
import { NETWORK } from "@/aptos/constants";

interface Position {
  marketAddress: string;
  marketTitle: string;
  yesBalance: number;
  noBalance: number;
  totalValue: number;
  marketStatus?: number; // 0: OPEN, 1: CLOSED, 2: RESOLVED_YES, 3: RESOLVED_NO
}

interface UserPositionsProps {
  positions: Position[];
  isLoading?: boolean;
}

export function UserPositions({ positions, isLoading }: UserPositionsProps) {
  const { signAndSubmitTransaction, account } = useWallet();
  const queryClient = useQueryClient();
  const [redeemingMarket, setRedeemingMarket] = useState<string | null>(null);

  const formatBalance = (balance: number) => {
    if (balance >= 1000) return `${(balance / 1000).toFixed(2)}k`;
    if (balance >= 1) return balance.toFixed(2);
    return balance.toFixed(4);
  };

  const redeemMutation = useMutation({
    mutationFn: async ({
      marketAddress,
      amount,
    }: {
      marketAddress: string;
      amount: number;
    }) => {
      if (!account?.address) throw new Error("Wallet not connected");

      const payload = getRedeemWinningsPayload({
        marketObjectAddress: marketAddress,
        amountToRedeem: Math.floor(amount * 10 ** 6), // Convert to token units
      });

      const { hash } = await signAndSubmitTransaction({
        sender: account.address,
        data: payload.data,
      });

      return hash;
    },
    onSuccess: async (hash) => {
      toast.info("Transaction submitted, waiting for confirmation...");

      try {
        await aptosClient().waitForTransaction({
          transactionHash: hash,
          options: {
            timeoutSecs: 60,
            waitForIndexer: true,
          },
        });

        toast.success("Winnings claimed successfully!", {
          action: {
            label: "View on Explorer",
            onClick: () =>
              window.open(
                `https://explorer.aptoslabs.com/txn/${hash}?network=${NETWORK.toLowerCase()}`,
                "_blank",
              ),
          },
        });

        // Refetch positions
        queryClient.invalidateQueries({ queryKey: ["userPositions"] });
      } catch (error) {
        console.error("Error waiting for confirmation:", error);
        toast.error("Confirmation timeout", {
          description: "Check the explorer to verify the transaction.",
        });
      } finally {
        setRedeemingMarket(null);
      }
    },
    onError: (error: any) => {
      setRedeemingMarket(null);
      if (error.message?.includes("User rejected")) {
        toast.info("Transaction cancelled");
      } else {
        toast.error("Failed to claim winnings", {
          description: error.message,
        });
      }
    },
  });

  const handleRedeem = (marketAddress: string, winningBalance: number) => {
    setRedeemingMarket(marketAddress);
    redeemMutation.mutate({ marketAddress, amount: winningBalance });
  };

  const totalPortfolioValue = positions.reduce(
    (sum, pos) => sum + pos.totalValue,
    0,
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading positions...</p>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active positions. Browse markets to start trading!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Positions</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              {totalPortfolioValue.toFixed(2)} APT
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map((position) => (
            <div
              key={position.marketAddress}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">
                    {position.marketTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {position.marketAddress.substring(0, 12)}...
                  </p>
                </div>
                <Link href={`/market/${position.marketAddress}`}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    YES Shares
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className={
                        position.marketStatus === 2
                          ? "bg-green-500 text-white"
                          : ""
                      }
                    >
                      {formatBalance(position.yesBalance)}
                    </Badge>
                    {position.marketStatus === 2 && position.yesBalance > 0 && (
                      <Trophy className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    NO Shares
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        position.marketStatus === 3
                          ? "bg-red-500 text-white"
                          : ""
                      }
                    >
                      {formatBalance(position.noBalance)}
                    </Badge>
                    {position.marketStatus === 3 && position.noBalance > 0 && (
                      <Trophy className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Value</p>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    {position.totalValue.toFixed(2)} APT
                  </p>
                </div>
              </div>

              {/* Redeem Button for Resolved Markets */}
              {(position.marketStatus === 2 || position.marketStatus === 3) && (
                <div className="mt-3 pt-3 border-t">
                  {(() => {
                    const isYesWinner = position.marketStatus === 2;
                    const winningBalance = isYesWinner
                      ? position.yesBalance
                      : position.noBalance;
                    const isWinner = winningBalance > 0;

                    if (!isWinner) {
                      return (
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground">
                            Market resolved {isYesWinner ? "YES" : "NO"} - No
                            winnings to claim
                          </p>
                        </div>
                      );
                    }

                    const isRedeeming =
                      redeemingMarket === position.marketAddress;

                    return (
                      <Button
                        onClick={() =>
                          handleRedeem(position.marketAddress, winningBalance)
                        }
                        disabled={isRedeeming}
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                      >
                        {isRedeeming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Trophy className="mr-2 h-4 w-4" />
                            Claim {formatBalance(winningBalance)}{" "}
                            {isYesWinner ? "YES" : "NO"} Winnings
                          </>
                        )}
                      </Button>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
