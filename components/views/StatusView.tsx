"use client";

/**
 * Status & Admin View
 * Shows protocol status, oracle registry, deployed modules, and admin controls
 * Visible to all users for transparency, admin functions only for publisher
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { OracleRegistry } from "@/components/status/OracleRegistry";
import { DeployedModules } from "@/components/status/DeployedModules";
import { TappIntegration } from "@/components/status/TappIntegration";
import { AdminChecklist } from "@/components/status/AdminChecklist";
import { AdminPanel } from "@/components/admin/AdminPanel";

export function StatusView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Protocol Status</h1>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This page shows the current protocol configuration and admin
            controls. All information is public for transparency. Admin
            functions (register/activate oracles, etc.) are only available when
            the publisher account is connected.
          </AlertDescription>
        </Alert>
      </div>

      {/* Admin Panel */}
      <AdminPanel />

      {/* Oracle Registry */}
      <Card>
        <CardHeader>
          <CardTitle>Oracle Registry</CardTitle>
          <CardDescription>
            Available on-chain data sources for market creation. Markets can
            only be created with active, whitelisted oracles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OracleRegistry />
        </CardContent>
      </Card>

      {/* Deployed Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Deployed Modules</CardTitle>
          <CardDescription>
            Smart contract modules deployed on Aptos blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeployedModules />
        </CardContent>
      </Card>

      {/* Tapp Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Tapp AMM Integration</CardTitle>
          <CardDescription>
            Tapp.Exchange AMM integration status and hook deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TappIntegration />
        </CardContent>
      </Card>

      {/* Admin Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Checklist</CardTitle>
          <CardDescription>
            Track completed setup tasks and pending configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminChecklist />
        </CardContent>
      </Card>
    </div>
  );
}
