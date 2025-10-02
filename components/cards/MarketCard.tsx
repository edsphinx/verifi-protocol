// components/cards/MarketCard.tsx

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Market {
  id: string;
  title: string;
  category: string;
  totalVolume: number;
  resolvesOn: string;
  resolvesOnDate: Date;
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
      className="h-full group" // Add `group` class to control hover effects
    >
      <Link href={`/market/${market.id}`} className="h-full">
        {/* Link wraps entire card for better UX */}
        <Card
          className={cn(
            "h-full flex flex-col justify-between transition-all duration-300",
            isExpired && "opacity-60 border-muted-foreground/20"
          )}
        >
          <div>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center mb-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-accent/40 text-accent font-semibold",
                    isExpired && "border-destructive/40 text-destructive bg-destructive/10"
                  )}
                >
                  {isExpired ? "Expired" : market.category}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                  <CalendarDays className="h-3 w-3" />
                  <span className="font-medium">{market.resolvesOn}</span>
                </div>
              </div>
              <CardTitle className="text-lg font-heading leading-snug tracking-tight group-hover:text-primary transition-colors">
                {market.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Total Volume</span>
                </div>
                <div className="font-mono font-semibold text-foreground text-base">
                  {market.totalVolume.toLocaleString()}
                  <span className="ml-1.5 text-primary/80">APT</span>
                </div>
              </div>
            </CardContent>
          </div>

          <CardFooter className="p-4 pt-2">
            {/* Subtle button that integrates with card design */}
            <div className="w-full text-sm font-semibold text-primary/80 group-hover:text-primary flex items-center transition-all duration-300">
              View & Trade
              <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
