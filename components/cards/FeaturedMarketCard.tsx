import { ArrowRight, TrendingUp, CalendarDays, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Countdown } from "@/components/ui/countdown";
import type { Market } from "./MarketCard";

interface FeaturedMarketCardProps {
  market: Market;
}

export function FeaturedMarketCard({ market }: FeaturedMarketCardProps) {
  // Default 50/50 probability - will be replaced with real AMM data later
  const yesProbability = 50;
  const noProbability = 100 - yesProbability;

  return (
    <Card className="w-full overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 hover:border-primary/40 transition-all duration-300">
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-4">
        {/* Left: Market Info */}
        <div className="p-6 md:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="text-xs font-semibold px-3 py-1">
                {market.category}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{market.resolvesOn}</span>
              </div>
            </div>

            <CardHeader className="p-0">
              <CardTitle className="text-xl md:text-2xl font-semibold tracking-tight leading-tight">
                {market.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 space-y-3">
              {/* Volume */}
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Total Volume</span>
                </div>
                <span className="font-mono font-bold text-foreground text-lg">
                  {market.totalVolume.toLocaleString()}
                  <span className="ml-1.5 text-primary">APT</span>
                </span>
              </div>

              {/* Countdown */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Time Remaining</span>
                </div>
                <Countdown
                  targetTimestamp={market.resolutionTimestamp}
                  variant="compact"
                  showIcon={false}
                  className="text-sm font-semibold"
                />
              </div>
            </CardContent>
          </div>

          <Link href={`/market/${market.id}`} className="w-full mt-6">
            <Button className="w-full" size="lg">
              View Market & Trade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Right: Probability Display */}
        <div className="p-6 md:p-8 bg-muted/30 border-l border-border/40 flex flex-col justify-center">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Market Probability
              </h3>
              <p className="text-xs text-muted-foreground/70">
                Equal probability until first trade
              </p>
            </div>

            {/* YES Probability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">YES</span>
                <span className="text-xl font-bold font-mono text-green-400">
                  {yesProbability}%
                </span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden border border-green-400/20">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  style={{ width: `${yesProbability}%` }}
                />
              </div>
            </div>

            {/* NO Probability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">NO</span>
                <span className="text-xl font-bold font-mono text-red-400">
                  {noProbability}%
                </span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden border border-red-400/20">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                  style={{ width: `${noProbability}%` }}
                />
              </div>
            </div>

            {/* Price Info */}
            <div className="pt-4 border-t border-border/40">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-xs text-green-400/70 mb-1">YES Price</div>
                  <div className="text-sm font-bold font-mono text-green-400">
                    {(yesProbability / 100).toFixed(2)} APT
                  </div>
                </div>
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-xs text-red-400/70 mb-1">NO Price</div>
                  <div className="text-sm font-bold font-mono text-red-400">
                    {(noProbability / 100).toFixed(2)} APT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
