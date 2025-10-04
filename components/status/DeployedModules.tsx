"use client";

/**
 * Deployed Modules Component
 * Shows all deployed smart contract modules with explorer links
 */

import React from "react";
import { ExternalLink, CheckCircle2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NETWORK, MODULE_ADDRESS } from "@/aptos/constants";

interface Module {
  name: string;
  address: string;
  description: string;
}

const MODULES: Module[] = [
  {
    name: "verifi_protocol",
    address: MODULE_ADDRESS || "",
    description: "Core protocol - Markets, treasury, resolution logic",
  },
  {
    name: "oracle_registry",
    address: MODULE_ADDRESS || "",
    description: "Oracle whitelist and access control",
  },
  {
    name: "oracles",
    address: MODULE_ADDRESS || "",
    description: "Oracle routing and data fetching",
  },
  {
    name: "oracle_aptos_balance",
    address: MODULE_ADDRESS || "",
    description: "Aptos balance oracle implementation",
  },
  {
    name: "oracle_usdc",
    address: MODULE_ADDRESS || "",
    description: "USDC total supply oracle implementation",
  },
  {
    name: "verifi_resolvers",
    address: MODULE_ADDRESS || "",
    description: "Market resolution logic (friend module)",
  },
  {
    name: "access_control",
    address: MODULE_ADDRESS || "",
    description: "Admin permission management",
  },
  {
    name: "tapp_prediction_hook",
    address: MODULE_ADDRESS || "",
    description: "Tapp AMM integration hook for prediction markets",
  },
];

export function DeployedModules() {
  const getExplorerUrl = (
    address: string,
    type: "account" | "module" = "account",
  ) => {
    const network = NETWORK.toLowerCase();
    if (type === "account") {
      return `https://explorer.aptoslabs.com/account/${address}?network=${network}`;
    }
    return `https://explorer.aptoslabs.com/account/${address}?network=${network}#modules`;
  };

  return (
    <div className="space-y-4">
      {/* Network Info */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="text-sm font-medium">Network:</span>
          <Badge>{NETWORK}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            window.open(getExplorerUrl(MODULE_ADDRESS || ""), "_blank")
          }
        >
          View Publisher Account
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Modules List */}
      <div className="space-y-2">
        {MODULES.map((module) => (
          <div
            key={module.name}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-mono text-sm font-medium">{module.name}</p>
                <p className="text-xs text-muted-foreground">
                  {module.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() =>
                window.open(
                  `https://explorer.aptoslabs.com/account/${module.address}/modules/code/${module.name}?network=${NETWORK.toLowerCase()}`,
                  "_blank",
                )
              }
            >
              View Code
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Module Address */}
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Module Address:{" "}
          <code className="bg-muted px-1 py-0.5 rounded">{MODULE_ADDRESS}</code>
        </p>
      </div>
    </div>
  );
}
