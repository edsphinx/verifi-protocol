"use client";

import { Play, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTappMode } from "@/lib/tapp/context/TappModeContext";
import { cn } from "@/lib/utils";

interface TappModeToggleProps {
  className?: string;
  compact?: boolean;
}

export function TappModeToggle({
  className,
  compact = false,
}: TappModeToggleProps) {
  const { mode, setMode, isDemo, isLive } = useTappMode();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge
          variant={isDemo ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setMode("DEMO")}
        >
          <FlaskConical className="h-3 w-3 mr-1" />
          Demo
        </Badge>
        <Badge
          variant={isLive ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setMode("LIVE")}
        >
          <Play className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDemo ? (
            <FlaskConical className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          Tapp AMM Mode
        </CardTitle>
        <CardDescription>
          {isDemo
            ? "Using mock data for demonstration"
            : "Connected to live blockchain data"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={isDemo ? "default" : "outline"}
            onClick={() => setMode("DEMO")}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <FlaskConical className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Demo Mode</div>
              <div className="text-xs opacity-80">Mock data for testing</div>
            </div>
          </Button>
          <Button
            variant={isLive ? "default" : "outline"}
            onClick={() => setMode("LIVE")}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Play className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Live Mode</div>
              <div className="text-xs opacity-80">Real blockchain data</div>
            </div>
          </Button>
        </div>

        {isDemo && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Demo Mode:</strong> All pool data, swaps, and liquidity
            operations are simulated. Switch to Live Mode once the Tapp hook is
            deployed to interact with real contracts.
          </div>
        )}

        {isLive && (
          <div className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 p-3 rounded-md">
            <strong>Live Mode:</strong> You are interacting with deployed smart
            contracts on Aptos testnet. All transactions are real and require
            wallet signatures.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
