// components/cards/MarketCard.tsx

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Countdown } from "@/components/ui/countdown";
import { cn } from "@/lib/utils";

export interface Market {
  id: string;
  title: string;
  category: string;
  totalVolume: number;
  resolvesOn: string;
  resolvesOnDate: Date;
  resolutionTimestamp: number;
}

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 } as const,
    },
  };

  // Check if market is expired
  const now = new Date();
  const isExpired = market.resolvesOnDate < now;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -6,
        transition: { type: "spring", stiffness: 300 } as const,
      }}
      className="h-full group"
    >
      <Link href={`/market/${market.id}`} className="h-full block">
        <Card
          className={cn(
            "h-full flex flex-col justify-between border-border/40 bg-card hover:border-primary/20 transition-all duration-300",
            isExpired && "opacity-60 border-muted-foreground/20 hover:border-muted-foreground/30"
          )}
        >
          <div>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center mb-3">
                <Badge
                  className={cn(
                    "text-xs font-semibold px-3 py-1",
                    isExpired && "bg-destructive/10 text-destructive border-destructive/40"
                  )}
                >
                  {isExpired ? "Expired" : market.category}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="font-medium">{market.resolvesOn}</span>
                </div>
              </div>
              <CardTitle className="text-lg font-bold leading-snug tracking-tight group-hover:text-primary transition-colors">
                {market.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 pb-4">
              {/* Volume Display */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Volume</span>
                  </div>
                  <div className="font-mono font-bold text-foreground">
                    {market.totalVolume.toLocaleString()}
                    <span className="ml-1.5 text-primary">APT</span>
                  </div>
                </div>
              </div>

              {/* Countdown Timer */}
              {!isExpired && (
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
              )}

              {/* Expired Message */}
              {isExpired && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="text-xs text-destructive font-medium">
                    Market has expired and is awaiting resolution
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="pt-0 pb-4">
            <div className="w-full text-sm font-semibold text-primary/80 group-hover:text-primary flex items-center justify-center transition-all duration-300">
              View Market & Trade
              <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
