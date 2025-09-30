import { CreateMarketForm } from "@/components/CreateMarketForm";

export default function CreateMarketPage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Create a New Market
          </h1>
          <p className="text-muted-foreground">
            Fill out the details below to launch a new prediction market. Once
            created, it will be open for anyone to trade.
          </p>
        </div>
        <CreateMarketForm />
      </div>
    </main>
  );
}
