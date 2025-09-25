import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface Market {
  id: string;
  title: string;
  category: string;
  totalVolume: number;
  resolvesOn: string;
}

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors duration-300">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg leading-tight">
            {market.title}
          </CardTitle>
          <Badge variant="outline">{market.category}</Badge>
        </div>
        <CardDescription>Resolves {market.resolvesOn}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span>Total Volume</span>
        </div>
        <span className="font-mono font-semibold text-foreground">
          {market.totalVolume.toLocaleString()} APT
        </span>
      </CardContent>
      <CardFooter>
        <Link href={`/market/${market.id}`} className="w-full">
          <Button className="w-full">
            View & Trade
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
