import { LabelValueGrid } from "@/components/LabelValueGrid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketDetailsData } from "@/types";

interface MarketDetailsProps {
  staticData: { title: string; category: string };
  dynamicData: MarketDetailsData;
}

export function MarketDetails({ staticData, dynamicData }: MarketDetailsProps) {
  const totalVolume =
    (dynamicData.totalSupplyYes + dynamicData.totalSupplyNo) / 2 / 10 ** 8;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary">{staticData.category}</Badge>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
          {staticData.title}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Data</CardTitle>
        </CardHeader>
        <CardContent>
          <LabelValueGrid
            items={[
              { label: "Total Volume", value: `${totalVolume.toFixed(2)} APT` },
              {
                label: "Status",
                value: dynamicData.status === 0 ? "Open" : "Resolved",
              },
              {
                label: "YES Shares",
                value: (dynamicData.totalSupplyYes / 10 ** 6).toLocaleString(),
              },
              {
                label: "NO Shares",
                value: (dynamicData.totalSupplyNo / 10 ** 6).toLocaleString(),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price History (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-muted-foreground">
              Price chart will be displayed here with the AMM.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
