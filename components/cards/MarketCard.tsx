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
  onChainStatus?: number;
}

interface MarketCardProps {
  market: Market;
}

const MARKET_STATUS = {
  OPEN: 0,
  CLOSED: 1,
  RESOLVED_YES: 2,
  RESOLVED_NO: 3,
} as const;

export function MarketCard({ market }: MarketCardProps) {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 } as const,
    },
  };

  // Check market status
  const now = new Date();
  const isExpired = market.resolvesOnDate < now;
  const isResolved =
    market.onChainStatus === MARKET_STATUS.RESOLVED_YES ||
    market.onChainStatus === MARKET_STATUS.RESOLVED_NO;
  const isOpen = market.onChainStatus === MARKET_STATUS.OPEN;

  // Determine badge text and styling
  const getBadgeContent = () => {
    if (isResolved) {
      return {
        text:
          market.onChainStatus === MARKET_STATUS.RESOLVED_YES
            ? "Resolved: YES"
            : "Resolved: NO",
        className: "bg-green-500/10 text-green-400 border-green-500/40",
      };
    }
    if (isExpired) {
      return {
        text: "Expired",
        className: "bg-destructive/10 text-destructive border-destructive/40",
      };
    }
    return {
      text: market.category,
      className: "",
    };
  };

  const badgeContent = getBadgeContent();

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 17 } as const,
      }}
      whileTap={{ scale: 0.98 }}
      className="h-full group"
    >
      <Link href={`/market/${market.id}`} className="h-full block">
        <Card
          className={cn(
            "h-full flex flex-col justify-between border-border/40 bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden relative",
            (isExpired || isResolved) &&
              "opacity-75 border-muted-foreground/20 hover:border-muted-foreground/30",
          )}
        >
          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
          <div>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center mb-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                >
                  <Badge
                    className={cn(
                      "text-xs font-semibold px-3 py-1 relative overflow-hidden",
                      badgeContent.className,
                    )}
                  >
                    {!isExpired && !isResolved && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatDelay: 4,
                          ease: "linear",
                        }}
                      />
                    )}
                    <span className="relative z-10">{badgeContent.text}</span>
                  </Badge>
                </motion.div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="font-medium">{market.resolvesOn}</span>
                </div>
              </div>
              <CardTitle className="text-lg font-bold leading-snug tracking-tight group-hover:text-primary transition-colors">
                {market.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 pb-4 relative z-10">
              {/* Volume Display */}
              <motion.div
                className="p-3 bg-muted/40 rounded-lg border border-border/40 group-hover:border-primary/20 transition-colors duration-300"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 3,
                      }}
                    >
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </motion.div>
                    <span>Volume</span>
                  </div>
                  <motion.div
                    className="font-mono font-bold text-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {market.totalVolume.toLocaleString()}
                    <span className="ml-1.5 text-primary">APT</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Countdown Timer */}
              {!isExpired && !isResolved && (
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

              {/* Resolved Message */}
              {isResolved && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-xs text-green-400 font-medium">
                    Market has been resolved:{" "}
                    {market.onChainStatus === MARKET_STATUS.RESOLVED_YES
                      ? "YES"
                      : "NO"}
                  </div>
                </div>
              )}

              {/* Expired Message */}
              {isExpired && !isResolved && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="text-xs text-destructive font-medium">
                    Market has expired and is awaiting resolution
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="pt-0 pb-4 relative z-10">
            <motion.div
              className="w-full text-sm font-semibold text-primary/80 group-hover:text-primary flex items-center justify-center transition-all duration-300"
              whileHover={{ x: 4 }}
            >
              {isExpired
                ? "View Details"
                : isResolved
                  ? "View Results"
                  : "View Market & Trade"}
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 2,
                }}
              >
                <ArrowRight className="ml-2 h-4 w-4" />
              </motion.div>
            </motion.div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
