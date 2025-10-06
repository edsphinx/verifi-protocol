"use client";

import { ApprovalMockupTest } from "@/components/ApprovalMockupTest";
import { SessionKeyMockupTest } from "@/components/SessionKeyMockupTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Authentication Dashboard</h1>
          <p className="text-muted-foreground">
            Test different authentication methods for gasless-like trading
          </p>
        </div>

        <Tabs defaultValue="session" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="session">Session Keys</TabsTrigger>
            <TabsTrigger value="approval">Approval Pattern</TabsTrigger>
          </TabsList>

          <TabsContent value="session" className="mt-6">
            <SessionKeyMockupTest />
          </TabsContent>

          <TabsContent value="approval" className="mt-6">
            <ApprovalMockupTest />
          </TabsContent>
        </Tabs>

        <div className="max-w-2xl text-sm text-muted-foreground space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-foreground">Comparison:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Session Keys ✅
              </h4>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Truly gasless transactions possible</li>
                <li>Backend can execute without user</li>
                <li>Contract verifies session signature</li>
                <li>Requires Ed25519 key management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Approval Pattern ⚠️
              </h4>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Similar to Ethereum ERC-20 approve</li>
                <li>Still requires user signature each time</li>
                <li>Limited by Aptos transaction model</li>
                <li>Simpler to implement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
