import { PoolsView } from "@/components/views/PoolsView";

/**
 * Pools page - Server Component
 * Displays all active Tapp AMM liquidity pools
 */
export default function PoolsPage() {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            AMM Liquidity Pools
          </h1>
          <p className="text-muted-foreground">
            Explore and manage liquidity pools for prediction markets
          </p>
        </div>

        <PoolsView />
      </div>
    </main>
  );
}
