import { MarketView } from "@/components/MarketView";
import type { PageProps } from "@/types";

export default async function MarketPage({ params }: PageProps<"id", true>) {
  const resolvedParams = await params;
  const marketAddress = resolvedParams.id;

  return <MarketView marketId={marketAddress} />;
}
