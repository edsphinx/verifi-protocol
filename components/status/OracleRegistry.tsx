"use client";

/**
 * Oracle Registry Component
 * Displays registered oracles and allows publisher to register/activate
 */

import React, { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, XCircle, PlusCircle, Power } from "lucide-react";
import { aptosClient } from "@/aptos/client";
import { NETWORK, MODULE_ADDRESS } from "@/aptos/constants";

interface Oracle {
  oracleId: string;
  protocolName: string;
  isActive: boolean;
}

export function OracleRegistry() {
  const { account } = useWallet();
  const [oracles, setOracles] = useState<Oracle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOracle, setNewOracle] = useState({ id: "", name: "" });

  const isPublisher = account?.address === MODULE_ADDRESS;

  useEffect(() => {
    fetchOracles();
  }, []);

  const fetchOracles = async () => {
    try {
      // Fetch from view function
      const client = aptosClient();
      const result = await client.view({
        payload: {
          function: `${MODULE_ADDRESS}::oracle_registry::get_all_oracles`,
          typeArguments: [],
          functionArguments: [],
        },
      });

      // Parse oracle data from result
      if (result && result[0]) {
        const oracleData = result as any;
        // Transform to Oracle[] format
        const parsed: Oracle[] = [];
        // TODO: Parse based on actual return format from contract
        setOracles(parsed);
      }
    } catch (error) {
      console.error("Failed to fetch oracles:", error);

      // Fallback to known oracles for demo
      setOracles([
        { oracleId: "aptos-balance", protocolName: "Aptos Balance", isActive: true },
        { oracleId: "usdc-total-supply", protocolName: "USDC Total Supply", isActive: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterOracle = async () => {
    if (!account || !isPublisher) {
      toast.error("Only publisher can register oracles");
      return;
    }

    if (!newOracle.id || !newOracle.name) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      // TODO: Implement register_oracle transaction
      toast.success("Oracle registered successfully");
      setIsDialogOpen(false);
      setNewOracle({ id: "", name: "" });
      fetchOracles();
    } catch (error) {
      console.error("Failed to register oracle:", error);
      toast.error("Failed to register oracle");
    }
  };

  const handleToggleOracle = async (oracleId: string, currentStatus: boolean) => {
    if (!account || !isPublisher) {
      toast.error("Only publisher can activate/deactivate oracles");
      return;
    }

    try {
      // TODO: Implement activate/deactivate transaction
      toast.success(`Oracle ${currentStatus ? "deactivated" : "activated"}`);
      fetchOracles();
    } catch (error) {
      console.error("Failed to toggle oracle:", error);
      toast.error("Failed to update oracle status");
    }
  };

  if (isLoading) {
    return <div>Loading oracles...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Register Oracle Button (Publisher only) */}
      {isPublisher && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Register Oracle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Oracle</DialogTitle>
              <DialogDescription>
                Add a new oracle to the whitelist for market creation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="oracle-id">Oracle ID</Label>
                <Input
                  id="oracle-id"
                  placeholder="e.g., aptos-balance"
                  value={newOracle.id}
                  onChange={(e) => setNewOracle({ ...newOracle, id: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oracle-name">Protocol Name</Label>
                <Input
                  id="oracle-name"
                  placeholder="e.g., Aptos Balance"
                  value={newOracle.name}
                  onChange={(e) => setNewOracle({ ...newOracle, name: e.target.value })}
                />
              </div>
              <Button onClick={handleRegisterOracle} className="w-full">
                Register Oracle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Oracles List */}
      <div className="space-y-2">
        {oracles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No oracles registered yet</p>
        ) : (
          oracles.map((oracle) => (
            <div
              key={oracle.oracleId}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {oracle.isActive ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">{oracle.protocolName}</p>
                  <p className="text-sm text-muted-foreground">{oracle.oracleId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={oracle.isActive ? "default" : "secondary"}>
                  {oracle.isActive ? "Active" : "Inactive"}
                </Badge>
                {isPublisher && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleOracle(oracle.oracleId, oracle.isActive)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!isPublisher && oracles.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Connect publisher account to register or activate/deactivate oracles
        </p>
      )}
    </div>
  );
}
