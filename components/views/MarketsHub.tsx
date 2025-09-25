import { type Market, MarketCard } from "@/components/cards/MarketCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Datos de muestra (mock data). En el futuro, esto vendrá de una llamada a la API.
const mockMarkets: Market[] = [
  {
    id: "1",
    title: "Will AMNIS Finance TVL be above $10M on Oct 31, 2025?",
    category: "DeFi",
    totalVolume: 15230,
    resolvesOn: "in 36 days",
  },
  {
    id: "2",
    title:
      "Will the floor price of Aptos Monkeys NFT be over 500 APT by year end?",
    category: "NFTs",
    totalVolume: 8750,
    resolvesOn: "Dec 31, 2025",
  },
  {
    id: "3",
    title:
      "Will 'Overmind', the next Aptos game, reach 10,000 daily active users in its first month?",
    category: "Gaming",
    totalVolume: 25400,
    resolvesOn: "Nov 15, 2025",
  },
  {
    id: "4",
    title:
      "Will a proposal to decrease staking rewards pass governance vote #78?",
    category: "Governance",
    totalVolume: 5100,
    resolvesOn: "in 3 days",
  },
];

export function MarketsHub() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="soon">Resolving Soon</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mapeamos los datos de muestra para renderizar cada MarketCard */}
            {mockMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="soon">
          {/* Aquí iría la lista filtrada de mercados que resuelven pronto */}
          <div className="text-center py-12 text-muted-foreground">
            No markets resolving soon.
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          {/* Aquí iría la lista filtrada de mercados ya resueltos */}
          <div className="text-center py-12 text-muted-foreground">
            No resolved markets to show.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
