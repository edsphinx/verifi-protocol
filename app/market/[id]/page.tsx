import { MarketView } from "@/components/MarketView";
import type { PageProps } from "@/lib/aptos/types";

export default function MarketPage({ params }: PageProps<"id">) {
  const marketAddress = params.id;

  return <MarketView marketId={marketAddress} />;
}
