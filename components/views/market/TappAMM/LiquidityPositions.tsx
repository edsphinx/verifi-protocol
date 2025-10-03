"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Droplets, Info } from "lucide-react";
import { formatNumber, formatPercentage, formatCurrency, type UserPosition } from "@/lib/tapp/mock/pool-data";

interface LiquidityPositionsProps {
  positions: UserPosition[];
  totalLpSupply: number;
  yesReserve: number;
  noReserve: number;
  onRemove?: (positionId: number) => void;
}

export function LiquidityPositions({
  positions,
  totalLpSupply,
  yesReserve,
  noReserve,
  onRemove,
}: LiquidityPositionsProps) {
  if (!positions || positions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground text-center">
            No liquidity positions yet.<br />Add liquidity to start earning fees.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Your Liquidity Positions
            </CardTitle>
            <CardDescription>
              {positions.length} active {positions.length === 1 ? "position" : "positions"}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {formatNumber(positions.reduce((sum, p) => sum + p.lpTokens, 0), 2)} LP
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {positions.map((position) => {
          const currentShareOfPool = (position.lpTokens / totalLpSupply) * 100;
          const currentYesValue = (position.lpTokens / totalLpSupply) * yesReserve;
          const currentNoValue = (position.lpTokens / totalLpSupply) * noReserve;
          const totalCurrentValue = currentYesValue + currentNoValue;
          const initialValue = position.yesAmount + position.noAmount;
          const pnl = totalCurrentValue - initialValue;
          const pnlPercent = (pnl / initialValue) * 100;

          return (
            <div
              key={position.positionId}
              className="border rounded-lg p-4 space-y-3 bg-card hover:bg-muted/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Position #{position.positionId}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatPercentage(currentShareOfPool, 2)} of pool
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(position.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {formatNumber(position.lpTokens, 2)} LP
                  </div>
                  <div className={`text-xs ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {pnl >= 0 ? "+" : ""}{formatPercentage(pnlPercent, 2)}
                  </div>
                </div>
              </div>

              {/* Current Value */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Current Value</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-green-600">YES:</span>
                      <span className="font-medium">{formatNumber(currentYesValue, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">NO:</span>
                      <span className="font-medium">{formatNumber(currentNoValue, 2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Initial Deposit</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-green-600/70">YES:</span>
                      <span className="text-muted-foreground text-xs">{formatNumber(position.yesAmount, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600/70">NO:</span>
                      <span className="text-muted-foreground text-xs">{formatNumber(position.noAmount, 2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PnL Summary */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Total Value: {formatNumber(totalCurrentValue, 2)}</span>
                </div>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(position.positionId)}
                    className="h-7 text-xs"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Info Footer */}
        <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2 mt-4">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Your LP tokens represent your share of the pool. As the pool earns trading fees, the value of your position increases.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
