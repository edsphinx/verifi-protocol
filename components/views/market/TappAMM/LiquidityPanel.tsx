"use client";

import { motion } from "framer-motion";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AlertTriangle, Droplets, Info, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useMarketData } from "@/aptos/queries/use-market-data";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { useTappMode } from "@/lib/tapp/context/TappModeContext";
import {
  calculateAddLiquidityPreview,
  calculateRemoveLiquidityPreview,
  useAddLiquidity,
  useRemoveLiquidity,
} from "@/lib/tapp/hooks/use-liquidity";
import { usePoolData } from "@/lib/tapp/hooks/use-pool-data";
import { formatNumber, formatPercentage } from "@/lib/tapp/mock/pool-data";
import { useLiquidityValidation } from "@/lib/hooks/use-liquidity-validation";
import { useUserPositions } from "@/lib/tapp/hooks/use-user-positions";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LiquidityPanelProps {
  marketId: string;
  yesTokenAddress: string;
  noTokenAddress: string;
  yesReserve?: number;
  noReserve?: number;
  tradingEnabled?: boolean;
}

export function LiquidityPanel({
  marketId,
  yesTokenAddress,
  noTokenAddress,
  yesReserve: initialYesReserve,
  noReserve: initialNoReserve,
  tradingEnabled: initialTradingEnabled,
}: LiquidityPanelProps) {
  const { account } = useWallet();

  // Add liquidity state
  const [yesAmount, setYesAmount] = useState("");
  const [noAmount, setNoAmount] = useState("");

  // Remove liquidity state
  const [lpTokens, setLpTokens] = useState("");
  const [positionIdx, setPositionIdx] = useState("");

  const { isDemo } = useTappMode();
  const addLiquidityMutation = useAddLiquidity();
  const removeLiquidityMutation = useRemoveLiquidity();

  // Fetch live pool data - this will auto-update when refetchQueries is called
  const { data: poolData, isLoading: isLoadingPool } = usePoolData(marketId, account?.address.toString());

  // Fetch user's token balances
  const { data: marketData, isLoading: isLoadingMarket } = useMarketData({
    id: marketId,
    yesToken: yesTokenAddress,
    noToken: noTokenAddress,
  });

  // Fetch user's LP positions in this pool
  const { data: userPositions, isLoading: isLoadingPositions } = useUserPositions(
    poolData?.poolAddress || "",
    account?.address.toString()
  );

  // Use live data if available, fallback to initial props
  // Reserves from poolData are in on-chain format (10^6), convert to display format
  const yesReserveOnChain = poolData?.yesReserve ?? initialYesReserve ?? 0;
  const noReserveOnChain = poolData?.noReserve ?? initialNoReserve ?? 0;
  const yesReserve = poolData
    ? yesReserveOnChain / 1_000_000
    : yesReserveOnChain;
  const noReserve = poolData ? noReserveOnChain / 1_000_000 : noReserveOnChain;
  const tradingEnabled =
    poolData?.tradingEnabled ?? initialTradingEnabled ?? false;

  // User balances (divide by 10^6 to convert from on-chain format - YES/NO tokens have 6 decimals)
  const userYesBalance = (marketData?.yesBalance || 0) / 10 ** 6;
  const userNoBalance = (marketData?.noBalance || 0) / 10 ** 6;

  // Calculate total LP supply (geometric mean of reserves)
  const totalLpSupply = Math.sqrt(yesReserve * noReserve);

  // Use validation hook
  const validation = useLiquidityValidation(
    yesAmount,
    noAmount,
    lpTokens,
    positionIdx,
    {
      yesBalance: userYesBalance,
      noBalance: userNoBalance,
      lpSupply: totalLpSupply,
    },
    yesReserve === 0 || noReserve === 0, // isFirstProvider
    tradingEnabled
  );

  // Show loading state while fetching data
  const isLoading = isLoadingPool || isLoadingMarket;
  if (isLoading) {
    return (
      <Card className="min-h-[600px] flex items-center justify-center">
        <VeriFiLoader message="Loading liquidity panel..." />
      </Card>
    );
  }

  // Preview calculations (using regular functions, not hooks)
  const addPreview = calculateAddLiquidityPreview(
    parseFloat(yesAmount) || 0,
    parseFloat(noAmount) || 0,
    yesReserve,
    noReserve,
    totalLpSupply,
  );

  const removePreview = calculateRemoveLiquidityPreview(
    parseFloat(lpTokens) || 0,
    yesReserve,
    noReserve,
    totalLpSupply,
  );

  const handleAddLiquidity = () => {
    if (!addPreview) return;

    addLiquidityMutation.mutate({
      marketId,
      yesAmount: parseFloat(yesAmount),
      noAmount: parseFloat(noAmount),
    });

    // Clear inputs on success
    if (!addLiquidityMutation.isPending) {
      setYesAmount("");
      setNoAmount("");
    }
  };

  const handleRemoveLiquidity = () => {
    if (!removePreview || !positionIdx) return;

    removeLiquidityMutation.mutate({
      marketId,
      lpTokens: parseFloat(lpTokens),
      positionIdx: parseInt(positionIdx),
    });

    // Clear inputs on success
    if (!removeLiquidityMutation.isPending) {
      setLpTokens("");
      setPositionIdx("");
    }
  };

  const handleBalanceRatio = () => {
    if (!yesAmount && !noAmount) return;
    if (yesReserve === 0 || noReserve === 0) return; // Can't balance if pool is empty

    const ratio = yesReserve / noReserve;

    if (yesAmount && !noAmount) {
      const yes = parseFloat(yesAmount);
      setNoAmount((yes / ratio).toFixed(4));
    } else if (noAmount && !yesAmount) {
      const no = parseFloat(noAmount);
      setYesAmount((no * ratio).toFixed(4));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Liquidity Provider
            </CardTitle>
            <CardDescription>
              Earn fees by providing liquidity to the pool
            </CardDescription>
          </div>
          {isDemo && <Badge variant="outline">Demo Mode</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">
              <Plus className="h-4 w-4 mr-2" />
              Farm
            </TabsTrigger>
            <TabsTrigger
              value="remove"
              disabled={yesReserve === 0 || noReserve === 0}
            >
              <Minus className="h-4 w-4 mr-2" />
              Rage Quit
            </TabsTrigger>
          </TabsList>

          {/* Add Liquidity Tab */}
          <TabsContent value="add" className="space-y-4 mt-4">
            {!tradingEnabled && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Cannot add liquidity while trading is disabled.
                </AlertDescription>
              </Alert>
            )}

            {/* First Liquidity Provider - Simplified Interface */}
            {yesReserve === 0 || noReserve === 0 ? (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You're the first liquidity provider! Add equal amounts of
                    YES and NO tokens to initialize the pool.
                  </AlertDescription>
                </Alert>

                {/* Single unified input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="unified-amount">Amount (per token)</Label>
                    <div className="text-xs text-muted-foreground">
                      YES: {account ? formatNumber(userYesBalance, 2) : "0.00"}{" "}
                      | NO: {account ? formatNumber(userNoBalance, 2) : "0.00"}
                    </div>
                  </div>
                  <Input
                    id="unified-amount"
                    type="number"
                    placeholder="0.00"
                    value={yesAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setYesAmount(value);
                      setNoAmount(value); // Keep them equal
                    }}
                    disabled={!tradingEnabled || addLiquidityMutation.isPending}
                    className={cn(
                      yesAmount &&
                        !validation.isValidAmount(yesAmount) &&
                        "border-destructive"
                    )}
                  />
                  {validation.addYesError && (
                    <p className="text-xs text-destructive">
                      {validation.addYesError}
                    </p>
                  )}
                  {!validation.addYesError && (
                    <p className="text-xs text-muted-foreground">
                      You'll deposit {yesAmount || "0"} YES + {noAmount || "0"}{" "}
                      NO tokens
                    </p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex items-center gap-2">
                  {[25, 50, 100].map((percentage) => (
                    <Button
                      key={`unified-${percentage}`}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Use the minimum of the two balances to ensure user has enough of both
                        const minBalance = Math.min(
                          userYesBalance,
                          userNoBalance,
                        );
                        const amount = (minBalance * percentage) / 100;
                        setYesAmount(amount.toFixed(4));
                        setNoAmount(amount.toFixed(4));
                      }}
                      disabled={
                        !tradingEnabled ||
                        addLiquidityMutation.isPending ||
                        !account
                      }
                      className="flex-1"
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              /* Existing Liquidity - Full Interface */
              <>
                {/* YES Token Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="yes-amount">YES Tokens</Label>
                    <span className="text-xs text-muted-foreground">
                      Balance:{" "}
                      {account ? formatNumber(userYesBalance, 2) : "0.00"}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="yes-amount"
                      type="number"
                      placeholder="0.00"
                      value={yesAmount}
                      onChange={(e) => setYesAmount(e.target.value)}
                      className={cn(
                        "pr-20",
                        yesAmount &&
                          !validation.isValidAmount(yesAmount) &&
                          "border-destructive"
                      )}
                      disabled={
                        !tradingEnabled || addLiquidityMutation.isPending
                      }
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="default">YES</Badge>
                    </div>
                  </div>
                  {validation.addYesError && (
                    <p className="text-xs text-destructive">
                      {validation.addYesError}
                    </p>
                  )}

                  {/* Quick Amount Buttons for YES */}
                  <div className="flex items-center gap-2">
                    {[25, 50, 100].map((percentage) => (
                      <Button
                        key={`yes-${percentage}`}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const ratio = yesReserve / noReserve;

                          // Calculate YES amount from percentage
                          const yesFromBalance =
                            (userYesBalance * percentage) / 100;

                          // Calculate required NO amount to maintain ratio
                          const noRequired = yesFromBalance / ratio;

                          // Check if user has enough NO tokens
                          if (noRequired <= userNoBalance) {
                            // User has enough NO tokens
                            setYesAmount(yesFromBalance.toFixed(4));
                            setNoAmount(noRequired.toFixed(4));
                          } else {
                            // User doesn't have enough NO tokens, limit by NO balance
                            const maxNo = (userNoBalance * percentage) / 100;
                            const maxYes = maxNo * ratio;
                            setYesAmount(maxYes.toFixed(4));
                            setNoAmount(maxNo.toFixed(4));
                          }
                        }}
                        disabled={
                          !tradingEnabled ||
                          addLiquidityMutation.isPending ||
                          !account
                        }
                        className="flex-1 text-xs"
                      >
                        {percentage}%
                      </Button>
                    ))}
                  </div>
                </div>

                {/* NO Token Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="no-amount">NO Tokens</Label>
                    <span className="text-xs text-muted-foreground">
                      Balance:{" "}
                      {account ? formatNumber(userNoBalance, 2) : "0.00"}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="no-amount"
                      type="number"
                      placeholder="0.00"
                      value={noAmount}
                      onChange={(e) => setNoAmount(e.target.value)}
                      className={cn(
                        "pr-20",
                        noAmount &&
                          !validation.isValidAmount(noAmount) &&
                          "border-destructive"
                      )}
                      disabled={
                        !tradingEnabled || addLiquidityMutation.isPending
                      }
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="secondary">NO</Badge>
                    </div>
                  </div>
                  {validation.addNoError && (
                    <p className="text-xs text-destructive">
                      {validation.addNoError}
                    </p>
                  )}

                  {/* Quick Amount Buttons for NO */}
                  <div className="flex items-center gap-2">
                    {[25, 50, 100].map((percentage) => (
                      <Button
                        key={`no-${percentage}`}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const ratio = yesReserve / noReserve;

                          // Calculate NO amount from percentage
                          const noFromBalance =
                            (userNoBalance * percentage) / 100;

                          // Calculate required YES amount to maintain ratio
                          const yesRequired = noFromBalance * ratio;

                          // Check if user has enough YES tokens
                          if (yesRequired <= userYesBalance) {
                            // User has enough YES tokens
                            setNoAmount(noFromBalance.toFixed(4));
                            setYesAmount(yesRequired.toFixed(4));
                          } else {
                            // User doesn't have enough YES tokens, limit by YES balance
                            const maxYes = (userYesBalance * percentage) / 100;
                            const maxNo = maxYes / ratio;
                            setYesAmount(maxYes.toFixed(4));
                            setNoAmount(maxNo.toFixed(4));
                          }
                        }}
                        disabled={
                          !tradingEnabled ||
                          addLiquidityMutation.isPending ||
                          !account
                        }
                        className="flex-1 text-xs"
                      >
                        {percentage}%
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Balance Ratio Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBalanceRatio}
                  disabled={!tradingEnabled}
                  className="w-full"
                >
                  Auto-balance to pool ratio
                </Button>
              </>
            )}

            <Separator />

            {/* Add Preview */}
            {addPreview && (
              <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LP Tokens</span>
                  <span className="font-semibold">
                    {formatNumber(addPreview.lpTokens, 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Share of Pool</span>
                  <span>{formatPercentage(addPreview.shareOfPool, 2)}</span>
                </div>
                {addPreview.finalYesAmount !== parseFloat(yesAmount) && (
                  <div className="flex justify-between text-xs text-yellow-600">
                    <span>Adjusted YES Amount</span>
                    <span>{formatNumber(addPreview.finalYesAmount, 4)}</span>
                  </div>
                )}
                {addPreview.finalNoAmount !== parseFloat(noAmount) && (
                  <div className="flex justify-between text-xs text-yellow-600">
                    <span>Adjusted NO Amount</span>
                    <span>{formatNumber(addPreview.finalNoAmount, 4)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Add Button */}
            <Button
              onClick={handleAddLiquidity}
              disabled={
                !validation.canAddLiquidity || addLiquidityMutation.isPending
              }
              className="w-full"
            >
              {addLiquidityMutation.isPending
                ? "Adding Liquidity..."
                : "Add Liquidity"}
            </Button>
          </TabsContent>

          {/* Remove Liquidity Tab */}
          <TabsContent value="remove" className="space-y-4 mt-4">
            {/* Your Positions */}
            <div className="space-y-3">
              <Label>Your LP Positions</Label>
              {isLoadingPositions ? (
                <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                  Loading your positions...
                </div>
              ) : !userPositions || userPositions.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {isDemo
                      ? "Demo mode: No positions found. Add liquidity first."
                      : "You don't have any LP positions in this pool yet. Add liquidity to create a position."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-2">
                  {userPositions.map((position) => (
                    <Card
                      key={position.positionIdx}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        positionIdx === position.positionIdx.toString() &&
                          "border-primary bg-primary/5"
                      )}
                      onClick={() => {
                        setPositionIdx(position.positionIdx.toString());
                        setLpTokens(position.liquidityTokens.toString());
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Position #{position.positionIdx}
                            </Badge>
                            {positionIdx ===
                              position.positionIdx.toString() && (
                              <Badge className="bg-primary">Selected</Badge>
                            )}
                          </div>
                          <span className="text-sm font-semibold">
                            {formatNumber(position.liquidityTokens, 2)} LP
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">YES:</span>{" "}
                            {formatNumber(position.yesAmount, 2)}
                          </div>
                          <div>
                            <span className="font-medium">NO:</span>{" "}
                            {formatNumber(position.noAmount, 2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* LP Tokens Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lp-tokens">LP Tokens to Remove</Label>
                <span className="text-xs text-muted-foreground">
                  Total LP: {formatNumber(totalLpSupply, 2)}
                </span>
              </div>
              <Input
                id="lp-tokens"
                type="number"
                placeholder="0.00"
                value={lpTokens}
                onChange={(e) => setLpTokens(e.target.value)}
                disabled={removeLiquidityMutation.isPending}
                className={cn(
                  lpTokens &&
                    !validation.isValidAmount(lpTokens) &&
                    "border-destructive"
                )}
              />
              {validation.removeLpError && (
                <p className="text-xs text-destructive">
                  {validation.removeLpError}
                </p>
              )}

              {/* Quick Amount Buttons for LP */}
              <div className="flex items-center gap-2">
                {[25, 50, 75, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const amount = (totalLpSupply * percentage) / 100;
                      setLpTokens(amount.toFixed(2));
                    }}
                    disabled={removeLiquidityMutation.isPending}
                    className="flex-1 text-xs"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Remove Preview */}
            {removePreview && (
              <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YES to receive</span>
                  <span className="font-semibold">
                    {formatNumber(removePreview.yesAmount, 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NO to receive</span>
                  <span className="font-semibold">
                    {formatNumber(removePreview.noAmount, 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Share of Pool</span>
                  <span>{formatPercentage(removePreview.shareOfPool, 2)}</span>
                </div>
              </div>
            )}

            {/* Remove Button */}
            <Button
              onClick={handleRemoveLiquidity}
              disabled={
                !validation.canRemoveLiquidity ||
                removeLiquidityMutation.isPending
              }
              className="w-full"
              variant="destructive"
            >
              {removeLiquidityMutation.isPending
                ? "Removing Liquidity..."
                : "Remove Liquidity"}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 mt-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {isDemo
                ? "Demo mode: Liquidity operations are simulated. No real tokens are deposited."
                : "Live mode: You'll earn a portion of trading fees proportional to your share of the pool."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
