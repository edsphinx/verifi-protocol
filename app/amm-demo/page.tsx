import { AMMDemoView } from "@/components/views/AMMDemoView";

export default function AMMDemoPage() {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Tapp AMM Integration Demo
          </h1>
          <p className="text-muted-foreground">
            Preview of the Automated Market Maker pool interface with mock data
          </p>
        </div>
        <AMMDemoView />
      </div>
    </main>
  );
}
