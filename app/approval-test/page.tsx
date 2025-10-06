import { ApprovalMockupTest } from "@/components/ApprovalMockupTest";

export default function ApprovalTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Approval System Test</h1>
          <p className="text-muted-foreground">
            Test the approval-based trading flow (like Ethereum ERC-20 approve)
          </p>
        </div>
        <ApprovalMockupTest />
      </div>
    </div>
  );
}
