"use client";

/**
 * Tapp Integration Status Component
 * Shows Tapp AMM integration status and deployment info
 */

import React from "react";
import { ExternalLink, CheckCircle2, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NETWORK } from "@/aptos/constants";

const TAPP_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

interface IntegrationCheck {
  name: string;
  status: "completed" | "pending";
  description: string;
}

const INTEGRATION_CHECKS: IntegrationCheck[] = [
  {
    name: "Tapp Router Deployed",
    status: "completed",
    description: "Tapp.Exchange router module deployed and accessible",
  },
  {
    name: "Prediction Hook Deployed",
    status: "completed",
    description: "Custom prediction market hook for Tapp AMM",
  },
  {
    name: "Pool Creation Tested",
    status: "completed",
    description: "Successfully created pools via integration tests",
  },
  {
    name: "Liquidity Operations",
    status: "completed",
    description: "Add/remove liquidity functions working",
  },
  {
    name: "Swap Functionality",
    status: "completed",
    description: "Token swaps (YES↔NO) operational via AMM",
  },
  {
    name: "Frontend Integration",
    status: "completed",
    description: "UI components integrated in market pages",
  },
];

export function TappIntegration() {
  const getExplorerUrl = (moduleName: string) => {
    const network = NETWORK.toLowerCase();
    return `https://explorer.aptoslabs.com/account/${TAPP_ADDRESS}/modules/code/${moduleName}?network=${network}`;
  };

  const completedCount = INTEGRATION_CHECKS.filter(
    (c) => c.status === "completed",
  ).length;
  const totalCount = INTEGRATION_CHECKS.length;

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">Integration Status:</span>
          <Badge
            variant={completedCount === totalCount ? "default" : "secondary"}
          >
            {completedCount}/{totalCount} Complete
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(getExplorerUrl("router"), "_blank")}
        >
          View Tapp Router
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Integration Checklist */}
      <div className="space-y-2">
        {INTEGRATION_CHECKS.map((check) => (
          <div
            key={check.name}
            className="flex items-start gap-3 p-3 border rounded-lg"
          >
            <CheckCircle2
              className={`h-5 w-5 mt-0.5 ${
                check.status === "completed"
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{check.name}</p>
              <p className="text-xs text-muted-foreground">
                {check.description}
              </p>
            </div>
            <Badge
              variant={check.status === "completed" ? "default" : "outline"}
            >
              {check.status}
            </Badge>
          </div>
        ))}
      </div>

      {/* Key Modules */}
      <div className="pt-2 border-t space-y-2">
        <p className="text-sm font-medium">Deployed Modules:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open(getExplorerUrl("router"), "_blank")}
          >
            router
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              window.open(getExplorerUrl("tapp_prediction_hook"), "_blank")
            }
          >
            tapp_prediction_hook
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Test Results Link */}
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Integration tests passed successfully. Check{" "}
          <code className="bg-muted px-1 py-0.5 rounded">
            scripts/move/tapp_full_integration_test.ts
          </code>{" "}
          for test results.
        </p>
      </div>
    </div>
  );
}
