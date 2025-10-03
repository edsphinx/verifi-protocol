"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Droplets, Plus, Minus, Info, AlertTriangle } from "lucide-react";
import {
  useAddLiquidity,
  useRemoveLiquidity,
  calculateAddLiquidityPreview,
  calculateRemoveLiquidityPreview,
} from "@/lib/tapp/hooks/use-liquidity";
import { usePoolData } from "@/lib/tapp/hooks/use-pool-data";
import { useTappMode } from "@/lib/tapp/context/TappModeContext";
import { formatNumber, formatPercentage } from "@/lib/tapp/mock/pool-data";

interface LiquidityPanelProps {
  marketId: string;
  yesReserve?: number;
  noReserve?: number;
  tradingEnabled?: boolean;
}

export function LiquidityPanel({
  marketId,
  yesReserve: initialYesReserve,
  noReserve: initialNoReserve,
  tradingEnabled: initialTradingEnabled,
}: LiquidityPanelProps) {
  // Fetch live pool data - this will auto-update when refetchQueries is called
  const { data: poolData } = usePoolData(marketId);

  // Use live data if available, fallback to initial props
  const yesReserve = poolData?.yesReserve ?? initialYesReserve ?? 0;
  const noReserve = poolData?.noReserve ?? initialNoReserve ?? 0;
  const tradingEnabled = poolData?.tradingEnabled ?? initialTradingEnabled ?? false;
  // Add liquidity state
  const [yesAmount, setYesAmount] = useState("");
  const [noAmount, setNoAmount] = useState("");

  // Remove liquidity state
  const [lpTokens, setLpTokens] = useState("");
  const [positionIdx, setPositionIdx] = useState("");

  const { isDemo } = useTappMode();
  const addLiquidityMutation = useAddLiquidity();
  const removeLiquidityMutation = useRemoveLiquidity();

  // Calculate total LP supply (geometric mean of reserves)
  const totalLpSupply = Math.sqrt(yesReserve * noReserve);

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
              Add
            </TabsTrigger>
            <TabsTrigger value="remove">
              <Minus className="h-4 w-4 mr-2" />
              Remove
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

            {/* YES Token Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="yes-amount">YES Tokens</Label>
                <span className="text-xs text-muted-foreground">
                  Reserve: {formatNumber(yesReserve, 0)}
                </span>
              </div>
              <div className="relative">
                <Input
                  id="yes-amount"
                  type="number"
                  placeholder="0.00"
                  value={yesAmount}
                  onChange={(e) => setYesAmount(e.target.value)}
                  className="pr-20"
                  disabled={!tradingEnabled || addLiquidityMutation.isPending}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="default">YES</Badge>
                </div>
              </div>

              {/* Quick Amount Buttons for YES */}
              <div className="flex items-center gap-2">
                {[10, 25, 50].map((percentage) => (
                  <Button
                    key={`yes-${percentage}`}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const amount = (yesReserve * percentage) / 100;
                      setYesAmount(amount.toFixed(2));
                      // Auto-calculate NO amount
                      const ratio = yesReserve / noReserve;
                      setNoAmount((amount / ratio).toFixed(2));
                    }}
                    disabled={!tradingEnabled || addLiquidityMutation.isPending}
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
                  Reserve: {formatNumber(noReserve, 0)}
                </span>
              </div>
              <div className="relative">
                <Input
                  id="no-amount"
                  type="number"
                  placeholder="0.00"
                  value={noAmount}
                  onChange={(e) => setNoAmount(e.target.value)}
                  className="pr-20"
                  disabled={!tradingEnabled || addLiquidityMutation.isPending}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="secondary">NO</Badge>
                </div>
              </div>

              {/* Quick Amount Buttons for NO */}
              <div className="flex items-center gap-2">
                {[10, 25, 50].map((percentage) => (
                  <Button
                    key={`no-${percentage}`}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const amount = (noReserve * percentage) / 100;
                      setNoAmount(amount.toFixed(2));
                      // Auto-calculate YES amount
                      const ratio = yesReserve / noReserve;
                      setYesAmount((amount * ratio).toFixed(2));
                    }}
                    disabled={!tradingEnabled || addLiquidityMutation.isPending}
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
                !tradingEnabled ||
                !addPreview ||
                parseFloat(yesAmount) <= 0 ||
                parseFloat(noAmount) <= 0 ||
                addLiquidityMutation.isPending
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
            {/* Position Index */}
            <div className="space-y-2">
              <Label htmlFor="position-idx">Position ID</Label>
              <Input
                id="position-idx"
                type="number"
                placeholder="Enter your position ID"
                value={positionIdx}
                onChange={(e) => setPositionIdx(e.target.value)}
                disabled={removeLiquidityMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {isDemo
                  ? "In demo mode, use any number (e.g., 0)"
                  : "Find your position ID in your liquidity positions"}
              </p>
            </div>

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
              />

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
                !removePreview ||
                !positionIdx ||
                parseFloat(lpTokens) <= 0 ||
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
  );
}
