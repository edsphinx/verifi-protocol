"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import {
  ArrowDownUp,
  Info,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useSwap, calculateSwapPreview } from "@/lib/tapp/hooks/use-swap";
import { usePoolData } from "@/lib/tapp/hooks/use-pool-data";
import { useTappMode } from "@/lib/tapp/context/TappModeContext";
import {
  formatNumber,
  formatPercentage,
  formatCurrency,
} from "@/lib/tapp/mock/pool-data";
import { calculateMinOutput } from "@/lib/tapp/cpmm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMarketData } from "@/aptos/queries/use-market-data";

interface SwapInterfaceProps {
  marketId: string;
  yesTokenAddress: string;
  noTokenAddress: string;
  yesReserve?: number;
  noReserve?: number;
  tradingEnabled?: boolean;
}

export function SwapInterface({
  marketId,
  yesTokenAddress,
  noTokenAddress,
  yesReserve: initialYesReserve,
  noReserve: initialNoReserve,
  tradingEnabled: initialTradingEnabled,
}: SwapInterfaceProps) {
  // All hooks must be called before any conditional returns
  const { account } = useWallet();
  const [amountIn, setAmountIn] = useState("");
  const [yesToNo, setYesToNo] = useState(true);
  const [slippageTolerance, setSlippageTolerance] = useState(0.5); // 0.5%
  const { isDemo } = useTappMode();
  const swapMutation = useSwap();

  // Fetch live pool data - this will auto-update when refetchQueries is called
  const { data: poolData, isLoading: isLoadingPool } = usePoolData(marketId, account?.address.toString());

  // Fetch user's token balances
  const { data: marketData, isLoading: isLoadingMarket } = useMarketData({
    id: marketId,
    yesToken: yesTokenAddress,
    noToken: noTokenAddress,
  });

  // Clear input after successful swap
  useEffect(() => {
    if (swapMutation.isSuccess) {
      setAmountIn("");
      swapMutation.reset(); // Reset mutation state
    }
  }, [swapMutation.isSuccess]);

  const isLoading = isLoadingPool || isLoadingMarket;

  // Show loading state while fetching pool data
  if (isLoading) {
    return (
      <Card className="min-h-[600px] flex items-center justify-center">
        <VeriFiLoader message="Loading swap interface..." />
      </Card>
    );
  }

  // Use live data if available, fallback to initial props
  // Reserves come in on-chain format (with 10^6 multiplier), convert to display format
  const yesReserveOnChain = poolData?.yesReserve ?? initialYesReserve ?? 0;
  const noReserveOnChain = poolData?.noReserve ?? initialNoReserve ?? 0;
  const yesReserve = yesReserveOnChain / 1_000_000;
  const noReserve = noReserveOnChain / 1_000_000;
  const tradingEnabled =
    poolData?.tradingEnabled ?? initialTradingEnabled ?? false;

  // User balances (divide by 10^6 to convert from on-chain format - YES/NO tokens have 6 decimals)
  const userYesBalance = (marketData?.yesBalance || 0) / 10 ** 6;
  const userNoBalance = (marketData?.noBalance || 0) / 10 ** 6;

  console.log("[SwapInterface] User balances:", {
    yesBalance: userYesBalance,
    noBalance: userNoBalance,
    yesBalanceRaw: marketData?.yesBalance,
    noBalanceRaw: marketData?.noBalance,
  });

  console.log("[SwapInterface] Current swap direction:", {
    yesToNo,
    meaning: yesToNo ? "YES → NO" : "NO → YES",
    inputToken: yesToNo ? "YES" : "NO",
    outputToken: yesToNo ? "NO" : "YES",
    inputBalance: yesToNo ? userYesBalance : userNoBalance,
    outputBalance: yesToNo ? userNoBalance : userYesBalance,
  });

  // Calculate swap preview (using regular function, not hook)
  // All values are in display format (human-readable)
  const amountInNum = parseFloat(amountIn) || 0;
  const preview = calculateSwapPreview(
    marketId,
    amountInNum,
    yesToNo,
    yesReserve,
    noReserve,
  );

  const minAmountOut = preview
    ? calculateMinOutput(preview.outputAmount, slippageTolerance)
    : 0;

  const handleSwap = () => {
    if (!preview || amountInNum <= 0) return;

    swapMutation.mutate({
      marketId,
      amountIn: amountInNum,
      yesToNo,
      minAmountOut,
    });
  };

  const handleFlipDirection = () => {
    setYesToNo(!yesToNo);
    setAmountIn(""); // Clear input when flipping
  };

  const inputToken = yesToNo ? "YES" : "NO";
  const outputToken = yesToNo ? "NO" : "YES";
  const inputReserve = yesToNo ? yesReserve : noReserve;
  const outputReserve = yesToNo ? noReserve : yesReserve;
  const inputBalance = yesToNo ? userYesBalance : userNoBalance;
  const outputBalance = yesToNo ? userNoBalance : userYesBalance;

  const isPriceImpactHigh = preview && preview.priceImpact > 5;
  const isPriceImpactVeryHigh = preview && preview.priceImpact > 10;

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
              <ArrowDownUp className="h-5 w-5" />
              Swap Tokens
            </CardTitle>
            <CardDescription>
              Trade YES/NO tokens through the AMM
            </CardDescription>
          </div>
          {isDemo && <Badge variant="outline">Demo Mode</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pool Liquidity Info */}
        {(yesReserve > 0 || noReserve > 0) && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Pool Liquidity
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">YES:</span>{" "}
                <span className="font-semibold text-green-600">
                  {formatNumber(yesReserve, 0)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">NO:</span>{" "}
                <span className="font-semibold text-red-600">
                  {formatNumber(noReserve, 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Trading Status Warning */}
        {!tradingEnabled && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Trading is currently disabled. This market may be resolved or
              paused.
            </AlertDescription>
          </Alert>
        )}

        {/* Input Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount-in">You Pay</Label>
            <p className="text-xs text-muted-foreground">
              Balance: {account ? formatNumber(inputBalance, 2) : "0.00"} {inputToken}
            </p>
          </div>
          <div className="relative">
            <Input
              id="amount-in"
              type="number"
              placeholder="0.00"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="text-lg pr-20"
              disabled={!tradingEnabled || swapMutation.isPending}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Badge variant={yesToNo ? "default" : "secondary"}>
                {inputToken}
              </Badge>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex items-center gap-2">
            {[25, 50, 75].map((percentage) => (
              <Button
                key={percentage}
                variant="outline"
                size="sm"
                onClick={() => {
                  const amount = (inputBalance * percentage) / 100;
                  setAmountIn(amount.toFixed(2));
                }}
                disabled={!tradingEnabled || swapMutation.isPending || !account}
                className="flex-1 text-xs"
              >
                {percentage}%
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmountIn(inputBalance.toFixed(2))}
              disabled={!tradingEnabled || swapMutation.isPending || !account}
              className="flex-1 text-xs font-semibold"
            >
              MAX
            </Button>
          </div>
        </div>

        {/* Flip Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleFlipDirection}
            disabled={!tradingEnabled || swapMutation.isPending}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Output Token */}
        <div className="space-y-2">
          <Label htmlFor="amount-out">You Receive</Label>
          <div className="relative">
            <Input
              id="amount-out"
              type="text"
              value={preview ? formatNumber(preview.outputAmount, 4) : "0.00"}
              readOnly
              className="text-lg pr-20 bg-muted"
              disabled
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Badge variant={!yesToNo ? "default" : "secondary"}>
                {outputToken}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Reserve: {formatNumber(outputReserve, 0)} {outputToken}
          </p>
        </div>

        {/* Slippage Tolerance */}
        <div className="space-y-2">
          <Label htmlFor="slippage">Slippage Tolerance</Label>
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0].map((value) => (
              <Button
                key={value}
                variant={slippageTolerance === value ? "default" : "outline"}
                size="sm"
                onClick={() => setSlippageTolerance(value)}
                disabled={!tradingEnabled}
              >
                {value}%
              </Button>
            ))}
            <Input
              id="slippage"
              type="number"
              step="0.1"
              value={slippageTolerance}
              onChange={(e) =>
                setSlippageTolerance(parseFloat(e.target.value) || 0)
              }
              className="w-20"
              disabled={!tradingEnabled}
            />
          </div>
        </div>

        <Separator />

        {/* Swap Details */}
        {preview && amountInNum > 0 && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price Impact</span>
              <span
                className={
                  isPriceImpactVeryHigh
                    ? "text-destructive font-semibold"
                    : isPriceImpactHigh
                      ? "text-yellow-500 font-semibold"
                      : ""
                }
              >
                {formatPercentage(preview.priceImpact, 2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Effective Price</span>
              <span>
                1 {inputToken} = {formatNumber(preview.effectivePrice, 4)}{" "}
                {outputToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trading Fee (0.3%)</span>
              <span>
                {formatNumber(preview.fee, 4)} {inputToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Received</span>
              <span>
                {formatNumber(minAmountOut, 4)} {outputToken}
              </span>
            </div>
          </div>
        )}

        {/* Price Impact Warning */}
        {isPriceImpactVeryHigh && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Price impact is very high (
              {formatPercentage(preview!.priceImpact, 2)}). Consider reducing
              your swap amount.
            </AlertDescription>
          </Alert>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={
            !tradingEnabled ||
            !preview ||
            amountInNum <= 0 ||
            amountInNum > inputBalance ||
            swapMutation.isPending ||
            !account
          }
          className="w-full"
        >
          {swapMutation.isPending
            ? "Swapping..."
            : !account
              ? "Connect Wallet"
              : !tradingEnabled
                ? "Trading Disabled"
                : amountInNum > inputBalance
                  ? "Insufficient Balance"
                  : amountInNum <= 0
                    ? "Enter Amount"
                    : `Swap ${inputToken} for ${outputToken}`}
        </Button>

        {/* Info Box */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {isDemo
                ? "Demo mode: Swaps are simulated and won't affect real balances."
                : "Live mode: Swaps execute on-chain and require wallet signatures."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
