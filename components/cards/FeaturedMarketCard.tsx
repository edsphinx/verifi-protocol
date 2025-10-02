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
import { Progress } from "@/components/ui/progress"; // Un nuevo componente de UI
import type { Market } from "./MarketCard";

interface FeaturedMarketCardProps {
  market: Market;
}

export function FeaturedMarketCard({ market }: FeaturedMarketCardProps) {
  // Simulación de probabilidad basada en el volumen (reemplazar con datos reales del AMM después)
  const yesProbability = market.totalVolume > 10000 ? 65 : 45;

  return (
    <Card className="w-full overflow-hidden border-primary/20 bg-gradient-to-br from-card to-muted/50">
      <div className="grid md:grid-cols-2">
        <div className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="p-0">
              <div className="flex items-center justify-between mb-2">
                <Badge>{market.category}</Badge>
                <CardDescription>{market.resolvesOn}</CardDescription>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight leading-tight">
                {market.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Total Volume:</span>
                <span className="font-mono font-semibold text-foreground">
                  {market.totalVolume.toLocaleString()} APT
                </span>
              </div>
            </CardContent>
          </div>
          <CardFooter className="p-0 mt-6">
            <Link href={`/market/${market.id}`} className="w-full">
              <Button className="w-full" size="lg">
                View & Trade
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </div>

        <div className="p-6 bg-muted/30 flex flex-col justify-center items-center">
          <h3 className="text-lg font-semibold mb-4">Current Probability</h3>
          <div className="w-full space-y-3">
            <div className="flex justify-between text-lg font-mono">
              <span className="text-green-400">YES</span>
              <span className="font-bold">{yesProbability}%</span>
            </div>
            <Progress
              value={yesProbability}
              className="h-2.5 bg-green-400/20 [&>div]:bg-green-400"
            />
            <div className="flex justify-between text-lg font-mono">
              <span className="text-red-400">NO</span>
              <span className="font-bold">{100 - yesProbability}%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
